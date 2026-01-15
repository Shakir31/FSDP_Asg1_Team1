const express = require("express");
const router = express.Router();
const reactionController = require("../controllers/reactionController");
const {
  authenticateToken,
  optionalAuth,
} = require("../middlewares/authMiddleware");

// Reaction endpoints
router.post(
  "/:reviewId/react",
  authenticateToken,
  reactionController.toggleReaction
);
router.get(
  "/:reviewId/reactions",
  optionalAuth,
  reactionController.getReactions
);

module.exports = router;
