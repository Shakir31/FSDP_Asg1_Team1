const express = require("express");
const router = express.Router();
const voucherController = require("../controllers/voucherController");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middlewares/authMiddleware");

// Voucher endpoints
router.get("/", voucherController.getAllVouchers);
router.post(
  "/redeem",
  authenticateToken,
  authorizeRoles("customer"),
  voucherController.redeemVoucher
);
router.get(
  "/user",
  authenticateToken,
  authorizeRoles("customer"),
  voucherController.getUserVouchers
);
router.post(
  "/use",
  authenticateToken,
  authorizeRoles("customer"),
  voucherController.useVoucher
);

module.exports = router;
