const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    unique: true, 
    required: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    enum: ["candidate", "recruiter"], 
    default: "candidate" 
  },

  
  profilePicture: { 
    type: String, 
    default: "" 
  },
  bio: { 
    type: String, 
    default: "" 
  },
  location: { 
    type: String, 
    default: "Remote" 
  },
  phone: { 
    type: String, 
    default: "" 
  },
  
  
  skills: [{ 
    type: String 
  }],

 
  savedJobs: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Job" 
  }],

  
  companyName: { 
    type: String, 
    default: "" 
  }

}, { timestamps: true }); 

module.exports = mongoose.model("User", userSchema);