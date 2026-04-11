const express = require("express");
const auth = require("../middleware/auth.middleware.js");
const role = require("../middleware/role.middleware.js");
const { cache, invalidateByPattern } = require("../middleware/cache.middleware");

const router = express.Router();

const jobController = require('../controllers/job.controller');



router.post('/', auth, role('recruiter'), jobController.createJob);




router.get('/', auth, cache('jobs:all', 60), jobController.getAllJobs);



router.get('/recommended', auth, role('candidate'), cache((req) => `jobs:recommended:${req.user.id}`, 60), jobController.getRecommendedJobs);



router.get('/my-jobs', auth, role('recruiter'), cache((req) => `jobs:my:${req.user.id}`, 60), jobController.getMyJobs);



router.get('/:jobId', cache((req) => `job:${req.params.jobId}`, 60), jobController.getJobById);



router.get('/:jobId/applications', auth, role('recruiter'), cache((req) => `job:${req.params.jobId}:applications:${req.user.id}`, 60), jobController.getJobApplications);



router.get('/:jobId/dashboard', auth, role('recruiter'), cache((req) => `job:${req.params.jobId}:dashboard:${req.user.id}`, 60), jobController.getJobDashboard);



router.delete('/:jobId', auth, role('recruiter'), jobController.deleteJob);

router.get("/search", searchJobs);

module.exports = router;