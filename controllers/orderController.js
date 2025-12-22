const orderModel = require("../models/orderModel");

async function placeOrder(req, res) {
  try {
    const userId = parseInt(req.user.userId, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid userId from token" });
    }
    const { items, totalAmount } = req.body;
    const newOrder = await orderModel.createOrder(userId, items, totalAmount);
    res.status(201).json({ orderId: newOrder.orderid });
  } catch (error) {
    console.error("Place order error", error);
    res.status(500).json({ error: "Error placing order" });
  }
}

async function getOrderHistory(req, res) {
  try {
    const userId = req.user.userId;
    const orders = await orderModel.getOrdersByUser(userId);
    res.json(orders);
  } catch (error) {
    console.error("Get order history error", error);
    res.status(500).json({ error: "Error fetching order history" });
  }
}

async function updatePaymentStatus(req, res) {
  try {
    const { orderId, paymentStatus } = req.body;
    await orderModel.updatePaymentStatus(orderId, paymentStatus);
    res.json({ message: "Payment status updated" });
  } catch (error) {
    console.error("Payment status update error", error);
    res.status(500).json({ error: "Error updating payment status" });
  }
}

module.exports = { placeOrder, getOrderHistory, updatePaymentStatus };
