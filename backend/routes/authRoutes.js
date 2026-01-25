const express = require("express");
const router = express.Router();
const authController = require("../controllers/userController");
const { authenticateToken } = require("../middlewares/authMiddleware");

// Auth endpoints
router.post("/register", authController.registerUser);
router.post("/login", authController.loginUser);
router.get("/users/profile", authenticateToken, authController.getUserProfile);

module.exports = router;
