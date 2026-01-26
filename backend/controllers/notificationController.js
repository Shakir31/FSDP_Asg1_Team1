// controllers/notificationController.js
const notificationModel = require("../models/notificationModel");

async function getMyNotifications(req, res) {
  try {
    const userId = req.user.userId;
    const notifications = await notificationModel.getNotificationsByUser(
      userId
    );
    res.json(notifications);
  } catch (error) {
    console.error("Get notifications error", error);
    res.status(500).json({ error: "Error fetching notifications" });
  }
}

async function getNotificationById(req, res) {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const notification = await notificationModel.getNotificationById(
      id,
      userId
    );

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json(notification);
  } catch (error) {
    console.error("Get notification by ID error", error);
    res.status(500).json({ error: "Error fetching notification" });
  }
}

async function approveNotification(req, res) {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const result = await notificationModel.approveNotification(id, userId);
    res.json(result);
  } catch (error) {
    console.error("Approve notification error", error);

    if (error.message.includes("Access denied")) {
      return res.status(403).json({ error: error.message });
    }
    if (error.message.includes("already processed")) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: "Error approving notification" });
  }
}

async function dismissNotification(req, res) {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const result = await notificationModel.dismissNotification(id, userId);
    res.json(result);
  } catch (error) {
    console.error("Dismiss notification error", error);

    if (error.message.includes("Access denied")) {
      return res.status(403).json({ error: error.message });
    }
    if (error.message.includes("already processed")) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: "Error dismissing notification" });
  }
}

async function getNotificationStats(req, res) {
  try {
    const userId = req.user.userId;
    const stats = await notificationModel.getNotificationStats(userId);
    res.json(stats);
  } catch (error) {
    console.error("Get notification stats error", error);
    res.status(500).json({ error: "Error fetching notification stats" });
  }
}

async function revertNotification(req, res) {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const result = await notificationModel.revertNotification(id, userId);
    res.json(result);
  } catch (error) {
    console.error("Revert notification error", error);

    if (error.message.includes("Access denied")) {
      return res.status(403).json({ error: error.message });
    }
    if (
      error.message.includes("Can only revert") ||
      error.message.includes("No previous image")
    ) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: "Error reverting notification" });
  }
}

module.exports = {
  getMyNotifications,
  getNotificationById,
  approveNotification,
  dismissNotification,
  getNotificationStats,
  revertNotification,
};
