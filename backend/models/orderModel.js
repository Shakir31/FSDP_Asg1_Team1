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

    return { orderid: orderId };
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

async function getOrderDetailsWithItems(orderId, userId) {
  try {
    // First, verify the order belongs to the user
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("orderid", orderId)
      .eq("userid", userId)
      .single();

    if (orderError) {
      if (orderError.code === "PGRST116") return null; // Not found
      throw orderError;
    }

    // Fetch order items with menu item details
    const { data: itemsData, error: itemsError } = await supabase
      .from("orderitems")
      .select(
        `
        orderitemid,
        quantity,
        price,
        menuitems (
          menuitemid,
          name,
          description,
          mainimageurl,
          stallid,
          stalls (
            stallid,
            stallname
          )
        )
      `
      )
      .eq("orderid", orderId);

    if (itemsError) throw itemsError;

    return {
      ...orderData,
      items: itemsData.map((item) => ({
        orderitemid: item.orderitemid,
        menuitemid: item.menuitems.menuitemid,
        name: item.menuitems.name,
        description: item.menuitems.description,
        mainimageurl: item.menuitems.mainimageurl,
        stallid: item.menuitems.stallid,
        stallname: item.menuitems.stalls.stallname,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.quantity * item.price,
      })),
    };
  } catch (error) {
    console.error("Get order details error", error);
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

module.exports = {
  createOrder,
  getOrdersByUser,
  getOrderDetailsWithItems,
  updatePaymentStatus,
};
