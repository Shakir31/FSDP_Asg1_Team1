const sql = require("mssql");
const dbConfig = require("../dbConfig");

async function getAllVouchers() {
  try {
    const connection = await sql.connect(dbConfig);
    const result = await connection
      .request()
      .query(
        "SELECT VoucherID, Name, Description, CoinCost, QuantityAvailable, ExpiryDate FROM Vouchers WHERE QuantityAvailable > 0 AND ExpiryDate > GETDATE()"
      );
    return result.recordset;
  } catch (error) {
    throw error;
  }
  // NO finally block - don't close the pool
}

async function redeemVoucher(userId, voucherId) {
  let transaction;
  try {
    console.log("Step 1: About to connect...");
    const pool = await sql.connect(dbConfig);
    console.log("Step 2: Connected, pool state:", pool.connected);

    transaction = new sql.Transaction(pool);
    console.log("Step 3: Transaction created");

    await transaction.begin();
    console.log("Step 4: Transaction begun");

    //get voucher details
    console.log("Step 5: Creating voucher request");
    const voucherRequest = new sql.Request(transaction);
    voucherRequest.input("voucherId", sql.Int, voucherId);

    console.log("Step 6: About to query voucher...");
    const voucherResult = await voucherRequest.query(
      "SELECT * FROM Vouchers WHERE VoucherID = @voucherId AND QuantityAvailable > 0 AND ExpiryDate > GETDATE()"
    );
    console.log(
      "Step 7: Voucher query completed, records:",
      voucherResult.recordset.length
    );

    if (voucherResult.recordset.length === 0) {
      console.log("Step 7a: Voucher not found, rolling back");
      await transaction.rollback();
      throw new Error("Voucher not available");
    }
    const voucher = voucherResult.recordset[0];
    console.log("Step 8: Voucher found, cost:", voucher.CoinCost);

    //check user coins
    console.log("Step 8.5: Pool still connected?", pool.connected);
    console.log("Step 9: About to check user coins...");
    const userRequest = new sql.Request(transaction);
    console.log("Step 9.5: User request created");
    userRequest.input("userId", sql.Int, userId);
    console.log("Step 9.6: User ID input added, about to execute query");
    const userResult = await userRequest.query(
      "SELECT Coins FROM Users WHERE UserID = @userId"
    );
    console.log("Step 10: User query completed");

    if (userResult.recordset.length === 0) {
      console.log("Step 10a: User not found");
      await transaction.rollback();
      throw new Error("User not found");
    }
    if (userResult.recordset[0].Coins < voucher.CoinCost) {
      console.log("Step 10b: Insufficient coins");
      await transaction.rollback();
      throw new Error("Insufficient coins");
    }
    console.log("Step 11: User has enough coins");

    //deduct voucher quantity
    console.log("Step 12: About to update voucher quantity...");
    const updateVoucherRequest = new sql.Request(transaction);
    updateVoucherRequest.input("voucherId", sql.Int, voucherId);
    await updateVoucherRequest.query(
      "UPDATE Vouchers SET QuantityAvailable = QuantityAvailable - 1 WHERE VoucherID = @voucherId"
    );
    console.log("Step 13: Voucher quantity updated");

    //deduct user coins
    console.log("Step 14: About to deduct user coins...");
    const updateCoinsRequest = new sql.Request(transaction);
    updateCoinsRequest.input("userId", sql.Int, userId);
    updateCoinsRequest.input("coins", sql.Int, voucher.CoinCost);
    await updateCoinsRequest.query(
      "UPDATE Users SET Coins = Coins - @coins WHERE UserID = @userId"
    );
    console.log("Step 15: User coins deducted");

    //insert user voucher record
    console.log("Step 16: About to insert user voucher...");
    const insertVoucherRequest = new sql.Request(transaction);
    insertVoucherRequest.input("userId", sql.Int, userId);
    insertVoucherRequest.input("voucherId", sql.Int, voucherId);
    await insertVoucherRequest.query(
      "INSERT INTO UserVouchers (UserID, VoucherID) VALUES (@userId, @voucherId)"
    );
    console.log("Step 17: User voucher inserted");

    console.log("Step 18: About to commit transaction...");
    await transaction.commit();
    console.log("Step 19: Transaction committed successfully");
    return { message: "Voucher redeemed successfully" };
  } catch (error) {
    console.error("Error at some step:", error.message);
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (e) {
        console.error("Rollback error", e);
      }
    }
    throw error;
  }
}

async function getUserRedeemedVouchers(userId) {
  try {
    const connection = await sql.connect(dbConfig);
    const result = await connection.request().input("userId", sql.Int, userId)
      .query(`
        SELECT uv.UserVoucherID, v.Name, v.Description, v.CoinCost, v.ExpiryDate, uv.RedeemedAt
        FROM UserVouchers uv
        INNER JOIN Vouchers v ON uv.VoucherID = v.VoucherID
        WHERE uv.UserID = @userId
        ORDER BY uv.RedeemedAt DESC
      `);
    return result.recordset;
  } catch (error) {
    throw error;
  }
  // NO finally block - don't close the pool
}

module.exports = { getAllVouchers, redeemVoucher, getUserRedeemedVouchers };
