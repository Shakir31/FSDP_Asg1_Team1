const voucherModel = require("../models/voucherModel");

async function getAllVouchers(req, res) {
  try {
    const vouchers = await voucherModel.getAllVouchers();
    res.json(vouchers);
  } catch (error) {
    console.error("Error getting vouchers", error);
    res.status(500).json({ error: "Failed to get vouchers" });
  }
}

async function redeemVoucher(req, res) {
  try {
    const userId = parseInt(req.user.userId, 10);
    if (isNaN(userId))
      return res.status(400).json({ error: "Invalid user ID" });

    const { voucherId } = req.body;
    if (!voucherId)
      return res.status(400).json({ error: "Voucher ID required" });

    const result = await voucherModel.redeemVoucher(userId, voucherId);
    res.json(result);
  } catch (error) {
    console.error("Error redeeming voucher", error);
    res.status(400).json({ error: error.message });
  }
}

async function getUserVouchers(req, res) {
  try {
    const userId = parseInt(req.user.userId, 10);
    if (isNaN(userId))
      return res.status(400).json({ error: "Invalid user ID" });

    const vouchers = await voucherModel.getUserRedeemedVouchers(userId);
    res.json(vouchers);
  } catch (error) {
    console.error("Error fetching user vouchers", error);
    res.status(500).json({ error: "Failed to retrieve user vouchers" });
  }
}

async function useVoucher(req, res) {
  try {
    const userId = parseInt(req.user.userId, 10);
    if (isNaN(userId))
      return res.status(400).json({ error: "Invalid user ID" });

    const { userVoucherId } = req.body;
    if (!userVoucherId)
      return res.status(400).json({ error: "User voucher ID required" });

    const result = await voucherModel.useVoucher(userVoucherId);
    res.json(result);
  } catch (error) {
    console.error("Error using voucher", error);
    res.status(500).json({ error: "Failed to use voucher" });
  }
}

module.exports = {
  getAllVouchers,
  redeemVoucher,
  getUserVouchers,
  useVoucher,
};
