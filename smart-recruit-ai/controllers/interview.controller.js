const Job = require('../models/job.model');
const Application = require('../models/Application.model');
const Interview = require('../models/interview.model');
const Notification = require('../models/notification.model');
const { generateAIResponse } = require('../utils/ai.service');

async function startInterview(req, res) {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const application = await Application.findOne({ candidateId: req.user.id, jobId: job._id });
    if (!application) return res.status(400).json({ message: 'Apply to job first' });

    const prompt = `\nYou are a technical interviewer.\n\nBased on this Job Description:\n${job.description}\n\nAnd this Candidate Resume:\n${application.parsedResumeText}\n\nGenerate exactly 3 technical interview questions.\nReturn JSON in this format:\n\n{\n  "questions": ["q1", "q2", "q3"]\n}\n`;

    let aiResult = await generateAIResponse(prompt);
    aiResult = aiResult.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(aiResult);

    const interview = await Interview.create({ candidate: req.user.id, job: job._id, questions: parsed.questions });
    res.json(interview);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
}

async function submitInterview(req, res) {
  try {
    const { answers } = req.body;
    const interview = await Interview.findById(req.params.interviewId);
    if (!interview) return res.status(404).json({ message: 'Interview not found' });

    const prompt = `\nYou are a senior technical interviewer. Evaluate these candidate answers.\n\nQuestions:\n${JSON.stringify(interview.questions)}\n\nCandidate Answers:\n${JSON.stringify(answers)}\n\nEvaluate candidate strictly. Return ONLY valid JSON in this exact format without any extra text or markdown:\n{\n  "score": 85,\n  "strengths": ["point1", "point2"],\n  "weaknesses": ["point1", "point2"],\n  "suggestions": ["improve1", "improve2"]\n}\n`;

    let aiResult = '';
    try {
      aiResult = await generateAIResponse(prompt);
    } catch (aiErr) {
      console.error('Gemini Quota/API Error:', aiErr);
      return res.status(500).json({ message: 'Gemini API Error: ' + aiErr.message });
    }

    let parsed;
    try {
      let cleanString = aiResult.replace(/```json/g, '').replace(/```/g, '').trim();
      const jsonMatch = cleanString.match(/\{[\s\S]*\}/);
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
      else parsed = JSON.parse(cleanString);
    } catch (parseErr) {
      console.error('JSON Parsing Error. Raw AI Output:', aiResult);
      return res.status(500).json({ message: 'AI Formatting Error. Could not read evaluation.' });
    }

    interview.answers = answers;
    interview.score = parsed.score || 0;
    interview.evaluation = { strengths: parsed.strengths || [], weaknesses: parsed.weaknesses || [], suggestions: parsed.suggestions || [] };
    interview.status = 'Completed';
    await interview.save();

    try {
      const targetUser = interview.candidate || interview.candidateId || req.user.id;
      await Notification.create({ userId: targetUser, message: 'Your interview has been evaluated 🎯', type: 'interview' });
    } catch (notifErr) {
      console.warn("⚠️ Notification couldn't be saved, but ignoring to show results:", notifErr.message);
    }

    res.json(parsed);
  } catch (error) {
    console.error('🔥 SUBMIT CRITICAL ERROR:', error);
    res.status(500).json({ message: 'Backend Crash: ' + error.message });
  }
}

async function getInterviewResult(req, res) {
  try {
    const { jobId, candidateId } = req.params;
    const interview = await Interview.findOne({ job: jobId, candidate: candidateId });
    if (!interview) return res.status(404).json({ message: 'Interview not taken yet.' });
    if (!interview.evaluation && !interview.score) return res.status(400).json({ message: 'Interview in progress, no score yet.' });
    res.json(interview);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
}

async function getCandidateInterview(req, res) {
  try {
    const interview = await Interview.findOne({ job: req.params.jobId, candidate: req.user.id });
    if (!interview) return res.status(200).json(null);
    res.status(200).json(interview);
  } catch (error) {
    console.error('Fetch Interview Error:', error);
    res.status(500).json({ message: 'Server Error fetching interview status' });
  }
}

module.exports = { startInterview, submitInterview, getInterviewResult, getCandidateInterview };
