const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const parseResume = require("../utils/parseResume.js");
const { generateAIResponse } = require("../utils/ai.service.js");

const Application = require("../models/Application.model.js");
const Job = require("../models/job.model.js");
const Notification = require("../models/notification.model.js"); 
const Interview = require("../models/interview.model.js");
const { createNotification } = require("../utils/notification.service");
const User = require("../models/user.model.js");

const auth = require("../middleware/auth.middleware.js");
const role = require("../middleware/role.middleware.js");

const router = express.Router();



const uploadDir = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); 
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files are allowed"));
    }
    cb(null, true);
  }
});




router.post("/apply/:jobId", auth, role("candidate"), upload.single("resume"), async (req, res) => {
  try {
    const jobId = req.params.jobId;

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    if (!req.file) return res.status(400).json({ message: "Resume file is required" });

    const existingApplication = await Application.findOne({
      candidateId: req.user.id,
      jobId: jobId
    });

    if (existingApplication) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: "You have already applied for this job" });
    }

    const resumeText = await parseResume(req.file.path);

    // 🔥 UPGRADED & STRICT AI PROMPT
    const prompt = `
You are an Elite Technical ATS and a highly strict Senior Engineering Manager at a FAANG company.
Analyze this Candidate's Resume against the Job Description to determine their exact fitment.

JOB TITLE: ${job.title}
REQUIRED EXPERIENCE: ${job.experienceRequired || 'Not specified (assume fresher friendly)'} Years

JOB DESCRIPTION:
"""
${job.description}
"""

RESUME TEXT:
"""
${resumeText}
"""

⚠️ CRITICAL EVALUATION RULES (MUST FOLLOW):
1. STRICT EXPERIENCE PENALTY: Read the 'REQUIRED EXPERIENCE' above carefully. If the job requires experience (e.g., 2 Years) and the resume belongs to a Fresher (0 years) or someone with less experience, you MUST heavily penalize the fitmentScore. A fresher applying for an experienced role should NEVER get above a 50-60% match, even if all their skills match perfectly.
2. SKILLS ILLUSION: Do not be fooled by mere keyword matching. Assess if they have actually used the skills in professional projects.
3. REALISTIC SCORING: Be extremely critical. 90%+ scores are reserved ONLY for candidates who perfectly match BOTH the required years of experience AND the technical skills.

⚠️ OUTPUT FORMAT:
Return ONLY a raw, valid JSON object. DO NOT include markdown formatting (like \`\`\`json). DO NOT include any text outside the JSON.

{
  "skills": ["string"],
  "fitmentScore": number,
  "missingSkills": ["string"],
  "experienceRelevance": "Low" | "Medium" | "High",
  "strengths": ["string"],
  "improvements": ["string"]
}
`;

    let parsedAI;

    try {
      let aiResult = await generateAIResponse(prompt);
      
      aiResult = aiResult.replace(/```json/gi, "").replace(/```/g, "").trim();
      
      const startIndex = aiResult.indexOf("{");
      const endIndex = aiResult.lastIndexOf("}");
      
      if (startIndex === -1 || endIndex === -1) {
        throw new Error("No JSON brackets found in AI response");
      }

      parsedAI = JSON.parse(aiResult.substring(startIndex, endIndex + 1));

    } catch (aiErr) {
      console.error("AI/JSON Error:", aiErr.message);
      fs.unlinkSync(req.file.path);
      return res.status(500).json({
        message: "AI Analysis failed. Try again."
      });
    }

    const application = await Application.create({
      candidateId: req.user.id,
      jobId: job._id,
      resumeUrl: `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`,
      parsedResumeText: resumeText,
      candidateSkills: Array.isArray(parsedAI.skills) ? parsedAI.skills : [],
      fitmentScore: parsedAI.fitmentScore || 0,
      missingSkills: Array.isArray(parsedAI.missingSkills) ? parsedAI.missingSkills : [],
      experienceRelevance: parsedAI.experienceRelevance || "Unknown",
      strengths: Array.isArray(parsedAI.strengths) ? parsedAI.strengths : [],
      improvements: Array.isArray(parsedAI.improvements) ? parsedAI.improvements : []
    });

    try {
      // 1. Notify Candidate
      await createNotification({
        userId: req.user.id,
        message: `Awesome! You successfully applied for ${job.title}. Your application is Under Review 👀`,
        type: "application_update",
        actionUrl: "/my-applications" 
      });

      // 2. Fetch Candidate details to get their name
      const candidate = await User.findById(req.user.id);

      // 3. Notify Recruiter
      await createNotification({
        userId: job.recruiterId,
        message: `New Application: ${candidate ? candidate.name : 'A candidate'} applied for "${job.title}". Tap to review!`,
        type: "application_update",
        actionUrl: `/recruiter/job/${job._id}` 
      });
    } catch (notifErr) {
      console.warn("⚠️ Notification failed:", notifErr.message);
    }

    res.status(201).json({
      message: "Application submitted successfully",
      application
    });

  } catch (error) {
    console.error("Application Route Error:", error);
    res.status(500).json({
      message: "Server Error during application"
    });
  }
});



