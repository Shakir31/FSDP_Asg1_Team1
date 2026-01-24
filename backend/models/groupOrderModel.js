const supabase = require("../supabaseClient");

async function createSession(hostUserId, joinCode) {
  try {
    const { data, error } = await supabase
      .from("group_sessions")
      .insert([{ host_userid: hostUserId, join_code: joinCode }])
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (err) {
    throw err;
  }
}

async function getSessionByCode(joinCode) {
  try {
    const { data, error } = await supabase
      .from("group_sessions")
      .select("*")
      .eq("join_code", joinCode)
      .eq("is_active", true)
      .single();
    if (error) return null;
    return data;
  } catch (err) {
    throw err;
  }
}

async function getSessionById(sessionId) {
  try {
    const { data, error } = await supabase
      .from("group_sessions")
      .select("*")
      .eq("sessionid", sessionId)
      .single();
    
    if (error) return null;
    return data;
  } catch (err) {
    throw err;
  }
}

async function addItemToGroupCart(sessionId, userId, menuItemId, quantity) {
  try {
    // Check if item exists for this user in this session
    const { data: existing } = await supabase
      .from("group_cart_items")
      .select("*")
      .match({ sessionid: sessionId, userid: userId, menuitemid: menuItemId })
      .single();

    if (existing) {
      // Update quantity
      const { data, error } = await supabase
        .from("group_cart_items")
        .update({ quantity: existing.quantity + quantity })
        .eq("id", existing.id)
        .select();
      if (error) throw error;
      return data;
    } else {
      // Insert new
      const { data, error } = await supabase
        .from("group_cart_items")
        .insert([{ sessionid: sessionId, userid: userId, menuitemid: menuItemId, quantity: quantity }])
        .select();
      if (error) throw error;
      return data;
    }
  } catch (err) {
    throw err;
  }
}

async function getGroupCartItems(sessionId) {
  try {
    // Join with menuitems and users tables to get names/details
    const { data, error } = await supabase
      .from("group_cart_items")
      .select(`
        id, quantity, userid, menuitemid,
        users ( name ),
        menuitems ( name, price, mainimageurl )
      `)
      .eq("sessionid", sessionId);

    if (error) throw error;
    return data;
  } catch (err) {
    throw err;
  }
}

async function closeSession(sessionId) {
  await supabase.from("group_sessions").update({ is_active: false }).eq("sessionid", sessionId);
}

module.exports = {
  createSession,
  getSessionByCode,
  getSessionById,
  addItemToGroupCart,
  getGroupCartItems,
  closeSession
};