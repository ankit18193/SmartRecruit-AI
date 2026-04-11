const express = require("express");
const { createMulterUpload } = require("../middleware/upload.middleware");

const parseResume = require("../utils/parseResume.js");
const { generateAIResponse } = require("../utils/ai.service.js");

const Application = require("../models/Application.model.js");
const Job = require("../models/job.model.js");
const Notification = require("../models/notification.model.js"); 
const Interview = require("../models/interview.model.js");
const { createNotification } = require("../utils/notification.service");
const User = require("../models/user.model.js");

const auth = require("../middleware/auth.middleware.js");
const role = require("../middleware/role.middleware.js");

const router = express.Router();
const applicationController = require('../controllers/application.controller');



const upload = createMulterUpload({
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") return cb(new Error("Only PDF files are allowed"));
    cb(null, true);
  }
});




router.post('/apply/:jobId', auth, role('candidate'), upload.single('resume'), applicationController.applyToJob);



router.get('/my-applications', auth, role('candidate'), applicationController.getMyApplications);


router.get('/ai-insights', auth, role('candidate'), applicationController.getAIInsights);



router.get('/', auth, role('recruiter'), applicationController.listForRecruiter);


router.get('/stats/:jobId', auth, role('recruiter'), applicationController.statsForJob);



router.get('/:id', auth, role('recruiter'), applicationController.getApplicationById);


router.patch('/:id/status', auth, role('recruiter'), applicationController.updateStatus);


router.patch('/schedule/:id', auth, role('recruiter'), applicationController.scheduleInterview);

module.exports = router;