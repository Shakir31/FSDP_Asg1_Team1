// controllers/menuManagementController.js
const menuManagementModel = require("../models/menuManagementModel");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");

// Configure multer for image uploads
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // max 10MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
}).single("imageFile");

async function uploadMenuItemImage(req, res) {
  upload(req, res, async (uploadErr) => {
    if (uploadErr) {
      console.error("Upload error", uploadErr);
      return res.status(400).json({ error: uploadErr.message });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      // Upload to Cloudinary
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

      res.status(200).json({
        imageUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id,
      });
    } catch (error) {
      console.error("Upload menu item image error", error);
      res.status(500).json({ error: "Error uploading image" });
    }
  });
}

async function getMyStalls(req, res) {
  try {
    const userId = req.user.userId;
    const stalls = await menuManagementModel.getStallsByOwner(userId);
    res.json(stalls);
  } catch (error) {
    console.error("Get my stalls error", error);
    res.status(500).json({ error: "Error fetching stalls" });
  }
}

async function createMenuItem(req, res) {
  try {
    const userId = req.user.userId;
    const { stallId, name, description, price, mainimageurl, category } =
      req.body;

    // Verify ownership
    const isOwner = await menuManagementModel.verifyStallOwnership(
      stallId,
      userId
    );
    if (!isOwner) {
      return res.status(403).json({ error: "You do not own this stall" });
    }

    const menuItem = await menuManagementModel.createMenuItem(
      stallId,
      name,
      description,
      price,
      mainimageurl,
      category
    );

    res.status(201).json(menuItem);
  } catch (error) {
    console.error("Create menu item error", error);
    res.status(500).json({ error: "Error creating menu item" });
  }
}

async function updateMenuItem(req, res) {
  try {
    const userId = req.user.userId;
    const { menuItemId } = req.params;
    const { name, description, price, mainimageurl, category } = req.body;

    // Verify ownership through menu item -> stall
    const isOwner = await menuManagementModel.verifyMenuItemOwnership(
      menuItemId,
      userId
    );
    if (!isOwner) {
      return res.status(403).json({ error: "You do not own this menu item" });
    }

    const updatedItem = await menuManagementModel.updateMenuItem(
      menuItemId,
      name,
      description,
      price,
      mainimageurl,
      category
    );

    res.json(updatedItem);
  } catch (error) {
    console.error("Update menu item error", error);
    res.status(500).json({ error: "Error updating menu item" });
  }
}

async function deleteMenuItem(req, res) {
  try {
    const userId = req.user.userId;
    const { menuItemId } = req.params;

    // Verify ownership
    const isOwner = await menuManagementModel.verifyMenuItemOwnership(
      menuItemId,
      userId
    );
    if (!isOwner) {
      return res.status(403).json({ error: "You do not own this menu item" });
    }

    await menuManagementModel.deleteMenuItem(menuItemId);
    res.json({ message: "Menu item deleted successfully" });
  } catch (error) {
    console.error("Delete menu item error", error);
    res.status(500).json({ error: "Error deleting menu item" });
  }
}

module.exports = {
  uploadMenuItemImage,
  getMyStalls,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
};
