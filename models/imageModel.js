const supabase = require("../supabaseClient");

async function insertImage(menuItemId, uploaderId, imageUrl) {
  try {
    const { data, error } = await supabase
      .from("images")
      .insert([
        {
          menuitemid: menuItemId,
          uploaderid: uploaderId,
          imageurl: imageUrl,
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

async function voteImage(userId, imageId) {
  try {
    // Check if user already voted
    const { data: existingVote, error: checkError } = await supabase
      .from("imagevotes")
      .select("*")
      .eq("userid", userId)
      .eq("imageid", imageId)
      .single();

    if (checkError && checkError.code !== "PGRST116") throw checkError;

    if (existingVote) {
      throw new Error("Already voted");
    }

    // Insert the vote
    const { error: insertError } = await supabase.from("imagevotes").insert([
      {
        imageid: imageId,
        userid: userId,
      },
    ]);

    if (insertError) throw insertError;
  } catch (error) {
    throw error;
  }
}

module.exports = { insertImage, voteImage };
