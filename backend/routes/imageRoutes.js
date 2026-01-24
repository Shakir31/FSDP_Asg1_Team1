const express = require("express");
const router = express.Router();
const imageController = require("../controllers/imageController");
const { validateImageUpload } = require("../middlewares/imageValidation");
const { authenticateToken } = require("../middlewares/authMiddleware");

// Image upload and voting endpoints
router.post(
  "/upload",
  authenticateToken,
  validateImageUpload,
  imageController.uploadImage
);
router.post("/upvote", authenticateToken, imageController.upvoteImage);
router.get("/:imageId/reviewid", imageController.getReviewId);

module.exports = router;
