const sql = require("mssql");
const dbConfig = require("../dbConfig");

async function createReview(menuItemId, userId, rating, reviewText, imageId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const result = await connection
      .request()
      .input("menuItemId", sql.Int, menuItemId)
      .input("userId", sql.Int, userId)
      .input("rating", sql.Int, rating)
      .input("reviewText", sql.NVarChar, reviewText)
      .input("imageId", sql.Int, imageId)
      .query(
        "INSERT INTO Reviews (MenuItemID, UserID, Rating, ReviewText, ImageID) OUTPUT INSERTED.* VALUES (@menuItemId, @userId, @rating, @reviewText, @imageId)"
      );
    return result.recordset[0];
  } catch (error) {
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

async function getReviewsByMenuItem(menuItemId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const result = await connection
      .request()
      .input("menuItemId", sql.Int, menuItemId).query(`
        SELECT r.*, i.ImageURL
        FROM Reviews r
        LEFT JOIN Images i ON r.ImageID = i.ImageID
        WHERE r.MenuItemID = @menuItemId
        ORDER BY r.CreatedAt DESC
      `);
    return result.recordset;
  } catch (error) {
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

async function getReviewsByStall(stallId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const result = await connection.request().input("stallId", sql.Int, stallId)
      .query(`
        SELECT r.*, i.ImageURL
        FROM Reviews r
        INNER JOIN MenuItems m ON r.MenuItemID = m.MenuItemID
        LEFT JOIN Images i ON r.ImageID = i.ImageID
        WHERE m.StallID = @stallId
        ORDER BY r.CreatedAt DESC
      `);
    return result.recordset;
  } catch (error) {
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

module.exports = { createReview, getReviewsByMenuItem, getReviewsByStall };
