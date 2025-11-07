const imageModel = require("../models/imageModel");
const axios = require("axios");

async function uploadImage(req, res) {
  try {
    const uploaderId = parseInt(req.user.userId, 10);
    if (isNaN(uploaderId)) {
      return res.status(400).json({ error: "Invalid userId from token" });
    }
    const { menuItemId, imageUrl } = req.body;

    //call AI food image verification API (simulate in this example)
    const isFood = await mockImageVerification(imageUrl);
    if (!isFood)
      return res.status(400).json({ error: "Image failed food verification" });

    const newImage = await imageModel.insertImage(
      menuItemId,
      uploaderId,
      imageUrl
    );
    res.status(201).json({ message: "Image uploaded", image: newImage });
  } catch (error) {
    console.error("Upload image error", error);
    res.status(500).json({ error: "Error uploading image" });
  }
}

async function mockImageVerification(imageUrl) {
  //simulated AI check returning true (add integration with real API later)
  return true;
}

async function upvoteImage(req, res) {
  try {
    const userId = parseInt(req.user.userId, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid userId from token" });
    }
    const { imageId } = req.body;
    await imageModel.voteImage(userId, imageId);
    res.status(201).json({ message: "Image upvoted" });
  } catch (error) {
    console.error("Upvote image error", error);
    res.status(400).json({ error: error.message });
  }
}

module.exports = { uploadImage, upvoteImage };