router.get("/my-applications", auth, role("candidate"), async (req, res) => {
  try {
    const applications = await Application.find({
      candidateId: req.user.id
    })
      // 🔥 FIX: Added 'companyName', 'workplaceType', 'department' explicitly so the frontend can read them
      .populate("jobId", "title location companyName workplaceType department openings experienceRequired")
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (error) {
    console.error("Fetch Candidate Applications Error:", error);
    res.status(500).json({
      message: "Failed to load your applications"
    });
  }
});


router.get("/ai-insights", auth, role("candidate"), async (req, res) => {
  try {
    const application = await Application.findOne({
      candidateId: req.user.id
    }).sort({ createdAt: -1 });

    if (!application) {
      return res.json({
        strengths: [],
        missingSkills: [],
        improvements: []
      });
    }

    res.json({
      strengths: application.strengths || [],
      missingSkills: application.missingSkills || [],
      improvements: application.improvements || []
    });

  } catch (error) {
    console.error("AI Insights Error:", error);
    res.status(500).json({
      message: "Failed to load AI insights"
    });
  }
});



router.get("/", auth, role("recruiter"), async (req, res) => {
  try {
    const myJobs = await Job.find({ recruiterId: req.user.id }).select('_id');
    const myJobIds = myJobs.map(job => job._id.toString());

    let filter = {};

    if (req.query.jobId) {
      if (!myJobIds.includes(req.query.jobId)) {
        return res.status(403).json({ message: "Unauthorized: You do not own this job" });
      }
      filter = { jobId: req.query.jobId };
    } else {
      filter = { jobId: { $in: myJobIds } };
    }

    const applications = await Application.find(filter)
      .populate("candidateId", "name email phone")
      // 🔥 FIX: Added 'companyName' and 'workplaceType' here as well, just in case the recruiter view needs them
      .populate("jobId", "title description recruiterId companyName workplaceType location department openings experienceRequired")
      .sort({ fitmentScore: -1 })
      .lean();

    const applicationsWithScores = await Promise.all(
      applications.map(async (app) => {
        const interviewData = await Interview.findOne({
          candidate: app.candidateId._id,
          job: app.jobId._id 
        });

        return {
          ...app,
          interviewScore: interviewData ? interviewData.score : null,
          interviewStatus: interviewData ? interviewData.status : null 
        };
      })
    );

    res.json({ applications: applicationsWithScores });
  } catch (err) {
    console.error("Fetch Recruiter Applications Error:", err);
    res.status(500).json({ message: "Failed to load candidates" });
  }
});


router.get("/stats/:jobId", auth, role("recruiter"), async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const job = await Job.findById(jobId);
    if (!job || job.recruiterId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized: You do not own this job" });
    }

    const apps = await Application.find({ jobId });
    const total = apps.length;
    const shortlisted = apps.filter(a => a.status === "Shortlisted").length;
    const avgScore = total > 0 ? (apps.reduce((acc, a) => acc + a.fitmentScore, 0) / total).toFixed(1) : 0;

    res.json({ total, shortlisted, avgScore });
  } catch (err) {
    res.status(500).json({ message: "Error fetching stats" });
  }
});



router.get("/:id", auth, role("recruiter"), async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate("candidateId", "name email phone")
      // 🔥 FIX: Included new fields here so single application view doesn't break
      .populate("jobId","title description recruiterId companyName workplaceType location department openings experienceRequired"); 

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (application.jobId.recruiterId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized access to candidate data" });
    }

    res.json(application);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch application" });
  }
});


router.patch("/:id/status", auth, role("recruiter"), async (req, res) => {
  try {
    const { status } = req.body;
    
    const existingApp = await Application.findById(req.params.id).populate("jobId");
    if (!existingApp || existingApp.jobId.recruiterId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized to update this application" });
    }

    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate("jobId", "title");

    let notifMessage = `Your application status for ${application.jobId?.title || 'a job'} has been updated to: ${status}`;
    if (status === "Shortlisted" || status === "Interview Scheduled") {
      notifMessage = `🎉 Great news! You have been ${status} for ${application.jobId?.title}.`;
    } else if (status === "Rejected") {
      notifMessage = `Update: Your application for ${application.jobId?.title} was not moved forward this time. Keep trying! 💪`;
    }

    await createNotification({
      userId: application.candidateId,
      message: notifMessage,
      type: "application_update",
      actionUrl: "/my-applications" 
    });

    res.json(application);
  } catch (err) {
    res.status(500).json({ message: "Status update failed" });
  }
});


router.patch("/schedule/:id", auth, role("recruiter"), async (req, res) => {
  try {
    const { interviewDate, interviewMode, interviewLink } = req.body;
    
    const existingApp = await Application.findById(req.params.id).populate("jobId");
    if (!existingApp || existingApp.jobId.recruiterId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized to schedule interview for this candidate" });
    }

    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { 
        interviewScheduled: true, 
        interviewDate, 
        interviewMode, 
        interviewLink,
        status: "Interview Scheduled"
      },
      { new: true }
    ).populate("jobId", "title");

    const formattedDate = new Date(interviewDate).toLocaleDateString('en-IN', {
      weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    const isAI = interviewMode === "AI" || interviewMode === "AI Interview";
    
    await createNotification({
      userId: application.candidateId,
      message: `🚀 Get Ready! Your ${isAI ? '🤖 AI ' : ''}Interview for ${application.jobId?.title || 'the job'} is scheduled for ${formattedDate}.`,
      type: "interview_scheduled",
      actionUrl: "/my-applications"
    });

    res.json({ message: "Interview scheduled successfully", application });
  } catch (error) {
    res.status(500).json({ message: "Interview scheduling failed" });
  }
});

module.exports = router;