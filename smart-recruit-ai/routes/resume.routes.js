const express = require("express");
const { createMulterUpload } = require("../middleware/upload.middleware");

const Resume = require("../models/Resume.model.js");
const Job = require("../models/job.model.js");

const parseResume = require("../utils/parseResume.js");
const { analyzeResume } = require("../utils/ai.service.js");
const resumeController = require('../controllers/resume.controller');

const auth = require("../middleware/auth.middleware.js");
const role = require("../middleware/role.middleware.js");

const { createNotification } = require("../utils/notification.service"); 

const router = express.Router();



const upload = createMulterUpload();



router.post('/analyze', auth, role('candidate'), upload.single('resume'), resumeController.analyze);



router.get('/my-resumes', auth, role('candidate'), resumeController.getMyResumes);



router.get('/recommend-jobs/:resumeId', auth, resumeController.recommendJobs);

// status polling endpoint
router.get('/status/:resumeId', auth, resumeController.getStatus);

module.exports = router;