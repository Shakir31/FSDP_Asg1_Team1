const supabase = require("../supabaseClient");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const streamifier = require("streamifier");

// 1. Configure File Upload (Copied from menuManagementController.js)
const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
}).single("image"); // Expect input name="image"

async function searchByImage(req, res) {
  // Wrap everything in the upload middleware
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: "No image provided" });

    try {
      // 2. Upload to Cloudinary to get a public URL
      const imageUrl = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "visual_search_temp" },
          (error, result) => {
            if (error) return reject(error);
            resolve(result.secure_url);
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });

      // 3. Send URL to AI Service to get Vector
      const aiRes = await fetch("http://localhost:5000/embed-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });

      if (!aiRes.ok) throw new Error("AI Service failed");
      const { embedding } = await aiRes.json();

      // 4. Search Supabase with Vector
      const { data, error } = await supabase.rpc("match_menu_items", {
        query_embedding: embedding,
        match_threshold: 0.70,
        match_count: 5
      });

      if (error) throw error;
      res.json(data);

    } catch (err) {
      console.error("Search Error:", err);
      res.status(500).json({ error: "Visual search failed" });
    }
  });
}

module.exports = { searchByImage };