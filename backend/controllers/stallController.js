const stallModel = require("../models/stallModel");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

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
}).single("stallImage");

async function uploadStallImage(req, res) {
  upload(req, res, async (uploadErr) => {
    if (uploadErr) {
      console.error("Upload error:", uploadErr);
      return res.status(400).json({ error: uploadErr.message });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      // Upload to Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "stall_images" },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        const streamifier = require("streamifier");
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });

      res.status(200).json({
        message: "Image uploaded successfully",
        imageUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id,
      });
    } catch (error) {
      console.error("Upload stall image error:", error);
      res.status(500).json({ error: "Error uploading image" });
    }
  });
}

async function createStall(req, res) {
  try {
    const {
      stallname,
      description,
      hawker_centre_id,
      category,
      stall_image,
      owner_id,
    } = req.body;

    // Validate required fields
    if (!stallname || !category) {
      return res
        .status(400)
        .json({ error: "Stall name and category are required" });
    }

    const stall = await stallModel.createStall({
      stallname,
      description,
      hawker_centre_id,
      category,
      stall_image,
      owner_id,
    });

    res.status(201).json(stall);
  } catch (error) {
    console.error("Create stall error:", error);
    res.status(500).json({ error: "Error creating stall" });
  }
}

async function getAllStalls(req, res) {
  try {
    const stalls = await stallModel.getAllStalls();
    res.json(stalls);
  } catch (error) {
    console.error("Get stalls error:", error);
    res.status(500).json({ error: "Error fetching stalls" });
  }
}

async function createMenuItem(req, res) {
  try {
    const { stallId, name, description, price, url, category } = req.body;
    const menuItem = await stallModel.createMenuItem(
      stallId,
      name,
      description,
      price,
      url,
      category
    );
    res.status(201).json(menuItem);
  } catch (error) {
    console.error("Create menu item error:", error);
    res.status(500).json({ error: "Error creating menu item" });
  }
}

async function getMenuByStall(req, res) {
  try {
    const { stallId } = req.params;
    const menuItems = await stallModel.getMenuByStall(stallId);
    res.json(menuItems);
  } catch (error) {
    console.error("Get menu error:", error);
    res.status(500).json({ error: "Error fetching menu items" });
  }
}

async function updateMenuItemPhoto(req, res) {
  try {
    const { menuItemId, imageUrl } = req.body;
    await stallModel.updateMenuItemPhoto(menuItemId, imageUrl);
    res.json({ message: "Menu item photo updated" });
  } catch (error) {
    console.error("Update menu photo error:", error);
    res.status(500).json({ error: "Error updating menu photo" });
  }
}

async function getStallsByCategory(req, res) {
  try {
    const { category } = req.query;
    if (!category)
      return res.status(400).json({ error: "Category is required" });
    const stalls = await stallModel.getStallsByCategory(category);
    res.json(stalls);
  } catch (error) {
    console.error("Get stalls by category error:", error);
    res.status(500).json({ error: "Error fetching stalls by category" });
  }
}

async function getStallsByHawkerCentre(req, res) {
  try {
    const { hawker_centre } = req.query;
    if (!hawker_centre)
      return res.status(400).json({ error: "Hawker centre is required" });
    const stalls = await stallModel.getStallsByHawkerCentre(hawker_centre);
    res.json(stalls);
  } catch (error) {
    console.error("Get stalls by hawker centre error:", error);
    res.status(500).json({ error: "Error fetching stalls by hawker centre" });
  }
}

async function getStallById(req, res) {
  try {
    const { id } = req.params;
    const stall = await stallModel.getStallById(id);
    if (!stall) {
      return res.status(404).json({ error: "Stall not found" });
    }
    res.json(stall);
  } catch (error) {
    console.error("Get stall by ID error:", error);
    res.status(500).json({ error: "Error fetching stall" });
  }
}

async function getMenuItemById(req, res) {
  try {
    const { itemId } = req.params;
    const item = await stallModel.getMenuItemById(itemId);
    if (!item) {
      return res.status(404).json({ error: "Menu item not found" });
    }
    res.json(item);
  } catch (error) {
    console.error("Get menu item by ID error:", error);
    res.status(500).json({ error: "Error fetching menu item" });
  }
}

async function getStallImages(req, res) {
  try {
    const { id } = req.params;

    // Extract userId from token if provided (optional authentication)
    let currentUserId = null;
    if (req.user && req.user.userId) {
      currentUserId = req.user.userId;
    }

    const images = await stallModel.getImagesByStall(id, currentUserId);
    res.json(images);
  } catch (error) {
    console.error("Get stall images error:", error);
    res.status(500).json({ error: "Error fetching stall images" });
  }
}

async function updateStall(req, res) {
  try {
    const id = parseInt(req.params.id, 10);

    // Validate ID
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid stall ID" });
    }

    const {
      stallname,
      description,
      category,
      stall_image,
      hawker_centre_id,
      owner_id,
    } = req.body;

    // Validate at least one field is provided
    if (
      !stallname &&
      !description &&
      !category &&
      !stall_image &&
      !hawker_centre_id &&
      owner_id === undefined
    ) {
      return res
        .status(400)
        .json({ error: "At least one field must be provided to update" });
    }

    // Check if stall exists
    const existingStall = await stallModel.getStallById(id);
    if (!existingStall) {
      return res.status(404).json({ error: "Stall not found" });
    }

    // Validate owner_id if provided
    if (owner_id !== undefined && owner_id !== null) {
      const ownerIdInt = parseInt(owner_id, 10);
      if (isNaN(ownerIdInt) || ownerIdInt <= 0) {
        return res.status(400).json({ error: "Invalid owner ID" });
      }
    }

    const updated = await stallModel.updateStallById(id, {
      stallname,
      description,
      category,
      stall_image,
      hawker_centre_id,
      owner_id:
        owner_id !== undefined
          ? owner_id
            ? parseInt(owner_id, 10)
            : null
          : undefined,
    });

    res.json({
      message: "Stall updated successfully",
      stall: updated,
    });
  } catch (error) {
    console.error("Update stall error:", error);
    res.status(500).json({ error: "Failed to update stall" });
  }
}

async function deleteStall(req, res) {
  try {
    const id = parseInt(req.params.id, 10);

    // Validate ID
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid stall ID" });
    }

    // Check if stall exists
    const stall = await stallModel.getStallById(id);
    if (!stall) {
      return res.status(404).json({ error: "Stall not found" });
    }

    await stallModel.deleteStallById(id);

    res.json({
      message: "Stall deleted successfully",
      deleted: true,
    });
  } catch (error) {
    console.error("Delete stall error:", error);
    res.status(500).json({ error: "Failed to delete stall" });
  }
}

module.exports = {
  createStall,
  getAllStalls,
  createMenuItem,
  getMenuByStall,
  updateMenuItemPhoto,
  getStallsByCategory,
  getStallsByHawkerCentre,
  getStallById,
  getMenuItemById,
  getStallImages,
  updateStall,
  deleteStall,
  uploadStallImage,
};
