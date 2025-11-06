const sql = require("mssql");
const dbConfig = require("../dbConfig");

async function createStall(stallName, description) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const result = await connection
      .request()
      .input("stallName", sql.VarChar, stallName)
      .input("description", sql.VarChar, description)
      .query(
        "INSERT INTO Stalls (StallName, Description) OUTPUT INSERTED.* VALUES (@stallName, @description)"
      );
    return result.recordset[0];
  } catch (error) {
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

async function getAllStalls() {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const result = await connection.request().query("SELECT * FROM Stalls");
    return result.recordset;
  } catch (error) {
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

async function createMenuItem(stallId, name, description, price) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const result = await connection
      .request()
      .input("stallId", sql.Int, stallId)
      .input("name", sql.VarChar, name)
      .input("description", sql.VarChar, description)
      .input("price", sql.Decimal(6, 2), price)
      .query(
        "INSERT INTO MenuItems (StallID, Name, Description, Price) OUTPUT INSERTED.* VALUES (@stallId, @name, @description, @price)"
      );
    return result.recordset[0];
  } catch (error) {
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

async function getMenuByStall(stallId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const result = await connection
      .request()
      .input("stallId", sql.Int, stallId)
      .query("SELECT * FROM MenuItems WHERE StallID = @stallId");
    return result.recordset;
  } catch (error) {
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

async function updateMenuItemPhoto(menuItemId, imageUrl) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    await connection
      .request()
      .input("menuItemId", sql.Int, menuItemId)
      .input("imageUrl", sql.VarChar, imageUrl)
      .query(
        "UPDATE MenuItems SET MainImageURL = @imageUrl WHERE MenuItemID = @menuItemId"
      );
  } catch (error) {
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

module.exports = {
  createStall,
  getAllStalls,
  createMenuItem,
  getMenuByStall,
  updateMenuItemPhoto,
};
