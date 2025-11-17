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

async function getAllUsers() {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    // Select only safe fields
    const result = await connection
      .request()
      .query(
        "SELECT UserID, Name, Email FROM Users ORDER BY UserID ASC"
      );
    return result.recordset;
  } catch (error) {
    console.error('DB getAllUsers error', error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

async function getUserById(userId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const result = await connection
      .request()
      .input("userId", sql.Int, userId)
      // Select only the fields we want to send to the client
      .query("SELECT UserID, Name, Email, Coins, Role FROM Users WHERE UserID = @userId");
    return result.recordset[0];
  } catch (error) {
    console.error("DB getUserById error", error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

async function updateUserById(id, { Name, Email, Password }) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input('id', sql.Int, id);
    request.input('Name', sql.VarChar, Name || null);
    request.input('Email', sql.VarChar, Email || null);

    // If password provided, update PasswordHash; otherwise update other fields only
    if (Password) {
      request.input('PasswordHash', sql.VarChar, Password);
      const q = `UPDATE Users SET Name = ISNULL(@Name, Name), Email = ISNULL(@Email, Email), PasswordHash = @PasswordHash WHERE UserID = @id; SELECT UserID, Name, Email FROM Users WHERE UserID = @id;`;
      const result = await request.query(q);
      return result.recordset[0];
    } else {
      const q = `UPDATE Users SET Name = ISNULL(@Name, Name), Email = ISNULL(@Email, Email) WHERE UserID = @id; SELECT UserID, Name, Email FROM Users WHERE UserID = @id;`;
      const result = await request.query(q);
      return result.recordset[0];
    }
  } catch (error) {
    console.error('DB updateUserById error', error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

async function deleteUserById(id) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input('id', sql.Int, id);
    const q = 'DELETE FROM Users WHERE UserID = @id;';
    await request.query(q);
    return { deleted: true };
  } catch (error) {
    console.error('DB deleteUserById error', error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}



module.exports = { 
  createUser, 
  getUserByEmail,
  getUserById, getAllUsers, updateUserById, deleteUserById
 };
