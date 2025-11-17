const fs = require("fs");
const axios = require("axios");

exports.uploadImage = async (req, res) => {
  try {
    const files = req.files && req.files.length ? req.files : (req.file ? [req.file] : []);
    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    if (!process.env.LOGMEAL_API_KEY) {
      console.error("LOGMEAL_API_KEY missing");
      return res.status(500).json({ message: "LogMeal API key not configured on server" });
    }

    const detections = [];

    for (const file of files) {
      try {
        let resp;
        // If multer memoryStorage used, file.buffer exists
        if (file.buffer) {
          resp = await axios.post(
            "https://api.logmeal.es/v2/image/recognition/dish",
            file.buffer,
            {
              headers: {
                "Content-Type": file.mimetype || "image/jpeg",
                Authorization: `Bearer ${process.env.LOGMEAL_API_KEY}`,
              },
              timeout: 20000,
            }
          );
        } else if (file.path) {
          // disk storage
          const stream = fs.createReadStream(file.path);
          resp = await axios.post(
            "https://api.logmeal.es/v2/image/recognition/dish",
            stream,
            {
              headers: {
                "Content-Type": file.mimetype || "image/jpeg",
                Authorization: `Bearer ${process.env.LOGMEAL_API_KEY}`,
              },
              timeout: 20000,
            }
          );
        } else {
          throw new Error("Uploaded file has neither buffer nor path");
        }

        detections.push({
          filename: file.originalname || file.filename || "unknown",
          result: resp.data,
        });
      } catch (innerErr) {
        console.error("LogMeal call failed for file:", file.originalname || file.filename, innerErr?.response?.data || innerErr.message);
        detections.push({
          filename: file.originalname || file.filename || "unknown",
          error: innerErr?.response?.data || innerErr.message,
        });
      }
    }

    // Optionally persist images/review here using your imageModel
    return res.json({
      message: "Files processed",
      detections,
      uploadedCount: files.length,
      review: req.body.review || null,
      stallId: req.body.stallId || null,
    });
  } catch (err) {
    console.error("uploadImage error:", err);
    return res.status(500).json({
      message: "Server error during upload",
      error: (err && err.message) || err,
    });
  }
};
