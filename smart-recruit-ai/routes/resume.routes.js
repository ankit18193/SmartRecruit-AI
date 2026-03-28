const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const Resume = require("../models/Resume.model.js");
const Job = require("../models/job.model.js");

const parseResume = require("../utils/parseResume.js");
const { analyzeResume } = require("../utils/ai.service.js");

const auth = require("../middleware/auth.middleware.js");
const role = require("../middleware/role.middleware.js");

const { createNotification } = require("../utils/notification.service"); 

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

const upload = multer({ storage });



router.post(
    "/analyze",
    auth,
    role("candidate"),
    upload.single("resume"),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "Resume file required" });
        }
  
       
        const resumeText = await parseResume(req.file.path);
  
        
        const parsed = await analyzeResume(resumeText);
        console.log("🔥 FINAL PARSED DATA READY FOR DB");
  
        
        const resume = await Resume.findOneAndUpdate(
          { candidateId: req.user.id },
          {
            resumeUrl: `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`,
            fileName: req.file.originalname,
            parsedText: resumeText,
            
           
            skills: parsed.skills,
            insights: parsed.insights,
            aiScore: parsed.aiScore,
            
            
            confidenceScore: parsed.confidenceScore,
            marketLevel: parsed.marketLevel,
            careerStrategy: parsed.careerStrategy,
            mindsetBoost: parsed.mindsetBoost,

            
            projects: parsed.projects,
            certifications: parsed.certifications,
            cgpa: parsed.education.cgpa
          },
          { new: true, upsert: true }
        );

        await createNotification({
          userId: req.user.id,
          message: `Your resume '${req.file.originalname}' has been successfully analyzed by AI! Check your new matching scores.`,
          type: "ai_insight"
        });
  
        res.status(200).json(resume);
  
      } catch (error) {
        console.error("Resume Analyzer Error:", error.message);
        
        
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
  
        
        if (error.message === "QUOTA_EXCEEDED") {
          return res.status(429).json({ 
            message: "AI Quota Exceeded. Please try again later." 
          });
        }

        res.status(500).json({ message: "Resume analysis failed" });
      }
    }
  );



router.get("/my-resumes", auth, role("candidate"), async (req, res) => {
  try {
    const resumes = await Resume.find({
      candidateId: req.user.id
    }).sort({ updatedAt: -1 }); 

    res.json(resumes);

  } catch (error) {
    res.status(500).json({
      message: "Failed to load resumes"
    });
  }
});



router.get("/recommend-jobs/:resumeId", auth, async (req, res) => {
  try {
    
    const resume = await Resume.findById(req.params.resumeId);
    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    
    const jobs = await Job.find();

    
    const userSkills = (resume.skills || []).map(s => s.toLowerCase().trim());
    
    
    const userExp = Number(resume.experience) || 0;

    
    const recommendedJobs = jobs.map(job => {
      
      const requiredSkills = job.requiredSkills || [];
      let skillMatchCount = 0;
      const matchedSkills = [];

      
      requiredSkills.forEach(reqSkill => {
        const normalizedReq = reqSkill.toLowerCase().trim();
        
        
        const isMatch = userSkills.some(userSkill => 
          userSkill.includes(normalizedReq) || normalizedReq.includes(userSkill)
        );

        if (isMatch) {
          skillMatchCount++;
          matchedSkills.push(reqSkill);
        }
      });

      const skillScore = requiredSkills.length > 0
        ? (skillMatchCount / requiredSkills.length) * 100
        : 100; 

     
      const jobExp = Number(job.experienceRequired) || 0;
      let expScore = 100;
      
      if (jobExp > 0) {
        expScore = userExp >= jobExp ? 100 : Math.round((userExp / jobExp) * 100);
      }

      
      const finalMatchPercentage = Math.round((skillScore * 0.6) + (expScore * 0.4));

      return {
        ...job._doc,
        matchPercentage: finalMatchPercentage,
        skillScore: Math.round(skillScore),
        expScore: Math.round(expScore),
        matchedSkills
      };
    });

    
    const topJobs = recommendedJobs
      .filter(job => job.matchPercentage >= 30)
      .sort((a, b) => b.matchPercentage - a.matchPercentage);

    res.json(topJobs);

  } catch (error) {
    console.error("🔥 Recommendation Engine Error:", error);
    res.status(500).json({ message: "Failed to generate recommendations" });
  }
});

module.exports = router;