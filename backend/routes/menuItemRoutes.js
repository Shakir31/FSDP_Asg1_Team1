const express = require("express");
const router = express.Router();
const stallController = require("../controllers/stallController");

// Menu item endpoints
router.get("/:itemId", stallController.getMenuItemById);

module.exports = router;
