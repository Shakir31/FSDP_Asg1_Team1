const supabase = require("../supabaseClient");

// ===== KEEP THESE AS-IS (YOUR WORKING FUNCTIONS) =====

async function createUser(name, email, passwordHash, role) {
  try {
    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          name: name,
          email: email,
          passwordhash: passwordHash,
          role: role,
          coins: 0,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("DB createUser error", error);
    throw error;
  }
}

async function getUserByEmail(email) {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows found
    return data;
  } catch (error) {
    console.error("DB getUserByEmail error", error);
    throw error;
  }
}

// ===== ADMIN FUNCTIONS (REDONE) =====

async function getAllUsers() {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("userid, name, email, role, coins, createdat")
      .order("userid", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("DB getAllUsers error", error);
    throw error;
  }
}

async function getUserById(userId) {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("userid, name, email, coins, role, createdat")
      .eq("userid", userId)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data;
  } catch (error) {
    console.error("DB getUserById error", error);
    throw error;
  }
}

async function updateUserById(id, { name, email, password, role, coins }) {
  try {
    const updateData = {};

    // Only add fields that are actually provided (not null/undefined)
    if (name !== undefined && name !== null) {
      updateData.name = name;
    }
    if (email !== undefined && email !== null) {
      updateData.email = email;
    }
    if (password !== undefined && password !== null) {
      updateData.passwordhash = password;
    }
    if (role !== undefined && role !== null) {
      updateData.role = role;
    }
    if (coins !== undefined && coins !== null) {
      updateData.coins = coins;
    }

    // If no fields to update, return early
    if (Object.keys(updateData).length === 0) {
      throw new Error("No fields provided to update");
    }

    const { data, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("userid", id)
      .select("userid, name, email, role, coins, createdat")
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("DB updateUserById error", error);
    throw error;
  }
}

async function deleteUserById(id) {
  try {
    const { error } = await supabase.from("users").delete().eq("userid", id);

    if (error) throw error;
    return { deleted: true };
  } catch (error) {
    console.error("DB deleteUserById error", error);
    throw error;
  }
}

module.exports = {
  createUser,
  getUserByEmail,
  getUserById,
  getAllUsers,
  updateUserById,
  deleteUserById,
};
