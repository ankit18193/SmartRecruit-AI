const fs = require('fs');
const Application = require('../models/Application.model');
const Job = require('../models/job.model');
const Notification = require('../models/notification.model');
const Interview = require('../models/interview.model');
const User = require('../models/user.model');
const parseResume = require('../utils/parseResume');
const { generateAIResponse } = require('../utils/ai.service');
const { createNotification } = require('../utils/notification.service');

async function applyToJob(req, res) {
  try {
    const jobId = req.params.jobId;
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (!req.file) return res.status(400).json({ message: 'Resume file is required' });

    const existingApplication = await Application.findOne({ candidateId: req.user.id, jobId: jobId });
    if (existingApplication) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'You have already applied for this job' });
    }

    const resumeText = await parseResume(req.file.path);

    const prompt = `\nYou are an Elite Technical ATS and a highly strict Senior Engineering Manager at a FAANG company.\nAnalyze this Candidate's Resume against the Job Description to determine their exact fitment.\n\nJOB TITLE: ${job.title}\nREQUIRED EXPERIENCE: ${job.experienceRequired || 'Not specified (assume fresher friendly)'} Years\n\nJOB DESCRIPTION:\n"""\n${job.description}\n"""\n\nRESUME TEXT:\n"""\n${resumeText}\n"""\n\n⚠️ CRITICAL EVALUATION RULES (MUST FOLLOW):\n1. STRICT EXPERIENCE PENALTY: Read the 'REQUIRED EXPERIENCE' above carefully. If the job requires experience (e.g., 2 Years) and the resume belongs to a Fresher (0 years) or someone with less experience, you MUST heavily penalize the fitmentScore. A fresher applying for an experienced role should NEVER get above a 50-60% match, even if all their skills match perfectly.\n2. SKILLS ILLUSION: Do not be fooled by mere keyword matching. Assess if they have actually used the skills in professional projects.\n3. REALISTIC SCORING: Be extremely critical. 90%+ scores are reserved ONLY for candidates who perfectly match BOTH the required years of experience AND the technical skills.\n\n⚠️ OUTPUT FORMAT:\nReturn ONLY a raw, valid JSON object. DO NOT include markdown formatting (like \`\`\`json). DO NOT include any text outside the JSON.\n\n{\n  "skills": ["string"],\n  "fitmentScore": number,\n  "missingSkills": ["string"],\n  "experienceRelevance": "Low" | "Medium" | "High",\n  "strengths": ["string"],\n  "improvements": ["string"]\n}\n`;

    let parsedAI;
    try {
      let aiResult = await generateAIResponse(prompt);
      aiResult = aiResult.replace(/```json/gi, '').replace(/```/g, '').trim();
      const startIndex = aiResult.indexOf('{');
      const endIndex = aiResult.lastIndexOf('}');
      if (startIndex === -1 || endIndex === -1) throw new Error('No JSON brackets found in AI response');
      parsedAI = JSON.parse(aiResult.substring(startIndex, endIndex + 1));
    } catch (aiErr) {
      console.error('AI/JSON Error:', aiErr.message);
      fs.unlinkSync(req.file.path);
      return res.status(500).json({ message: 'AI Analysis failed. Try again.' });
    }

    const application = await Application.create({
      candidateId: req.user.id,
      jobId: job._id,
      resumeUrl: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`,
      parsedResumeText: resumeText,
      candidateSkills: Array.isArray(parsedAI.skills) ? parsedAI.skills : [],
      fitmentScore: parsedAI.fitmentScore || 0,
      missingSkills: Array.isArray(parsedAI.missingSkills) ? parsedAI.missingSkills : [],
      experienceRelevance: parsedAI.experienceRelevance || 'Unknown',
      strengths: Array.isArray(parsedAI.strengths) ? parsedAI.strengths : [],
      improvements: Array.isArray(parsedAI.improvements) ? parsedAI.improvements : []
    });

    try {
      await createNotification({ userId: req.user.id, message: `Awesome! You successfully applied for ${job.title}. Your application is Under Review 👀`, type: 'application_update', actionUrl: '/my-applications' });
      const candidate = await User.findById(req.user.id);
      await createNotification({ userId: job.recruiterId, message: `New Application: ${candidate ? candidate.name : 'A candidate'} applied for "${job.title}". Tap to review!`, type: 'application_update', actionUrl: `/recruiter/job/${job._id}` });
    } catch (notifErr) {
      console.warn('⚠️ Notification failed:', notifErr.message);
    }

    res.status(201).json({ message: 'Application submitted successfully', application });
  } catch (error) {
    console.error('Application Route Error:', error);
    res.status(500).json({ message: 'Server Error during application' });
  }
}

async function getMyApplications(req, res) {
  try {
    const applications = await Application.find({ candidateId: req.user.id }).populate('jobId', 'title location companyName workplaceType department openings experienceRequired').sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    console.error('Fetch Candidate Applications Error:', error);
    res.status(500).json({ message: 'Failed to load your applications' });
  }
}

async function getAIInsights(req, res) {
  try {
    const application = await Application.findOne({ candidateId: req.user.id }).sort({ createdAt: -1 });
    if (!application) return res.json({ strengths: [], missingSkills: [], improvements: [] });
    res.json({ strengths: application.strengths || [], missingSkills: application.missingSkills || [], improvements: application.improvements || [] });
  } catch (error) {
    console.error('AI Insights Error:', error);
    res.status(500).json({ message: 'Failed to load AI insights' });
  }
}

async function listForRecruiter(req, res) {
  try {
    const myJobs = await Job.find({ recruiterId: req.user.id }).select('_id');
    const myJobIds = myJobs.map(job => job._id.toString());

    let filter = {};
    if (req.query.jobId) {
      if (!myJobIds.includes(req.query.jobId)) return res.status(403).json({ message: 'Unauthorized: You do not own this job' });
      filter = { jobId: req.query.jobId };
    } else {
      filter = { jobId: { $in: myJobIds } };
    }

    const applications = await Application.find(filter).populate('candidateId', 'name email phone').populate('jobId', 'title description recruiterId companyName workplaceType location department openings experienceRequired').sort({ fitmentScore: -1 }).lean();

    const applicationsWithScores = await Promise.all(applications.map(async (app) => {
      const interviewData = await Interview.findOne({ candidate: app.candidateId._id, job: app.jobId._id });
      return { ...app, interviewScore: interviewData ? interviewData.score : null, interviewStatus: interviewData ? interviewData.status : null };
    }));

    res.json({ applications: applicationsWithScores });
  } catch (err) {
    console.error('Fetch Recruiter Applications Error:', err);
    res.status(500).json({ message: 'Failed to load candidates' });
  }
}

async function statsForJob(req, res) {
  try {
    const { jobId } = req.params;
    const job = await Job.findById(jobId);
    if (!job || job.recruiterId.toString() !== req.user.id) return res.status(403).json({ message: 'Unauthorized: You do not own this job' });

    const apps = await Application.find({ jobId });
    const total = apps.length;
    const shortlisted = apps.filter(a => a.status === 'Shortlisted').length;
    const avgScore = total > 0 ? (apps.reduce((acc, a) => acc + a.fitmentScore, 0) / total).toFixed(1) : 0;

    res.json({ total, shortlisted, avgScore });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching stats' });
  }
}

async function getApplicationById(req, res) {
  try {
    const application = await Application.findById(req.params.id).populate('candidateId', 'name email phone').populate('jobId','title description recruiterId companyName workplaceType location department openings experienceRequired');
    if (!application) return res.status(404).json({ message: 'Application not found' });
    if (application.jobId.recruiterId.toString() !== req.user.id) return res.status(403).json({ message: 'Unauthorized access to candidate data' });
    res.json(application);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch application' });
  }
}

async function updateStatus(req, res) {
  try {
    const { status } = req.body;
    const existingApp = await Application.findById(req.params.id).populate('jobId');
    if (!existingApp || existingApp.jobId.recruiterId.toString() !== req.user.id) return res.status(403).json({ message: 'Unauthorized to update this application' });

    const application = await Application.findByIdAndUpdate(req.params.id, { status }, { new: true }).populate('jobId', 'title');

    let notifMessage = `Your application status for ${application.jobId?.title || 'a job'} has been updated to: ${status}`;
    if (status === 'Shortlisted' || status === 'Interview Scheduled') notifMessage = `🎉 Great news! You have been ${status} for ${application.jobId?.title}.`;
    else if (status === 'Rejected') notifMessage = `Update: Your application for ${application.jobId?.title} was not moved forward this time. Keep trying! 💪`;

    await createNotification({ userId: application.candidateId, message: notifMessage, type: 'application_update', actionUrl: '/my-applications' });

    res.json(application);
  } catch (err) {
    res.status(500).json({ message: 'Status update failed' });
  }
}

async function scheduleInterview(req, res) {
  try {
    const { interviewDate, interviewMode, interviewLink } = req.body;
    const existingApp = await Application.findById(req.params.id).populate('jobId');
    if (!existingApp || existingApp.jobId.recruiterId.toString() !== req.user.id) return res.status(403).json({ message: 'Unauthorized to schedule interview for this candidate' });

    const application = await Application.findByIdAndUpdate(req.params.id, { interviewScheduled: true, interviewDate, interviewMode, interviewLink, status: 'Interview Scheduled' }, { new: true }).populate('jobId', 'title');

    const formattedDate = new Date(interviewDate).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const isAI = interviewMode === 'AI' || interviewMode === 'AI Interview';

    await createNotification({ userId: application.candidateId, message: `🚀 Get Ready! Your ${isAI ? '🤖 AI ' : ''}Interview for ${application.jobId?.title || 'the job'} is scheduled for ${formattedDate}.`, type: 'interview_scheduled', actionUrl: '/my-applications' });

    res.json({ message: 'Interview scheduled successfully', application });
  } catch (error) {
    res.status(500).json({ message: 'Interview scheduling failed' });
  }
}

module.exports = {
  applyToJob,
  getMyApplications,
  getAIInsights,
  listForRecruiter,
  statsForJob,
  getApplicationById,
  updateStatus,
  scheduleInterview
};
