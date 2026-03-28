const express = require("express");
const auth = require("../middleware/auth.middleware.js");
const role = require("../middleware/role.middleware.js");

const Application = require("../models/Application.model.js");
const Resume = require("../models/Resume.model.js");


const { analyzeResume } = require("../utils/ai.service.js");

const router = express.Router();



router.get(
  "/career-insight",
  auth,
  role("candidate"),
  async (req, res) => {
    try {

      
      const applications = await Application.find({
        candidateId: req.user.id
      });

      const resumes = await Resume.find({
        candidateId: req.user.id
      });

      
      const skills = [
        ...new Set(
          applications.flatMap(a => a.candidateSkills || [])
        )
      ];

      
      const resumeSkills = [
        ...new Set(
          resumes.flatMap(r => r.skills || [])
        )
      ];

      
      const mergedSkills = [
        ...new Set([...skills, ...resumeSkills])
      ];

      
      if (mergedSkills.length === 0) {
        return res.json({
          strengths: [],
          missingSkills: [],
          suggestions: []
        });
      }

      
      const aiData = await analyzeResume(
        mergedSkills.join(", ")
      );

      
      return res.json(aiData);

    } catch (error) {
      console.error("AI Career Insight Error:", error);

      return res.status(500).json({
        strengths: [],
        missingSkills: [],
        suggestions: [],
        message: "Failed to generate insights"
      });
    }
  }
);

module.exports = router;