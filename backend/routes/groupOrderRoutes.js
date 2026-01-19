const express = require("express");
const router = express.Router();
const groupOrderController = require("../controllers/groupOrderController");
const { authenticateToken } = require("../middlewares/authMiddleware");

router.post("/start", authenticateToken, groupOrderController.startSession);
router.post("/join", authenticateToken, groupOrderController.joinSession);
router.post("/add", authenticateToken, groupOrderController.addToGroupCart);
router.get("/:sessionId/cart", authenticateToken, groupOrderController.getGroupCart);
router.post("/finalize", authenticateToken, groupOrderController.finalizeGroupOrder);

module.exports = router;