const reviewModel = require("../models/reviewModel");
const coinModel = require("../models/coinModel");

// Profanity Filter
const BAD_WORDS = ["fuck", "shit", "bitch", "asshole", "bastard", "fucking"];

function containsProfanity(text) {
  const lowerText = text.toLowerCase();
  return BAD_WORDS.some((word) => lowerText.includes(word));
}

async function createReview(req, res) {
  try {
    const userId = parseInt(req.user.userId, 10);
    const { menuItemId, rating, reviewText, imageId } = req.body;
    const coinAmount = 5;

    if (!menuItemId || !rating || !reviewText) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const isFlagged = containsProfanity(reviewText);

    const newReview = await reviewModel.createReview(
      menuItemId,
      userId,
      rating,
      reviewText,
      imageId,
      isFlagged
    );

    if (!isFlagged) {
      await coinModel.addCoins(userId, coinAmount);
      await coinModel.insertCoinTransaction(
        userId,
        coinAmount,
        "Review submission reward"
      );
    }
    res.status(201).json({ 
      message: isFlagged ? "Review submitted for moderation." : "Review created", 
      review: newReview 
    });
  } catch (error) {
    console.error("Create review error", error);
    res.status(500).json({ error: "Error creating review" });
  }
}

async function getReviewsByMenuItem(req, res) {
  try {
    const { menuItemId } = req.params;

    // Extract userId from token if provided (optional authentication)
    let currentUserId = null;
    if (req.user && req.user.userId) {
      currentUserId = req.user.userId;
    }

    const reviews = await reviewModel.getReviewsByMenuItem(
      menuItemId,
      currentUserId
    );
    res.json(reviews);
  } catch (error) {
    console.error("Get reviews by menu item error", error);
    res.status(500).json({ error: "Error fetching reviews" });
  }
}

async function getReviewsByStall(req, res) {
  try {
    const { stallId } = req.params;
    const reviews = await reviewModel.getReviewsByStall(stallId);
    res.json(reviews);
  } catch (error) {
    console.error("Get reviews by stall error", error);
    res.status(500).json({ error: "Error fetching reviews" });
  }
}

async function getReviewsByUser(req, res) {
  try {
    const userId = parseInt(req.user.userId, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID from token" });
    }
    const reviews = await reviewModel.getReviewsByUser(userId);
    res.json(reviews);
  } catch (error) {
    console.error("Get reviews by user error", error);
    res.status(500).json({ error: "Error fetching reviews" });
  }
}

async function getModerationQueue(req, res) {
  try {
    const userId = parseInt(req.user.userId, 10); // This is the Stall Owner
    const reviews = await reviewModel.getFlaggedReviewsByOwner(userId);
    res.json(reviews);
  } catch (error) {
    console.error("Get moderation queue error", error);
    res.status(500).json({ error: "Error fetching flagged reviews" });
  }
}

async function handleModeration(req, res) {
  try {
    const { reviewId } = req.params;
    const { action } = req.body; // 'delete' or 'keep'

    if (!["delete", "keep"].includes(action)) {
      return res.status(400).json({ error: "Invalid action" });
    }

    await reviewModel.moderateReview(reviewId, action);
    res.json({ success: true });
  } catch (error) {
    console.error("Moderation error", error);
    res.status(500).json({ error: "Error moderating review" });
  }
}

module.exports = {
  createReview,
  getReviewsByMenuItem,
  getReviewsByStall,
  getReviewsByUser,
  getModerationQueue,
  handleModeration,
};
