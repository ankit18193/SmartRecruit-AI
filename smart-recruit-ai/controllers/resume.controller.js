const fs = require("fs");
const Resume = require("../models/Resume.model");
const Job = require("../models/job.model");
const { resumeQueue } = require("../queues/resumeQueue");


async function analyze(req, res) {
  try {
    if (!req.file)
      return res.status(400).json({ message: "Resume file required" });

    const resumeUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

    
    const resume = await Resume.create({
      candidateId: req.user.id,
      resumeUrl,
      fileName: req.file.originalname,
      status: "Pending",
      processedAt: null,
      error: "",
    });

    await resumeQueue.add(
      "parseResume",
      {
        filePath: req.file.path,
        candidateId: req.user.id,
        resumeId: resume._id, 
        fileName: req.file.originalname,
      },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
      },
    );

    return res.status(202).json({
      id: resume._id,
      status: resume.status,
    });
  } catch (error) {
    console.error("Resume Analyzer (queued) Error:", error);

    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({ message: "Resume upload failed" });
  }
}

async function getStatus(req, res) {
  try {
    const resume = await Resume.findById(req.params.resumeId).select(
      "status processedAt error updatedAt",
    );
    if (!resume) return res.status(404).json({ message: "Resume not found" });
    res.json({
      id: resume._id,
      status: resume.status,
      processedAt: resume.processedAt,
      updatedAt: resume.updatedAt,
      error: resume.error,
    });
  } catch (err) {
    console.error("Get Resume Status Error:", err);
    res.status(500).json({ message: "Failed to fetch status" });
  }
}

async function getMyResumes(req, res) {
  try {
    const resumes = await Resume.find({ candidateId: req.user.id }).sort({
      updatedAt: -1,
    });
    res.json(resumes);
  } catch (error) {
    console.error("Fetch Resumes Error:", error);
    res.status(500).json({ message: "Failed to load resumes" });
  }
}

async function recommendJobs(req, res) {
  try {
    const resume = await Resume.findById(req.params.resumeId);
    if (!resume) return res.status(404).json({ message: "Resume not found" });

    const jobs = await Job.find();
    const userSkills = (resume.skills || []).map((s) => s.toLowerCase().trim());
    const userExp = Number(resume.experience) || 0;

    const recommendedJobs = jobs.map((job) => {
      const requiredSkills = job.requiredSkills || [];
      let skillMatchCount = 0;
      const matchedSkills = [];

      requiredSkills.forEach((reqSkill) => {
        const normalizedReq = reqSkill.toLowerCase().trim();
        const isMatch = userSkills.some(
          (userSkill) =>
            userSkill.includes(normalizedReq) ||
            normalizedReq.includes(userSkill),
        );
        if (isMatch) {
          skillMatchCount++;
          matchedSkills.push(reqSkill);
        }
      });

      const skillScore =
        requiredSkills.length > 0
          ? (skillMatchCount / requiredSkills.length) * 100
          : 100;
      const jobExp = Number(job.experienceRequired) || 0;
      let expScore = 100;
      if (jobExp > 0)
        expScore =
          userExp >= jobExp ? 100 : Math.round((userExp / jobExp) * 100);

      const finalMatchPercentage = Math.round(
        skillScore * 0.6 + expScore * 0.4,
      );

      return {
        ...job._doc,
        matchPercentage: finalMatchPercentage,
        skillScore: Math.round(skillScore),
        expScore: Math.round(expScore),
        matchedSkills,
      };
    });

    const topJobs = recommendedJobs
      .filter((job) => job.matchPercentage >= 30)
      .sort((a, b) => b.matchPercentage - a.matchPercentage);
    res.json(topJobs);
  } catch (error) {
    console.error("🔥 Recommendation Engine Error:", error);
    res.status(500).json({ message: "Failed to generate recommendations" });
  }
}

module.exports = {
  analyze,
  getMyResumes,
  recommendJobs,
  getStatus,
};
