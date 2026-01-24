const express = require("express");
const router = express.Router();
const stallController = require("../controllers/stallController");
const { validateMenuItem } = require("../middlewares/menuItemValidation");
const {
  authenticateToken,
  optionalAuth,
  authorizeRoles,
} = require("../middlewares/authMiddleware");

// Public stall endpoints
router.get("/", stallController.getAllStalls);
router.get("/category", stallController.getStallsByCategory);
router.get("/hawker-centre", stallController.getStallsByHawkerCentre);
router.get("/:id", stallController.getStallById);
router.get("/:id/photos", optionalAuth, stallController.getStallImages);
router.get("/:stallId/menu", stallController.getMenuByStall);

// Admin only
router.post(
  "/",
  authenticateToken,
  authorizeRoles("admin"),
  stallController.createStall
);
router.post(
  "/upload-image",
  authenticateToken,
  authorizeRoles("admin"),
  stallController.uploadStallImage
);

// Menu items - stall owner only
router.post(
  "/menuitems",
  validateMenuItem,
  authenticateToken,
  authorizeRoles("stall_owner"),
  stallController.createMenuItem
);
router.put(
  "/menuitems/photo",
  authenticateToken,
  authorizeRoles("stall_owner"),
  stallController.updateMenuItemPhoto
);

module.exports = router;
