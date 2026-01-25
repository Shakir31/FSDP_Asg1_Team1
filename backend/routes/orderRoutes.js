const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middlewares/authMiddleware");

// Order endpoints
router.post(
  "/",
  authenticateToken,
  authorizeRoles("customer"),
  orderController.placeOrder
);
router.get(
  "/history",
  authenticateToken,
  authorizeRoles("customer"),
  orderController.getOrderHistory
);
router.put("/payment", authenticateToken, orderController.updatePaymentStatus);
router.put(
  "/:orderId/status",
  authenticateToken,
  orderController.updateOrderStatus
);
router.get("/:orderId", authenticateToken, orderController.getOrderDetails);

module.exports = router;
