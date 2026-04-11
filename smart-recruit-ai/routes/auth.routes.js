const express = require("express");
const authMiddleware = require("../middleware/auth.middleware.js"); 
const authController = require('../controllers/auth.controller');

const router = express.Router();



router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.getMe);



router.get('/google', authController.googleAuth);


router.get('/google/callback', authController.googleCallback);



router.get('/linkedin', authController.linkedinAuth);


router.get('/linkedin/callback', authController.linkedinCallback);

module.exports = router;