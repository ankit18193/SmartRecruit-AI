const express = require("express");
const auth = require("../middleware/auth.middleware.js");
const role = require("../middleware/role.middleware.js");
const router = express.Router();
const interviewController = require('../controllers/interview.controller');

router.post('/start/:jobId', auth, role('candidate'), interviewController.startInterview);

router.post('/submit/:interviewId', auth, role('candidate'), interviewController.submitInterview);

router.get('/result/:jobId/:candidateId', auth, role('recruiter'), interviewController.getInterviewResult);

router.get('/:jobId', auth, role('candidate'), interviewController.getCandidateInterview);

module.exports = router;
