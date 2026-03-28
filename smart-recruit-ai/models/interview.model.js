const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  questions: [{
    type: String
  }],
  answers: [{
    type: String
  }],
  score: {
    type: Number,
    default: 0
  },
  evaluation: {
    strengths: [String],
    weaknesses: [String],
    suggestions: [String]
  },
  status: {
    type: String,
    enum: ['In Progress', 'Completed'],
    default: 'In Progress'
  }
}, { timestamps: true });

module.exports = mongoose.model('Interview', interviewSchema);