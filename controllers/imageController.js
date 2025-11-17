const fs = require("fs");
const path = require("path");
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

// uploadImage: expects validateImageUpload middleware to populate req.files and authenticateToken to populate req.user
exports.uploadImage = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    if (!process.env.LOGMEAL_API_KEY) {
      return res.status(500).json({ message: "LogMeal API key not configured on server" });
    }

    const detections = [];

    // For each uploaded file call LogMeal detection
    for (const file of req.files) {
      const filePath = file.path || file.location || file.filename;
      const fileStream = fs.createReadStream(file.path || filePath);

      try {
        // LogMeal expects an image upload. Adjust header if your LogMeal plan uses a different auth header.
        const resp = await axios.post(
          "https://api.logmeal.es/v2/image/recognition/dish",
          fileStream,
          {
            headers: {
              "Content-Type": file.mimetype || "image/jpeg",
              Authorization: `Bearer ${process.env.LOGMEAL_API_KEY}`,
            },
            timeout: 20000,
          }
        );

        detections.push({
          filename: file.originalname || file.filename,
          result: resp.data,
        });
      } catch (err) {
        detections.push({
          filename: file.originalname || file.filename,
          error: err?.response?.data || err.message,
        });
      }
    }

    // Optionally: store review / detections to DB here using your imageModel (kept out to minimize changes)
    // If you want to persist, call your imageModel functions here.

    // Respond with detections and basic meta (frontend will then call /coins/award-photo to credit)
    return res.json({
      message: "Files processed",
      detections,
      uploadedCount: req.files.length,
      review: req.body.review || null,
      stallId: req.body.stallId || null,
    });
  } catch (err) {
    console.error("uploadImage error:", err);
    return res.status(500).json({ message: "Server error during upload", error: err.message });
  }
};

module.exports = { uploadImage, upvoteImage };
