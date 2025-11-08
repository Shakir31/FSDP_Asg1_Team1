const imageModel = require("../models/imageModel");
const axios = require("axios");
const FormData = require("form-data");
const sharp = require("sharp");

//api key in env
const LOGMEAL_API_KEY = process.env.LOGMEAL_API_KEY;

async function uploadImage(req, res) {
  try {
    const uploaderId = parseInt(req.user.userId, 10);
    if (isNaN(uploaderId)) {
      return res.status(400).json({ error: "Invalid userId from token" });
    }
    const { menuItemId, imageUrl } = req.body;

    //call AI food image verification API
    const isFood = await aiFoodImageVerification(imageUrl);
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

const MIN_CONFIDENCE = 0.2; //minimum confidence threshold for food detection

async function aiFoodImageVerification(imageUrl) {
  try {
    //download image as arraybuffer
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    let imageBuffer = Buffer.from(response.data, "binary");

    //compress image to max 1MB because api cannot take images over 1mb
    imageBuffer = await sharp(imageBuffer)
      .resize({ width: 800 })
      .jpeg({ quality: 80 })
      .toBuffer();

    if (imageBuffer.length > 1024 * 1024) {
      throw new Error("Image still too large after resizing");
    }

    //prepare the form data
    const formData = new FormData();
    formData.append("image", imageBuffer, { filename: "image.jpg" });

    //call the LogMeal API
    const apiResponse = await axios.post(
      "https://api.logmeal.es/v2/recognition/dish",
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${LOGMEAL_API_KEY}`,
        },
      }
    );

    const prediction = apiResponse.data;
    const results = prediction.recognition_results;

    //strict food check
    //require any result with confidence >= MIN_CONFIDENCE and not tagged as non-food
    if (!Array.isArray(results) || results.length === 0) return false;

    const isFood = results.some(
      (r) => typeof r.prob === "number" && r.prob >= MIN_CONFIDENCE
    );

    console.log("Food verification results:", results);
    return isFood;
  } catch (error) {
    console.error("AI image verification error", error);
    return false;
  }
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
