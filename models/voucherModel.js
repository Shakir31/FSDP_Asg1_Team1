const sql = require("mssql");
const dbConfig = require("../dbConfig");

async function getAllVouchers() {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const result = await connection
      .request()
      .query(
        "SELECT VoucherID, Name, Description, CoinCost, QuantityAvailable, ExpiryDate FROM Vouchers WHERE QuantityAvailable > 0 AND ExpiryDate > GETDATE()"
      );
    return result.recordset;
  } catch (error) {
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

async function redeemVoucher(userId, voucherId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);

    //get voucher details
    const voucherResult = await connection
      .request()
      .input("voucherId", sql.Int, voucherId)
      .query(
        "SELECT * FROM Vouchers WHERE VoucherID = @voucherId AND QuantityAvailable > 0 AND ExpiryDate > GETDATE()"
      );
    if (voucherResult.recordset.length === 0)
      throw new Error("Voucher not available");
    const voucher = voucherResult.recordset[0];

    //check user coins
    const userResult = await connection
      .request()
      .input("userId", sql.Int, userId)
      .query("SELECT Coins FROM Users WHERE UserID = @userId");
    if (userResult.recordset.length === 0) throw new Error("User not found");
    if (userResult.recordset[0].Coins < voucher.CoinCost)
      throw new Error("Insufficient coins");

    //deduct voucher quantity
    await connection
      .request()
      .input("voucherId", sql.Int, voucherId)
      .query(
        "UPDATE Vouchers SET QuantityAvailable = QuantityAvailable - 1 WHERE VoucherID = @voucherId"
      );

    //deduct user coins
    await connection
      .request()
      .input("userId", sql.Int, userId)
      .input("coins", sql.Int, voucher.CoinCost)
      .query("UPDATE Users SET Coins = Coins - @coins WHERE UserID = @userId");

    //insert user voucher record
    await connection
      .request()
      .input("userId", sql.Int, userId)
      .input("voucherId", sql.Int, voucherId)
      .query(
        "INSERT INTO UserVouchers (UserID, VoucherID) VALUES (@userId, @voucherId)"
      );

    return { message: "Voucher redeemed successfully" };
  } catch (error) {
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

async function getUserRedeemedVouchers(userId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    // Select user vouchers joined with voucher details
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
  } finally {
    if (connection) await connection.close();
  }
}

module.exports = { getAllVouchers, redeemVoucher, getUserRedeemedVouchers };
