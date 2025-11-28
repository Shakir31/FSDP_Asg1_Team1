const reviewModel = require("../models/reviewModel");
const coinModel = require("../models/coinModel");

async function createReview(req, res) {
  try {
    const userId = parseInt(req.user.userId, 10);
    const { menuItemId, rating, reviewText, imageId } = req.body;
    const coinAmount = 5;

    if (!menuItemId || !rating || !reviewText) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newReview = await reviewModel.createReview(
      menuItemId,
      userId,
      rating,
      reviewText,
      imageId
    );
    await coinModel.addCoins(userId, coinAmount);
    await coinModel.insertCoinTransaction(
      userId,
      coinAmount,
      "Review submission reward"
    );
    res.status(201).json({ message: "Review created", review: newReview });
  } catch (error) {
    console.error("Create review error", error);
    res.status(500).json({ error: "Error creating review" });
  }
}

async function getReviewsByMenuItem(req, res) {
  try {
    const { menuItemId } = req.params;
    const reviews = await reviewModel.getReviewsByMenuItem(menuItemId);
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

module.exports = { createReview, getReviewsByMenuItem, getReviewsByStall, getReviewsByUser };