const imageModel = require("../models/imageModel");
const axios = require("axios");
const FormData = require("form-data");
const sharp = require("sharp");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");

const LOGMEAL_API_KEY = process.env.LOGMEAL_API_KEY;
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

// Configure Cloudinary
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

async function aiFoodImageVerification(imageUrl) {
  try {
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    let imageBuffer = Buffer.from(response.data, "binary");

    imageBuffer = await sharp(imageBuffer)
      .resize({ width: 800 })
      .jpeg({ quality: 80 })
      .toBuffer();

    if (imageBuffer.length > 1024 * 1024) {
      throw new Error("Image still too large after resizing");
    }

    const formData = new FormData();
    formData.append("image", imageBuffer, { filename: "image.jpg" });

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

    if (!Array.isArray(results) || results.length === 0) return false;

    return results.some((r) => typeof r.prob === "number" && r.prob >= 0.2);
  } catch (error) {
    console.error("AI image verification error", error);
    return false;
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
        // Local file uploaded, upload to Cloudinary
        const uploadResult = await cloudinary.uploader.upload_stream(
          { folder: "food_app_images" },
          async (error, result) => {
            if (error) {
              console.error("Cloudinary upload error", error);
              return res
                .status(500)
                .json({ error: "Failed to upload image to cloud" });
            }

            imageUrl = result.secure_url;
            menuItemId = req.body.menuItemId;

            // Verify food image
            const isFood = await aiFoodImageVerification(imageUrl);
            if (!isFood)
              return res
                .status(400)
                .json({ error: "Image failed food verification" });

            const newImage = await imageModel.insertImage(
              menuItemId,
              uploaderId,
              imageUrl
            );
            return res
              .status(201)
              .json({ message: "Image uploaded", image: newImage });
          }
        );

        // Pipe buffer for multer file to cloudinary stream
        require("streamifier")
          .createReadStream(req.file.buffer)
          .pipe(uploadResult);
      } else if (req.body.imageUrl && req.body.menuItemId) {
        // If user sent URL, use original flow for verification
        imageUrl = req.body.imageUrl;
        menuItemId = req.body.menuItemId;

        const isFood = await aiFoodImageVerification(imageUrl);
        if (!isFood)
          return res
            .status(400)
            .json({ error: "Image failed food verification" });

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
      res.status(500).json({ error: "Error uploading image" });
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
