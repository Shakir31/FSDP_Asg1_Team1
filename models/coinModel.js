const supabase = require("../supabaseClient");

async function addCoins(userId, amount) {
  try {
    // Get current coins
    const { data: userData, error: fetchError } = await supabase
      .from("users")
      .select("coins")
      .eq("userid", userId)
      .single();

    if (fetchError) throw fetchError;

    const newCoins = (userData.coins || 0) + amount;

    // Update coins
    const { error: updateError } = await supabase
      .from("users")
      .update({ coins: newCoins })
      .eq("userid", userId);

    if (updateError) throw updateError;
  } catch (error) {
    throw error;
  }
}

async function insertCoinTransaction(userId, coins, description) {
  try {
    const { error } = await supabase.from("cointransactions").insert([
      {
        userid: userId,
        coinsearned: coins,
        description: description,
      },
    ]);

    if (error) throw error;
  } catch (error) {
    throw error;
  }
}

async function getUserCoins(userId) {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("coins")
      .eq("userid", userId)
      .single();

    if (error && error.code !== "PGRST116") throw error;

    return data ? data.coins : 0;
  } catch (error) {
    throw error;
  }
}

module.exports = { addCoins, insertCoinTransaction, getUserCoins };
