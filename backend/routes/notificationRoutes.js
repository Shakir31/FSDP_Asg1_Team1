const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middlewares/authMiddleware");

// Notification endpoints (stall owner only)
router.get(
  "/",
  authenticateToken,
  authorizeRoles("stall_owner"),
  notificationController.getMyNotifications
);
router.get(
  "/stats",
  authenticateToken,
  authorizeRoles("stall_owner"),
  notificationController.getNotificationStats
);
router.get(
  "/:id",
  authenticateToken,
  authorizeRoles("stall_owner"),
  notificationController.getNotificationById
);
router.post(
  "/:id/approve",
  authenticateToken,
  authorizeRoles("stall_owner"),
  notificationController.approveNotification
);
router.post(
  "/:id/dismiss",
  authenticateToken,
  authorizeRoles("stall_owner"),
  notificationController.dismissNotification
);
router.post(
  "/:id/revert",
  authenticateToken,
  authorizeRoles("stall_owner"),
  notificationController.revertNotification
);

module.exports = router;
