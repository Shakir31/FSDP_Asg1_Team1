const supabase = require("../supabaseClient");

async function getAllVouchers() {
  try {
    const { data, error } = await supabase
      .from("vouchers")
      .select(
        "voucherid, name, description, coincost, quantityavailable, expirydate"
      )
      .gt("quantityavailable", 0)
      .gt("expirydate", new Date().toISOString());

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

async function redeemVoucher(userId, voucherId) {
  try {
    // Step 1: Get voucher details
    const { data: voucher, error: voucherError } = await supabase
      .from("vouchers")
      .select("*")
      .eq("voucherid", voucherId)
      .gt("quantityavailable", 0)
      .gt("expirydate", new Date().toISOString())
      .single();

    if (voucherError || !voucher) {
      throw new Error("Voucher not available");
    }

    // Step 2: Check user coins
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("coins")
      .eq("userid", userId)
      .single();

    if (userError || !user) {
      throw new Error("User not found");
    }

    if (user.coins < voucher.coincost) {
      throw new Error("Insufficient coins");
    }

    // Step 3: Deduct voucher quantity
    const { error: updateVoucherError } = await supabase
      .from("vouchers")
      .update({ quantityavailable: voucher.quantityavailable - 1 })
      .eq("voucherid", voucherId);

    if (updateVoucherError) throw updateVoucherError;

    // Step 4: Deduct user coins
    const { error: updateCoinsError } = await supabase
      .from("users")
      .update({ coins: user.coins - voucher.coincost })
      .eq("userid", userId);

    if (updateCoinsError) throw updateCoinsError;

    // Step 5: Insert user voucher record
    const { error: insertError } = await supabase.from("uservouchers").insert([
      {
        userid: userId,
        voucherid: voucherId,
      },
    ]);

    if (insertError) throw insertError;

    return { message: "Voucher redeemed successfully" };
  } catch (error) {
    throw error;
  }
}

async function getUserRedeemedVouchers(userId) {
  try {
    const { data, error } = await supabase
      .from("uservouchers")
      .select(
        `
        uservoucherid,
        redeemedat,
        vouchers (
          name,
          description,
          coincost,
          expirydate
        )
      `
      )
      .eq("userid", userId)
      .order("redeemedat", { ascending: false });

    if (error) throw error;

    // Reshape the data to match your original format
    const formattedData = data.map((uv) => ({
      uservoucherid: uv.uservoucherid,
      name: uv.vouchers.name,
      description: uv.vouchers.description,
      coincost: uv.vouchers.coincost,
      expirydate: uv.vouchers.expirydate,
      redeemedat: uv.redeemedat,
    }));

    return formattedData;
  } catch (error) {
    throw error;
  }
}

module.exports = { getAllVouchers, redeemVoucher, getUserRedeemedVouchers };
