const sql = require("mssql");
const dbConfig = require("../dbConfig");

async function createOrder(userId, items, totalAmount) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const transaction = new sql.Transaction(connection);
    await transaction.begin();

    const request = new sql.Request(transaction);
    request.input("userId", sql.Int, userId);
    request.input("totalAmount", sql.Decimal(8, 2), totalAmount);

    const orderResult = await request.query(
      `INSERT INTO Orders (UserID, TotalAmount, OrderStatus, PaymentStatus) OUTPUT INSERTED.OrderID VALUES (@userId, @totalAmount, 'Pending', 'Unpaid')`
    );

    const orderId = orderResult.recordset[0].OrderID;

    // Insert order items one by one, awaiting each to prevent blocking
    for (const item of items) {
      const itemRequest = new sql.Request(transaction);
      itemRequest.input("orderId", sql.Int, orderId);
      itemRequest.input("menuItemId", sql.Int, item.menuItemId);
      itemRequest.input("quantity", sql.Int, item.quantity);
      itemRequest.input("price", sql.Decimal(6, 2), item.price);
      await itemRequest.query(
        `INSERT INTO OrderItems (OrderID, MenuItemID, Quantity, Price) VALUES (@orderId, @menuItemId, @quantity, @price)`
      );
    }

    await transaction.commit();
    return { OrderID: orderId };
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (e) {
        console.error("Rollback error", e);
      }
    }
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

async function getOrdersByUser(userId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const result = await connection
      .request()
      .input("userId", sql.Int, userId)
      .query(
        "SELECT * FROM Orders WHERE UserID = @userId ORDER BY OrderDate DESC"
      );
    return result.recordset;
  } catch (error) {
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

async function updatePaymentStatus(orderId, paymentStatus) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    await connection
      .request()
      .input("orderId", sql.Int, orderId)
      .input("paymentStatus", sql.VarChar, paymentStatus)
      .query(
        "UPDATE Orders SET PaymentStatus = @paymentStatus WHERE OrderID = @orderId"
      );
  } catch (error) {
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

module.exports = { createOrder, getOrdersByUser, updatePaymentStatus };
