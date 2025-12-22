const supabase = require("../supabaseClient");

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

async function getAllUsers() {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("userid, name, email")
      .order("userid", { ascending: true });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("DB getAllUsers error", error);
    throw error;
  }
}

async function getUserById(userId) {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("userid, name, email, coins, role")
      .eq("userid", userId)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data;
  } catch (error) {
    console.error("DB getUserById error", error);
    throw error;
  }
}

async function updateUserById(id, { Name, Email, Password }) {
  try {
    const updateData = {};
    if (Name) updateData.name = Name;
    if (Email) updateData.email = Email;
    if (Password) updateData.passwordhash = Password;

    const { data, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("userid", id)
      .select("userid, name, email")
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
