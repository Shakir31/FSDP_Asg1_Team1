const coinModel = require("../models/coinModel");

async function awardPhotoUploadCoins(req, res) {
  try {
    const userIdNum = parseInt(req.user.userId, 10);
    if (isNaN(userIdNum)) {
      return res.status(400).json({ error: "Invalid userId from token" });
    }

    const coinAmount = 10;
    await coinModel.addCoins(userIdNum, coinAmount);
    await coinModel.insertCoinTransaction(
      userIdNum,
      coinAmount,
      "Upload food photo reward"
    );

    res.json({ message: "Coins awarded successfully" });
  } catch (error) {
    console.error("Award coins error", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function getUserCoins(req, res) {
  try {
    const userIdNum = parseInt(req.user.userId, 10);
    if (isNaN(userIdNum)) {
      return res.status(400).json({ error: "Invalid userId from token" });
    }
    const coins = await coinModel.getUserCoins(userIdNum);
    res.json({ coins });
  } catch (error) {
    console.error("Error fetching user coins", error);
    res.status(500).json({ error: "Error fetching coin balance" });
  }
}

module.exports = { awardPhotoUploadCoins, getUserCoins };
