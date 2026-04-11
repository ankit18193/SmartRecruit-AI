const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const notificationController = require('../controllers/notification.controller');

router.get('/', auth, notificationController.listNotifications);
router.patch('/:id/read', auth, notificationController.markRead);
router.patch('/mark-all-read', auth, notificationController.markAllRead);

module.exports = router;