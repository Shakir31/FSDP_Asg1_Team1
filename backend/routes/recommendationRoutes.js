const express = require("express");
const router = express.Router();
const recommendationController = require("../controllers/recommendationController");
const { authenticateToken } = require("../middlewares/authMiddleware");

// Recommendation endpoints
router.get("/", authenticateToken, recommendationController.getRecommendations);
router.get("/popular", recommendationController.getPopularRecommendations);
router.post(
  "/refresh",
  authenticateToken,
  recommendationController.refreshRecommendations
);

module.exports = router;
