const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const { validateReview } = require("../middlewares/reviewValidation");
const {
  authenticateToken,
  optionalAuth,
  authorizeRoles,
} = require("../middlewares/authMiddleware");

// Review endpoints
router.post(
  "/",
  validateReview,
  authenticateToken,
  authorizeRoles("customer"),
  reviewController.createReview
);
router.get(
  "/menuitem/:menuItemId",
  optionalAuth,
  reviewController.getReviewsByMenuItem
);
router.get("/stall/:stallId", reviewController.getReviewsByStall);
router.get("/user", authenticateToken, reviewController.getReviewsByUser);

module.exports = router;
