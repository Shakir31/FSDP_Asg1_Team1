const imageModel = require("../models/imageModel");
const axios = require("axios");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

const AI_MICROSERVICE_URL =
  process.env.AI_MICROSERVICE_URL || "http://localhost:5000/verify-food";

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // max 10MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
}).single("imageFile");

// New: call AI microservice with imageUrl, return JSON { isFood, confidence }
async function aiFoodImageVerification(imageUrl) {
  try {
    const response = await axios.post(AI_MICROSERVICE_URL, { imageUrl });
    return response.data; // expected: { isFood: boolean, confidence: number }
  } catch (error) {
    console.error("AI microservice call error:", error.message || error);
    return { isFood: false, confidence: 0 };
  }
}

async function uploadImage(req, res) {
  upload(req, res, async (uploadErr) => {
    if (uploadErr) {
      console.error("Upload error", uploadErr);
      return res.status(400).json({ error: uploadErr.message });
    }

    try {
      const uploaderId = parseInt(req.user.userId, 10);
      if (isNaN(uploaderId)) {
        return res.status(400).json({ error: "Invalid userId from token" });
      }

      let menuItemId;
      let imageUrl;

      if (req.file) {
        // Upload local file buffer to Cloudinary
        const uploadResult = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "food_app_images" },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          );
          const streamifier = require("streamifier");
          streamifier.createReadStream(req.file.buffer).pipe(stream);
        });

        imageUrl = uploadResult.secure_url;
        menuItemId = req.body.menuItemId;

        // Verify food image via your AI microservice
        const { isFood } = await aiFoodImageVerification(imageUrl);
        if (!isFood) {
          return res
            .status(400)
            .json({ error: "Image failed food verification" });
        }

        const newImage = await imageModel.insertImage(
          menuItemId,
          uploaderId,
          imageUrl
        );
        return res
          .status(201)
          .json({ message: "Image uploaded", image: newImage });
      } else if (req.body.imageUrl && req.body.menuItemId) {
        imageUrl = req.body.imageUrl;
        menuItemId = req.body.menuItemId;

        // Verify food image via your AI microservice
        const { isFood } = await aiFoodImageVerification(imageUrl);
        if (!isFood) {
          return res
            .status(400)
            .json({ error: "Image failed food verification" });
        }

        const newImage = await imageModel.insertImage(
          menuItemId,
          uploaderId,
          imageUrl
        );
        return res
          .status(201)
          .json({ message: "Image uploaded", image: newImage });
      } else {
        return res
          .status(400)
          .json({ error: "Missing image file or imageUrl" });
      }
    } catch (error) {
      console.error("Upload image error", error);
      return res.status(500).json({ error: "Error uploading image" });
    }
  });
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
