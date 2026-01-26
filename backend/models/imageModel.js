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

async function updateImageUrl(imageId, newImageUrl) {
  try {
    const { data, error } = await supabase
      .from("images")
      .update({ imageurl: newImageUrl })
      .eq("imageid", imageId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("DB updateImageUrl error:", error);
    throw error;
  }
}

async function voteImage(userId, imageId) {
  try {
    // Check if user already voted
    const { data: existingVote, error: checkError } = await supabase
      .from("imagevotes")
      .select("voteid")
      .eq("userid", userId)
      .eq("imageid", imageId)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existingVote) {
      // User has already upvoted - remove the upvote (toggle off)
      const { error: deleteError } = await supabase
        .from("imagevotes")
        .delete()
        .eq("voteid", existingVote.voteid);

      if (deleteError) throw deleteError;

      return { upvoted: false, message: "Upvote removed" };
    } else {
      // User hasn't upvoted yet - add the upvote (toggle on)
      const { error: insertError } = await supabase.from("imagevotes").insert([
        {
          imageid: imageId,
          userid: userId,
        },
      ]);

      if (insertError) throw insertError;

      return { upvoted: true, message: "Image upvoted" };
    }
  } catch (error) {
    throw error;
  }
}

async function getReviewIdFromImageId(imageId) {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .select("reviewid")
      .eq("imageid", imageId)
      .single();

    if (error) throw error;
    return data.reviewid;
  } catch (error) {
    console.error("DB getReviewIdFromImageId error:", error);
    throw error;
  }
}

module.exports = {
  insertImage,
  updateImageUrl,
  voteImage,
  getReviewIdFromImageId,
};
