const express = require("express");
const router = express.Router();
const coinController = require("../controllers/coinController");
const { authenticateToken } = require("../middlewares/authMiddleware");

// Coin gamification endpoints
router.get("/balance", authenticateToken, coinController.getUserCoins);
router.post(
  "/award-photo",
  authenticateToken,
  coinController.awardPhotoUploadCoins
);

module.exports = router;
