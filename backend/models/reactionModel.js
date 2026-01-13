const supabase = require("../supabaseClient");

// Toggle reaction (add if doesn't exist, remove if exists)
async function toggleReaction(reviewId, userId, emoji) {
  try {
    // Check if reaction already exists
    const { data: existing, error: checkError } = await supabase
      .from("reviewreactions")
      .select("*")
      .eq("reviewid", reviewId)
      .eq("userid", userId)
      .eq("emoji", emoji)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      throw checkError;
    }

    if (existing) {
      // Reaction exists, remove it
      const { error: deleteError } = await supabase
        .from("reviewreactions")
        .delete()
        .eq("reactionid", existing.reactionid);

      if (deleteError) throw deleteError;
      return { action: "removed", emoji };
    } else {
      // Reaction doesn't exist, add it
      const { data, error: insertError } = await supabase
        .from("reviewreactions")
        .insert({
          reviewid: reviewId,
          userid: userId,
          emoji: emoji,
        })
        .select();

      if (insertError) throw insertError;
      return { action: "added", emoji, data: data[0] };
    }
  } catch (error) {
    console.error("Error toggling reaction:", error);
    throw error;
  }
}

// Get all reactions for a review with counts
async function getReviewReactions(reviewId, userId = null) {
  try {
    // Get all reactions for this review
    const { data, error } = await supabase
      .from("reviewreactions")
      .select("emoji, userid")
      .eq("reviewid", reviewId);

    if (error) throw error;

    // Count reactions by emoji
    const reactionCounts = {};
    const userReactions = [];

    data.forEach((reaction) => {
      // Count this emoji
      reactionCounts[reaction.emoji] =
        (reactionCounts[reaction.emoji] || 0) + 1;

      // Track if current user reacted with this emoji
      if (userId && reaction.userid === userId) {
        userReactions.push(reaction.emoji);
      }
    });

    return {
      reactions: reactionCounts,
      userReactions: userReactions,
    };
  } catch (error) {
    console.error("Error getting review reactions:", error);
    throw error;
  }
}

module.exports = {
  toggleReaction,
  getReviewReactions,
};
