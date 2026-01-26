// models/menuManagementModel.js
const supabase = require("../supabaseClient");

async function getStallsByOwner(userId) {
  try {
    const { data, error } = await supabase
      .from("stalls")
      .select("stallid, stallname, description, category, stall_image")
      .eq("owner_id", userId)
      .order("stallname", { ascending: true });

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

async function verifyStallOwnership(stallId, userId) {
  try {
    const { data, error } = await supabase
      .from("stalls")
      .select("owner_id")
      .eq("stallid", stallId)
      .single();

    if (error) throw error;
    return data.owner_id === userId;
  } catch (error) {
    return false;
  }
}

async function verifyMenuItemOwnership(menuItemId, userId) {
  try {
    const { data, error } = await supabase
      .from("menuitems")
      .select(
        `
        stallid,
        stalls!inner(owner_id)
      `
      )
      .eq("menuitemid", menuItemId)
      .single();

    if (error) throw error;
    return data.stalls.owner_id === userId;
  } catch (error) {
    return false;
  }
}

async function createMenuItem(
  stallId,
  name,
  description,
  price,
  mainimageurl,
  category
) {
  try {
    const { data, error } = await supabase
      .from("menuitems")
      .insert([
        {
          stallid: stallId,
          name: name,
          description: description,
          price: price,
          mainimageurl: mainimageurl,
          category: category,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

async function updateMenuItem(
  menuItemId,
  name,
  description,
  price,
  mainimageurl,
  category
) {
  try {
    const { data, error } = await supabase
      .from("menuitems")
      .update({
        name: name,
        description: description,
        price: price,
        mainimageurl: mainimageurl,
        category: category,
      })
      .eq("menuitemid", menuItemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

async function deleteMenuItem(menuItemId) {
  try {
    const { error } = await supabase
      .from("menuitems")
      .delete()
      .eq("menuitemid", menuItemId);

    if (error) throw error;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  getStallsByOwner,
  verifyStallOwnership,
  verifyMenuItemOwnership,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
};
