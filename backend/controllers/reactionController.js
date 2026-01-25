const reactionModel = require("../models/reactionModel");

// POST /reviews/:reviewId/react - Toggle a reaction
async function toggleReaction(req, res) {
  try {
    const { reviewId } = req.params;
    const { emoji } = req.body;
    const userId = req.user.userId;

    // Validate emoji
    const allowedEmojis = ["👍", "❤️", "🔥", "😂", "🤤", "👏"];
    if (!allowedEmojis.includes(emoji)) {
      return res.status(400).json({ error: "Invalid emoji" });
    }

    const result = await reactionModel.toggleReaction(reviewId, userId, emoji);

    // Get updated reaction counts
    const reactions = await reactionModel.getReviewReactions(reviewId, userId);

    res.json({
      success: true,
      action: result.action,
      emoji: emoji,
      ...reactions,
    });
  } catch (error) {
    console.error("Error toggling reaction:", error);
    res.status(500).json({ error: "Failed to toggle reaction" });
  }
}

// GET /reviews/:reviewId/reactions - Get all reactions for a review
async function getReactions(req, res) {
  try {
    const { reviewId } = req.params;
    const userId = req.user?.userId; // Optional auth

    const reactions = await reactionModel.getReviewReactions(reviewId, userId);
    res.json(reactions);
  } catch (error) {
    console.error("Error getting reactions:", error);
    res.status(500).json({ error: "Failed to get reactions" });
  }
}

module.exports = {
  toggleReaction,
  getReactions,
};
