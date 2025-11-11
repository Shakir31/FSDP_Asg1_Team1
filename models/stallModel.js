const sql = require("mssql");
const dbConfig = require("../dbConfig");

async function createStall(stallName, description, hawker_centre, category) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const result = await connection
      .request()
      .input("stallName", sql.VarChar, stallName)
      .input("description", sql.VarChar, description)
      .input("hawker_centre", sql.VarChar, hawker_centre)
      .input("category", sql.VarChar, category)
      .query(
        "INSERT INTO Stalls (StallName, Description, Hawker_Centre, Category) OUTPUT INSERTED.* VALUES (@stallName, @description, @hawker_centre, @category)"
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

async function createMenuItem(
  stallId,
  name,
  description,
  price,
  url,
  category
) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const result = await connection
      .request()
      .input("stallId", sql.Int, stallId)
      .input("name", sql.VarChar, name)
      .input("description", sql.VarChar, description)
      .input("price", sql.Decimal(6, 2), price)
      .input("url", sql.VarChar, url)
      .input("category", sql.VarChar, category)
      .query(
        "INSERT INTO MenuItems (StallID, Name, Description, Price, MainImageURL, Category) OUTPUT INSERTED.* VALUES (@stallId, @name, @description, @price, @url, @category)"
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

async function getStallsByCategory(category) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const result = await connection
      .request()
      .input("category", sql.VarChar, category)
      .query("SELECT * FROM Stalls WHERE Category = @category");
    return result.recordset;
  } catch (error) {
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

async function getStallsByHawkerCentre(hawkerCentre) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const result = await connection
      .request()
      .input("hawker_centre", sql.VarChar, hawkerCentre)
      .query("SELECT * FROM Stalls WHERE Hawker_Centre = @hawker_centre");
    return result.recordset;
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
  getStallsByCategory,
  getStallsByHawkerCentre,
};
