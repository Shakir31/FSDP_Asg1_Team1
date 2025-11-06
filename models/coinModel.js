const sql = require("mssql");
const dbConfig = require("../dbConfig");

async function addCoins(userId, amount) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    await connection
      .request()
      .input("userId", sql.Int, userId)
      .input("amount", sql.Int, amount)
      .query("UPDATE Users SET Coins = Coins + @amount WHERE UserID = @userId");
  } catch (error) {
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

async function insertCoinTransaction(userId, coins, description) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    await connection
      .request()
      .input("userId", sql.Int, userId)
      .input("coins", sql.Int, coins)
      .input("description", sql.VarChar, description)
      .query(
        "INSERT INTO CoinTransactions (UserID, CoinsEarned, Description) VALUES (@userId, @coins, @description)"
      );
  } catch (error) {
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

async function getUserCoins(userId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const result = await connection
      .request()
      .input("userId", sql.Int, userId)
      .query("SELECT Coins FROM Users WHERE UserID = @userId");
    if (result.recordset.length > 0) {
      return result.recordset[0].Coins;
    }
    return 0; // or null if user not found
  } catch (error) {
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

module.exports = { addCoins, insertCoinTransaction, getUserCoins };
