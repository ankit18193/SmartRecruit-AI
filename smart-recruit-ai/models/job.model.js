const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true 
  },
  
  companyName: {
    type: String,
    required: true,
    trim: true,
    default: "Not Specified" 
  },
  description: { 
    type: String, 
    required: true 
  },
  requiredSkills: {
    type: [String],
    default: []
  },
  experienceRequired: { 
    type: Number, 
    default: 0 
  },
  
  location: { 
    type: String, 
    default: "Remote" 
  },
  
  workplaceType: {
    type: String,
    enum: ["Remote", "Hybrid", "On-site"],
    default: "Remote"
  },
  
  department: {
    type: String,
    trim: true,
    default: "General"
  },
  salary: {
    type: String,
    default: "Not Disclosed"
  },
  jobType: {
    type: String,
    enum: ["Full-time", "Part-time", "Contract", "Internship"],
    default: "Full-time"
  },
 
  openings: {
    type: Number,
    default: 1
  },
  
  applicationDeadline: {
    type: Date
  },
  recruiterId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    required: true 
  }
}, { timestamps: true });

module.exports = mongoose.model("Job", jobSchema);