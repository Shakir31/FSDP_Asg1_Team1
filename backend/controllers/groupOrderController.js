const orderModel = require("../models/orderModel");
const groupOrderModel = require("../models/groupOrderModel");

// 1. Start a Group Order (Host)
async function startSession(req, res) {
  try {
    const userId = req.user.userId;
    // Generate a simple 4-digit code
    const joinCode = Math.floor(1000 + Math.random() * 9000).toString();
    
    const session = await groupOrderModel.createSession(userId, joinCode);
    res.json({ session });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create session" });
  }
}

// 2. Join a Group Order (Guest)
async function joinSession(req, res) {
  try {
    const { joinCode } = req.body;
    const session = await groupOrderModel.getSessionByCode(joinCode);
    
    if (!session) {
      return res.status(404).json({ error: "Session not found or inactive" });
    }
    res.json({ session });
  } catch (error) {
    res.status(500).json({ error: "Error joining session" });
  }
}

// 3. Add Item to Group Cart
async function addToGroupCart(req, res) {
  try {
    const userId = req.user.userId;
    const { sessionId, menuItemId, quantity } = req.body;
    
    await groupOrderModel.addItemToGroupCart(sessionId, userId, menuItemId, quantity);
    res.json({ message: "Item added to group order" });
  } catch (error) {
    console.error("getGroupCart error:", error);
    res.status(500).json({ error: "Failed to add item" });
  }
}

// 4. Get Group Cart Details (Polling)
async function getGroupCart(req, res) {
  try {
    const { sessionId } = req.params;
    // Check if session is active and exists
    const session = await groupOrderModel.getSessionById(sessionId);

    if (!session || session.is_active === false) {
      return res.status(404).json({ error: "Session ended by host" });
    }

    const items = await groupOrderModel.getGroupCartItems(sessionId);
    res.json({ items });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch cart" });
  }
}

async function finalizeGroupOrder(req, res) {
  try {
    const { sessionId, totalAmount } = req.body;
    const userId = req.user.userId; // The Host's ID

    // 1. Get the items one last time
    const items = await groupOrderModel.getGroupCartItems(sessionId);
    
    if (!items || items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // 2. Format items for the Order Model
    // (We map the group items to the structure createOrder expects)
    const orderItems = items.map((item) => ({
      menuItemId: item.menuitemid,
      quantity: item.quantity,
      price: item.menuitems.price, // Ensure your getGroupCartItems query joins menuitems
    }));

    // 3. Create the official Order
    // We reuse your existing logic so it inserts into 'orders' and 'orderitems' tables
    const newOrder = await orderModel.createOrder(userId, orderItems, totalAmount);

    // 4. Close the Session (Mark as inactive)
    await groupOrderModel.closeSession(sessionId);

    // 5. Return success
    res.json({ orderId: newOrder.orderid });
  } catch (error) {
    console.error("Finalize error:", error);
    res.status(500).json({ error: "Failed to finalize group order" });
  }
}

module.exports = {
  startSession,
  joinSession,
  addToGroupCart,
  getGroupCart,
  finalizeGroupOrder
};