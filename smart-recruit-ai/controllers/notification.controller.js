const Notification = require('../models/notification.model');

async function listNotifications(req, res) {
  try {
    const notifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(50);
    res.json(notifications);
  } catch (error) {
    console.error('Fetch Notifications Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

async function markRead(req, res) {
  try {
    const notification = await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, { read: true }, { new: true });
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark as read' });
  }
}

async function markAllRead(req, res) {
  try {
    await Notification.updateMany({ userId: req.user.id, read: false }, { read: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update notifications' });
  }
}

module.exports = { listNotifications, markRead, markAllRead };
