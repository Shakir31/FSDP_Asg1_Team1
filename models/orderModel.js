const supabase = require("../supabaseClient");

async function createOrder(userId, items, totalAmount) {
  try {
    // Step 1: Create the order
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          userid: userId,
          totalamount: totalAmount,
          orderstatus: "Pending",
          paymentstatus: "Unpaid",
        },
      ])
      .select()
      .single();

    if (orderError) throw orderError;

    const orderId = orderData.orderid;

    // Step 2: Insert all order items
    const orderItems = items.map((item) => ({
      orderid: orderId,
      menuitemid: item.menuItemId,
      quantity: item.quantity,
      price: item.price,
    }));

    const { error: itemsError } = await supabase
      .from("orderitems")
      .insert(orderItems);

    if (itemsError) throw itemsError;

    return { OrderID: orderId };
  } catch (error) {
    console.error("Create order error", error);
    throw error;
  }
}

async function getOrdersByUser(userId) {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("userid", userId)
      .order("orderdate", { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

async function updatePaymentStatus(orderId, paymentStatus) {
  try {
    const { error } = await supabase
      .from("orders")
      .update({ paymentstatus: paymentStatus })
      .eq("orderid", orderId);

    if (error) throw error;
  } catch (error) {
    throw error;
  }
}

module.exports = { createOrder, getOrdersByUser, updatePaymentStatus };
