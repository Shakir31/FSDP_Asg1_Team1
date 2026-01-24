const express = require("express");
const router = express.Router();
const missionController = require("../controllers/missionController");
const { authenticateToken, optionalAuth } = require("../middlewares/authMiddleware");

router.get("/daily", optionalAuth, missionController.getDailyMissions);
router.post("/claim", authenticateToken, missionController.claimMission);

module.exports = router;