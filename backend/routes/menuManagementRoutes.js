const express = require("express");
const router = express.Router();
const menuManagementController = require("../controllers/menuManagementController");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middlewares/authMiddleware");

// Menu management endpoints (for stall owners)
router.get(
  "/my-stalls",
  authenticateToken,
  authorizeRoles("stall_owner"),
  menuManagementController.getMyStalls
);
router.post(
  "/menuitems",
  authenticateToken,
  authorizeRoles("stall_owner"),
  menuManagementController.createMenuItem
);
router.put(
  "/menuitems/:menuItemId",
  authenticateToken,
  authorizeRoles("stall_owner"),
  menuManagementController.updateMenuItem
);
router.delete(
  "/menuitems/:menuItemId",
  authenticateToken,
  authorizeRoles("stall_owner"),
  menuManagementController.deleteMenuItem
);
router.post(
  "/upload-image",
  authenticateToken,
  authorizeRoles("stall_owner"),
  menuManagementController.uploadMenuItemImage
);

module.exports = router;
