const Notification = require('../models/notification.model');

const createNotification = async ({ userId, message, type, actionUrl = null }) => {
  try {
    const notification = new Notification({
      userId,
      message,
      type,
      actionUrl
    });
    await notification.save();
    return true;
  } catch (error) {
    console.error("Failed to create notification:", error);
    return false;
  }
};

module.exports = { createNotification };