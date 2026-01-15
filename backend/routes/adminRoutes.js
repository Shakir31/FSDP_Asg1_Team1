const express = require("express");
const router = express.Router();
const authController = require("../controllers/userController");
const stallController = require("../controllers/stallController");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middlewares/authMiddleware");

// Admin: Users list
router.get(
  "/users",
  authenticateToken,
  authorizeRoles("admin"),
  authController.listUsers
);
router.get(
  "/users/:id",
  authenticateToken,
  authorizeRoles("admin"),
  authController.getUser
);
router.put(
  "/users/:id",
  authenticateToken,
  authorizeRoles("admin"),
  authController.updateUser
);
router.delete(
  "/users/:id",
  authenticateToken,
  authorizeRoles("admin"),
  authController.deleteUser
);

// Admin: Stalls list
router.get(
  "/stalls",
  authenticateToken,
  authorizeRoles("admin"),
  stallController.getAllStalls
);
router.get(
  "/stalls/:id",
  authenticateToken,
  authorizeRoles("admin"),
  stallController.getStallById
);
router.put(
  "/stalls/:id",
  authenticateToken,
  authorizeRoles("admin"),
  stallController.updateStall
);
router.delete(
  "/stalls/:id",
  authenticateToken,
  authorizeRoles("admin"),
  stallController.deleteStall
);

module.exports = router;
