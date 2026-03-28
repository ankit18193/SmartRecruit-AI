const express = require("express");
const Job = require("../models/job.model.js");
const auth = require("../middleware/auth.middleware.js");
const Application = require("../models/Application.model.js");
const role = require("../middleware/role.middleware.js");
const Interview = require("../models/interview.model.js");

const router = express.Router();



router.post("/", auth, role("recruiter"), async (req, res) => {
  try {
    const { 
      title, 
      companyName,         // 🔥 NEW
      description, 
      requiredSkills, 
      experienceRequired,
      location,
      workplaceType,       // 🔥 NEW
      department,          // 🔥 NEW
      salary,
      jobType,
      openings,            // 🔥 NEW
      applicationDeadline  // 🔥 NEW
    } = req.body;

    const job = await Job.create({
      title,
      companyName,         // 🔥 NEW
      description,
      requiredSkills,
      experienceRequired,
      location,
      workplaceType,       // 🔥 NEW
      department,          // 🔥 NEW
      salary,
      jobType,
      openings,            // 🔥 NEW
      applicationDeadline, // 🔥 NEW
      recruiterId: req.user.id
    });

    res.status(201).json(job);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});


router.get("/", auth, async (req, res) => {
  try {
    // 🔥 Simply fetch every job in the database, sorted by newest
    const jobs = await Job.find().sort({ createdAt: -1 });

    res.json(jobs);

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
});



router.get("/recommended", auth, role("candidate"), async (req, res) => {
  try {
    const applications = await Application.find({
      candidateId: req.user.id
    });

    if (applications.length === 0) {
      return res.json([]);
    }

    const candidateSkills = [
      ...new Set(
        applications.flatMap(app => app.candidateSkills)
      )
    ];

    
    const jobs = await Job.find();

    const recommendedJobs = jobs.map(job => {
      const matchedSkills = job.requiredSkills.filter(skill =>
        candidateSkills.includes(skill)
      );

      const matchPercentage =
        job.requiredSkills.length > 0
          ? Math.round((matchedSkills.length / job.requiredSkills.length) * 100)
          : 0;

      return {
        ...job._doc,
        matchPercentage,
        matchedSkills
      };
    });

    const sortedJobs = recommendedJobs.sort(
      (a, b) => b.matchPercentage - a.matchPercentage
    );

    res.json(sortedJobs);

  } catch (error) {
    console.error("Recommended Jobs Error:", error);
    res.status(500).json({
      message: "Failed to fetch recommended jobs"
    });
  }
});



router.get("/my-jobs", auth, role("recruiter"), async (req, res) => {
  try {
    const jobs = await Job.find({ recruiterId: req.user.id })
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
});



router.get("/:jobId", async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.json(job);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
});



router.get("/:jobId/applications", auth, role("recruiter"), async (req, res) => {
  try {
    const jobId = req.params.jobId;

    
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });
    if (job.recruiterId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized: You do not own this job" });
    }

    const applications = await Application.find({ jobId })
      .populate("candidateId", "name email")
      .sort({ fitmentScore: -1 });

    const totalApplicants = applications.length;

    const averageScore =
      totalApplicants > 0
        ? applications.reduce((acc, curr) => acc + curr.fitmentScore, 0) / totalApplicants
        : 0;

    const highFit = applications.filter(a => a.fitmentScore >= 70).length;
    const mediumFit = applications.filter(
      a => a.fitmentScore >= 40 && a.fitmentScore < 70
    ).length;
    const lowFit = applications.filter(a => a.fitmentScore < 40).length;

    res.json({
      totalApplicants,
      averageScore: Number(averageScore.toFixed(2)),
      highFit,
      mediumFit,
      lowFit,
      applications
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
});



router.get("/:jobId/dashboard", auth, role("recruiter"), async (req, res) => {
  try {
    const jobId = req.params.jobId;

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    // 🔒 SECURITY FIX: Verify Recruiter owns this job
    if (job.recruiterId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    const applications = await Application.find({ jobId })
      .populate("candidateId", "name email");

    const interviews = await Interview.find({ jobId });

    const totalApplicants = applications.length;

    const averageFitmentScore =
      totalApplicants > 0
        ? applications.reduce((acc, a) => acc + a.fitmentScore, 0) / totalApplicants
        : 0;

    const averageInterviewScore =
      interviews.length > 0
        ? interviews.reduce((acc, i) => acc + (i.score || 0), 0) / interviews.length
        : 0;

    const interviewed = interviews.length;
    const appliedOnly = totalApplicants - interviewed;

    const highPerformers = interviews.filter(i => i.score >= 75).length;
    const mediumPerformers = interviews.filter(i => i.score >= 50 && i.score < 75).length;
    const lowPerformers = interviews.filter(i => i.score < 50).length;


   
    const rankedCandidates = applications.map(app => {

      const interview = interviews.find(i =>
        i.candidateId.toString() === app.candidateId._id.toString()
      );

      const interviewScore = interview?.score || 0;

      const finalScore = Math.round(
        (0.7 * app.fitmentScore) + (0.3 * interviewScore)
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
        improvements: app.improvements || []
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
      topCandidates
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
});



router.delete("/:jobId", auth, role("recruiter"), async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.recruiterId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to delete this job" });
    }

    await Job.findByIdAndDelete(req.params.jobId);

    res.json({ message: "Job deleted successfully" });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error deleting job" });
  }
});

module.exports = router;