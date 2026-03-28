const express = require("express");
const auth = require("../middleware/auth.middleware.js");
const role = require("../middleware/role.middleware.js");
const Interview = require("../models/interview.model.js");
const Job = require("../models/job.model.js");
const Application = require("../models/Application.model.js");
const { generateAIResponse } = require("../utils/ai.service.js");
const Notification = require("../models/notification.model");





const router = express.Router();



router.post("/start/:jobId", auth, role("candidate"), async (req, res) => {
    try {
        const job = await Job.findById(req.params.jobId);
        if (!job) return res.status(404).json({ message: "Job not found" });

        const application = await Application.findOne({
            candidateId: req.user.id,
            jobId: job._id
        });

        if (!application) {
            return res.status(400).json({ message: "Apply to job first" });
        }

        const prompt = `
You are a technical interviewer.

Based on this Job Description:
${job.description}

And this Candidate Resume:
${application.parsedResumeText}

Generate exactly 3 technical interview questions.
Return JSON in this format:

{
  "questions": ["q1", "q2", "q3"]
}
`;

        let aiResult = await generateAIResponse(prompt);

        aiResult = aiResult.replace(/```json|```/g, "").trim();

        const parsed = JSON.parse(aiResult);

        const interview = await Interview.create({
            candidate: req.user.id,  // 🔥 Changed from candidateId to candidate
            job: job._id,            // 🔥 Changed from jobId to job
            questions: parsed.questions
        });

        res.json(interview);

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server Error" });
    }
});



router.post("/submit/:interviewId", auth, role("candidate"), async (req, res) => {
    try {
        const { answers } = req.body;

        const interview = await Interview.findById(req.params.interviewId);
        if (!interview) return res.status(404).json({ message: "Interview not found" });

        const prompt = `
You are a senior technical interviewer. Evaluate these candidate answers.

Questions:
${JSON.stringify(interview.questions)}

Candidate Answers:
${JSON.stringify(answers)}

Evaluate candidate strictly. Return ONLY valid JSON in this exact format without any extra text or markdown:
{
  "score": 85,
  "strengths": ["point1", "point2"],
  "weaknesses": ["point1", "point2"],
  "suggestions": ["improve1", "improve2"]
}
`;

        // 1. CALL GEMINI
        let aiResult = "";
        try {
            aiResult = await generateAIResponse(prompt);
        } catch (aiErr) {
            console.error("Gemini Quota/API Error:", aiErr);
            return res.status(500).json({ message: "Gemini API Error: " + aiErr.message });
        }

        // 2. PARSE JSON SAFELY
        let parsed;
        try {
            let cleanString = aiResult.replace(/```json/g, "").replace(/```/g, "").trim();
            const jsonMatch = cleanString.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                parsed = JSON.parse(jsonMatch[0]);
            } else {
                parsed = JSON.parse(cleanString);
            }
        } catch (parseErr) {
            console.error("JSON Parsing Error. Raw AI Output:", aiResult);
            return res.status(500).json({ message: "AI Formatting Error. Could not read evaluation." });
        }

        // 3. SAVE INTERVIEW DATA
        interview.answers = answers;
        interview.score = parsed.score || 0;
        interview.evaluation = {
            strengths: parsed.strengths || [],
            weaknesses: parsed.weaknesses || [],
            suggestions: parsed.suggestions || []
        };
        interview.status = "Completed";
        await interview.save();

        // 4. SAVE NOTIFICATION (Wrapped in Try/Catch so it NEVER crashes the app)
        try {
            const targetUser = interview.candidate || interview.candidateId || req.user.id;
            await Notification.create({
                userId: targetUser, // Agar aapke schema me 'user' likha hai, toh backend crash is wajah se ho raha tha.
                message: "Your interview has been evaluated 🎯",
                type: "interview"
            });
        } catch (notifErr) {
            console.warn("⚠️ Notification couldn't be saved, but ignoring to show results:", notifErr.message);
        }

        // 5. SEND SUCCESS RESPONSE
        res.json(parsed);

    } catch (error) {
        console.error("🔥 SUBMIT CRITICAL ERROR:", error);
        // Frontend ko direct error message bhejenge taaki pata chale fat kahan raha hai
        res.status(500).json({ message: "Backend Crash: " + error.message });
    }
});



router.get("/result/:jobId/:candidateId", auth, role("recruiter"), async (req, res) => {
    try {
        const { jobId, candidateId } = req.params;
        
        // 🔥 FIX: Map the params to the actual schema fields (job and candidate)
        const interview = await Interview.findOne({ 
            job: jobId, 
            candidate: candidateId 
        });

        if (!interview) {
            return res.status(404).json({ message: "Interview not taken yet." });
        }

        // Check if the interview actually has an evaluation before sending
        if (!interview.evaluation && !interview.score) {
             return res.status(400).json({ message: "Interview in progress, no score yet."});
        }

        res.json(interview);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server Error" });
    }
});


router.get("/:jobId", auth, role("candidate"), async (req, res) => {
    try {
        const interview = await Interview.findOne({ 
            job: req.params.jobId, 
            candidate: req.user.id 
        });
        
        if (!interview) {
            return res.status(200).json(null); 
        }
        
        res.status(200).json(interview); 
    } catch (error) {
        console.log("Fetch Interview Error:", error);
        res.status(500).json({ message: "Server Error fetching interview status" });
    }
});




module.exports = router;
