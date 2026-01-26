const orderModel = require("../models/orderModel");

async function placeOrder(req, res) {
  try {
    const userId = parseInt(req.user.userId, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid userId from token" });
    }

    const { items, totalAmount, userVoucherId } = req.body;

    // Create the order
    const newOrder = await orderModel.createOrder(userId, items, totalAmount);

    // If voucher was used, delete it from uservouchers
    if (userVoucherId) {
      try {
        await fetch("http://localhost:3000/vouchers/use", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: req.headers.authorization,
          },
          body: JSON.stringify({ userVoucherId }),
        });
      } catch (error) {
        console.error("Error using voucher:", error);
        // Don't fail the order if voucher deletion fails
      }
    }

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

async function getOrderDetails(req, res) {
  try {
    const userId = req.user.userId;
    const orderId = parseInt(req.params.orderId, 10);

    if (isNaN(orderId)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    const orderDetails = await orderModel.getOrderDetailsWithItems(
      orderId,
      userId
    );

    if (!orderDetails) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(orderDetails);
  } catch (error) {
    console.error("Get order details error", error);
    res.status(500).json({ error: "Error fetching order details" });
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

async function updateOrderStatus(req, res) {
  try {
    const userId = req.user.userId;
    const orderId = parseInt(req.params.orderId, 10);
    const { orderStatus } = req.body;

    if (isNaN(orderId)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    if (!orderStatus) {
      return res.status(400).json({ error: "Order status is required" });
    }

    // Verify order belongs to user before updating
    const orderDetails = await orderModel.getOrderDetailsWithItems(
      orderId,
      userId
    );

    if (!orderDetails) {
      return res.status(404).json({ error: "Order not found or unauthorized" });
    }

    // Update the order status
    await orderModel.updateOrderStatus(orderId, orderStatus);

    res.json({
      message: "Order status updated successfully",
      orderId,
      newStatus: orderStatus,
    });
  } catch (error) {
    console.error("Update order status error", error);
    res.status(500).json({ error: "Error updating order status" });
  }
}

module.exports = {
  placeOrder,
  getOrderHistory,
  getOrderDetails,
  updatePaymentStatus,
  updateOrderStatus,
};
