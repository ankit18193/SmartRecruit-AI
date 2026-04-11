const express = require("express");
const auth = require("../middleware/auth.middleware.js");
const role = require("../middleware/role.middleware.js");
const router = express.Router();
const aiController = require('../controllers/ai.controller');

router.get('/career-insight', auth, role('candidate'), aiController.careerInsight);

module.exports = router;