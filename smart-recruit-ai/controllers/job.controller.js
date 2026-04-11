const Job = require("../models/job.model");
const Application = require("../models/Application.model");
const Interview = require("../models/interview.model");
const { invalidateByPattern } = require("../middleware/cache.middleware");
const { client: esClient } = require("../utils/elastic");

async function createJob(req, res) {
  try {
    const {
      title,
      companyName,
      description,
      requiredSkills,
      experienceRequired,
      location,
      workplaceType,
      department,
      salary,
      jobType,
      openings,
      applicationDeadline,
    } = req.body;

    const job = await Job.create({
      title,
      companyName,
      description,
      requiredSkills,
      experienceRequired,
      location,
      workplaceType,
      department,
      salary,
      jobType,
      openings,
      applicationDeadline,
      recruiterId: req.user.id,
    });

    await esClient.index({
      index: "jobs",
      id: job._id.toString(),
      document: {
        title: job.title,
        description: job.description,
        requiredSkills: job.requiredSkills,
        experienceRequired: job.experienceRequired,
      },
    });

    try {
      await invalidateByPattern("jobs:*");
      await invalidateByPattern("jobs:recommended:*");
      await invalidateByPattern(`jobs:my:${req.user.id}`);
    } catch (e) {
      console.error("Cache invalidation after job create failed", e);
    }

    res.status(201).json(job);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
}

async function getAllJobs(req, res) {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
}

async function getRecommendedJobs(req, res) {
  try {
    const applications = await Application.find({ candidateId: req.user.id });
    if (applications.length === 0) return res.json([]);

    const candidateSkills = [
      ...new Set(applications.flatMap((app) => app.candidateSkills)),
    ];
    const jobs = await Job.find();

    const recommendedJobs = jobs.map((job) => {
      const matchedSkills = job.requiredSkills.filter((skill) =>
        candidateSkills.includes(skill),
      );
      const matchPercentage =
        job.requiredSkills.length > 0
          ? Math.round((matchedSkills.length / job.requiredSkills.length) * 100)
          : 0;
      return { ...job._doc, matchPercentage, matchedSkills };
    });

    const sortedJobs = recommendedJobs.sort(
      (a, b) => b.matchPercentage - a.matchPercentage,
    );
    res.json(sortedJobs);
  } catch (error) {
    console.error("Recommended Jobs Error:", error);
    res.status(500).json({ message: "Failed to fetch recommended jobs" });
  }
}

async function getMyJobs(req, res) {
  try {
    const jobs = await Job.find({ recruiterId: req.user.id }).sort({
      createdAt: -1,
    });
    res.json(jobs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
}

async function getJobById(req, res) {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });
    res.json(job);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
}

async function getJobApplications(req, res) {
  try {
    const jobId = req.params.jobId;
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });
    if (job.recruiterId.toString() !== req.user.id)
      return res
        .status(403)
        .json({ message: "Unauthorized: You do not own this job" });

    const applications = await Application.find({ jobId })
      .populate("candidateId", "name email")
      .sort({ fitmentScore: -1 });

    const totalApplicants = applications.length;
    const averageScore =
      totalApplicants > 0
        ? applications.reduce((acc, curr) => acc + curr.fitmentScore, 0) /
          totalApplicants
        : 0;
    const highFit = applications.filter((a) => a.fitmentScore >= 70).length;
    const mediumFit = applications.filter(
      (a) => a.fitmentScore >= 40 && a.fitmentScore < 70,
    ).length;
    const lowFit = applications.filter((a) => a.fitmentScore < 40).length;

    res.json({
      totalApplicants,
      averageScore: Number(averageScore.toFixed(2)),
      highFit,
      mediumFit,
      lowFit,
      applications,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
}

async function getJobDashboard(req, res) {
  try {
    const jobId = req.params.jobId;
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });
    if (job.recruiterId.toString() !== req.user.id)
      return res.status(403).json({ message: "Unauthorized access" });

    const applications = await Application.find({ jobId }).populate(
      "candidateId",
      "name email",
    );
    const interviews = await Interview.find({ jobId });
    const totalApplicants = applications.length;

    const averageFitmentScore =
      totalApplicants > 0
        ? applications.reduce((acc, a) => acc + a.fitmentScore, 0) /
          totalApplicants
        : 0;
    const averageInterviewScore =
      interviews.length > 0
        ? interviews.reduce((acc, i) => acc + (i.score || 0), 0) /
          interviews.length
        : 0;
    const interviewed = interviews.length;
    const appliedOnly = totalApplicants - interviewed;
    const highPerformers = interviews.filter((i) => i.score >= 75).length;
    const mediumPerformers = interviews.filter(
      (i) => i.score >= 50 && i.score < 75,
    ).length;
    const lowPerformers = interviews.filter((i) => i.score < 50).length;

    const rankedCandidates = applications.map((app) => {
      const interview = interviews.find(
        (i) => i.candidateId.toString() === app.candidateId._id.toString(),
      );
      const interviewScore = interview?.score || 0;
      const finalScore = Math.round(
        0.7 * app.fitmentScore + 0.3 * interviewScore,
      );
      let verdict = "Reject";
      if (finalScore >= 85) verdict = "Strong Hire";
      else if (finalScore >= 70) verdict = "Good Candidate";
      else if (finalScore >= 50) verdict = "Needs Improvement";

      return {
        name: app.candidateId.name,
        email: app.candidateId.email,
        fitmentScore: app.fitmentScore,
        interviewScore,
        finalScore,
        verdict,
        strengths: app.strengths || [],
        missingSkills: app.missingSkills || [],
        improvements: app.improvements || [],
      };
    });

    const topCandidates = rankedCandidates
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, 5);

    res.json({
      totalApplicants,
      averageFitmentScore: Number(averageFitmentScore.toFixed(2)),
      averageInterviewScore: Number(averageInterviewScore.toFixed(2)),
      appliedOnly,
      interviewed,
      highPerformers,
      mediumPerformers,
      lowPerformers,
      topCandidates,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
}

async function deleteJob(req, res) {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });
    if (job.recruiterId.toString() !== req.user.id)
      return res
        .status(403)
        .json({ message: "Not authorized to delete this job" });

    await Job.findByIdAndDelete(req.params.jobId);

    try {
      await invalidateByPattern(`job:${req.params.jobId}*`);
      await invalidateByPattern("jobs:*");
      await invalidateByPattern(`jobs:my:${req.user.id}`);
      await invalidateByPattern("jobs:recommended:*");
    } catch (e) {
      console.error("Cache invalidation after job delete failed", e);
    }

    res.json({ message: "Job deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error deleting job" });
  }
}

async function searchJobs(req, res) {
  try {
    const { query } = req.query;

    const result = await esClient.search({
      index: "jobs",
      query: {
        multi_match: {
          query,
          fields: ["title", "description", "requiredSkills"],
        },
      },
    });

    const jobs = result.hits.hits.map(hit => ({
      id: hit._id,
      ...hit._source,
    }));

    res.json(jobs);

  } catch (err) {
    console.error("❌ Search Error:", err.message);
    res.status(500).json({ message: "Search failed" });
  }
}

module.exports = {
  createJob,
  getAllJobs,
  getRecommendedJobs,
  getMyJobs,
  getJobById,
  getJobApplications,
  getJobDashboard,
  deleteJob,
   searchJobs
};
