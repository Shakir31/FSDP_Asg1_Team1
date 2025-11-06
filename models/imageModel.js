const sql = require("mssql");
const dbConfig = require("../dbConfig");

async function insertImage(menuItemId, uploaderId, imageUrl) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const result = await connection
      .request()
      .input("menuItemId", sql.Int, menuItemId)
      .input("uploaderId", sql.Int, uploaderId)
      .input("imageUrl", sql.VarChar, imageUrl)
      .query(
        "INSERT INTO Images (MenuItemID, UploaderID, ImageURL) OUTPUT INSERTED.* VALUES (@menuItemId, @uploaderId, @imageUrl)"
      );
    return result.recordset[0];
  } catch (error) {
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

async function voteImage(userId, imageId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    //check existing vote
    const check = await connection
      .request()
      .input("userId", sql.Int, userId)
      .input("imageId", sql.Int, imageId)
      .query(
        "SELECT * FROM ImageVotes WHERE UserID = @userId AND ImageID = @imageId"
      );
    if (check.recordset.length > 0) throw new Error("Already voted");

    await connection
      .request()
      .input("userId", sql.Int, userId)
      .input("imageId", sql.Int, imageId)
      .query(
        "INSERT INTO ImageVotes (ImageID, UserID) VALUES (@imageId, @userId)"
      );
  } catch (error) {
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

module.exports = { insertImage, voteImage };
