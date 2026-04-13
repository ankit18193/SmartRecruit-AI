// const { io } = require("../server");
const { Worker } = require("bullmq");
const { connection } = require("../queues/resumeQueue");

const parseResume = require("../utils/parseResume");
const { analyzeResume } = require("../utils/ai.service.js");

const Resume = require("../models/Resume.model");
const { createNotification } = require("../utils/notification.service");

const fs = require("fs");

const worker = new Worker(
  "resumeQueue",

  async (job) => {
    const { filePath, candidateId, resumeId, fileName } = job.data;

    console.log(`Processing Job: ${job.id}`);

    try {
      
      await Resume.findByIdAndUpdate(resumeId, {
        status: "Processing",
        error: "",
        processedAt: null,
      });

      
      const resumeText = await parseResume(filePath);

      
      const parsed = await analyzeResume(resumeText);

      
      const updated = await Resume.findByIdAndUpdate(
        resumeId,
        {
          parsedText: resumeText,
          skills: parsed.skills || [],
          insights: parsed.insights || {},
          aiScore: parsed.aiScore || 0,
          confidenceScore: parsed.confidenceScore || 0,
          marketLevel: parsed.marketLevel || "beginner",
          careerStrategy: parsed.careerStrategy || {},
          mindsetBoost: parsed.mindsetBoost || "",
          projects: parsed.projects || [],
          certifications: parsed.certifications || [],
          cgpa: parsed.education?.cgpa || 0,
          status: "Completed",
          processedAt: new Date(),
          error: "",
        },
        { returnDocument: "after" },
      );

      
      await createNotification({
        userId: candidateId,
        message: `Your resume '${fileName || "resume"}' is ready!`,
        type: "ai_insight",
      });

      
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      console.log(`Job Completed: ${job.id}`);
      if (updated) {
        io.emit("resumeUpdated", {
          resumeId: updated._id,
          status: updated.status,
          aiScore: updated.aiScore,
          insights: updated.insights,
        });
      }

      return updated;
    } catch (err) {
      console.error(` Job Failed: ${job.id}`, err.message);

      
      if (job.attemptsMade >= 2) {
        await Resume.findByIdAndUpdate(resumeId, {
          status: "Failed",
          error: err.message,
          processedAt: new Date(),
        });
      }

      throw err;
    }
  },

  {
    connection,
    concurrency: 3, 
  },
);



worker.on("completed", (job) => {
  console.log(`Worker: Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`Worker: Job ${job.id} failed`, err.message);
});

worker.on("active", (job) => {
  console.log(`Worker: Job ${job.id} started`);
});

module.exports = worker;
