const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({
  candidateId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  jobId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Job", 
    required: true 
  },
  resumeUrl: { type: String }, 
  parsedResumeText: { type: String }, 
  candidateSkills: {
    type: [String],
    default: []
  },
 
  fitmentScore: { type: Number, default: 0 },
  missingSkills: [String],
  experienceRelevance: { type: String }, 
  strengths: [String], 
  improvements: [String], 

  
  status: { 
    type: String, 
    enum: ['Applied', 'Shortlisted', 'Rejected'], 
    default: 'Applied' 
  },
  interviewScheduled: {
    type: Boolean,
    default: false
  },
  
  interviewDate: {
    type: Date
  },
  
  interviewMode: {
    type: String,
    enum: ["Google Meet", "Zoom", "Phone", "In-Person"]
  },
  
  interviewLink: {
    type: String
  },
  
  interviewNotes: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model("Application", applicationSchema);