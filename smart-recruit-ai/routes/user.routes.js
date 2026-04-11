const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const { cache, invalidateByPattern } = require("../middleware/cache.middleware");
const userController = require('../controllers/user.controller');


router.get('/me', auth, cache((req) => `user:me:${req.user.id}`, 60), userController.getMe);


router.put('/update', auth, userController.updateProfile);


router.patch('/save/:jobId', auth, userController.saveJob);

module.exports = router;