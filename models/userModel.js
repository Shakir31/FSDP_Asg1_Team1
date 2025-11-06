const sql = require("mssql");
const dbConfig = require("../dbConfig");

async function createUser(name, email, passwordHash, role) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const sqlQuery = `INSERT INTO Users (Name, Email, PasswordHash, Role, Coins) OUTPUT INSERTED.* VALUES (@name, @email, @passwordHash, @role, 0);`;
    const request = connection.request();
    request.input("name", sql.VarChar, name);
    request.input("email", sql.VarChar, email);
    request.input("passwordHash", sql.VarChar, passwordHash);
    request.input("role", sql.VarChar, role);
    const result = await request.query(sqlQuery);
    return result.recordset[0];
  } catch (error) {
    console.error("DB createUser error", error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

async function getUserByEmail(email) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const result = await connection
      .request()
      .input("email", sql.VarChar, email)
      .query("SELECT * FROM Users WHERE Email = @email");
    return result.recordset[0];
  } catch (error) {
    console.error("DB getUserByEmail error", error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

module.exports = { createUser, getUserByEmail };
