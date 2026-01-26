const express = require("express");
const router = express.Router();
const hawkerController = require("../controllers/hawkerController");

// Hawker centre endpoints
router.get("/", hawkerController.getAllHawkerCentres);
router.get("/search", hawkerController.searchHawkerCentres);
router.get("/status", hawkerController.getHawkerCentresByStatus);
router.get("/:id", hawkerController.getHawkerCentreById);
router.get("/:id/stalls", hawkerController.getStallsByHawkerCentreId);

module.exports = router;
