const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    resumeUrl: {
      type: String
    },
    
    fileName: {
      type: String
    },

    parsedText: {
      type: String
    },

   
    skills: {
      type: [String],
      default: []
    },

    
    insights: {
      strengths: {
        type: [
          {
            label: String,
            category: String,
            impact: String,
            reasoning: String 
          }
        ],
        default: []
      },
      missingSkills: {
        type: [
          {
            label: String,
            category: String,
            priority: String,
            reasoning: String 
          }
        ],
        default: []
      },
      suggestions: {
        type: [
          {
            label: String,
            category: String,
            priority: String,
            reasoning: String 
          }
        ],
        default: []
      }
    },

    
    aiScore: {
      type: Number,
      default: 0
    },
    
    
    confidenceScore: {
      type: Number,
      default: 0
    },
    
    marketLevel: {
      type: String,
      default: "beginner"
    },

    careerStrategy: {
      shortTerm: { type: String, default: "" },
      midTerm: { type: String, default: "" },
      longTerm: { type: String, default: "" }
    },

    mindsetBoost: {
      type: String,
      default: ""
    },

    
    projects: {
      type: [
        {
          name: String,
          description: String,
          complexity: String,
          impact: String
        }
      ],
      default: []
    },

    
    certifications: {
      type: [
        {
          name: String,
          relevance: String
        }
      ],
      default: []
    },

    
    cgpa: {
      type: Number,
      default: 0
    }
    ,
    status: {
      type: String,
      enum: ["Pending", "Processing", "Completed", "Failed"],
      default: "Pending"
    },
    processedAt: {
      type: Date
    },
    error: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Resume", resumeSchema);