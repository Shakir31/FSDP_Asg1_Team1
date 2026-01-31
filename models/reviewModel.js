const supabase = require("../supabaseClient");

async function createReview(menuItemId, userId, rating, reviewText, imageId) {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .insert([
        {
          menuitemid: menuItemId,
          userid: userId,
          rating: rating,
          reviewtext: reviewText,
          imageid: imageId,
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

async function getReviewsByMenuItem(menuItemId, currentUserId = null) {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .select(
        `
        reviewid,
        menuitemid,
        userid,
        rating,
        reviewtext,
        imageid,
        createdat,
        images (
          imageurl,
          uploadedat
        ),
        menuitems (
          name
        )
      `
      )
      .eq("menuitemid", menuItemId)
      .order("createdat", { ascending: false });

    if (error) throw error;

    // For each review, fetch additional data needed for SocialPostCard
    const enrichedData = await Promise.all(
      data.map(async (review) => {
        // Get username from userid
        const { data: user } = await supabase
          .from("users")
          .select("name, email")
          .eq("userid", review.userid)
          .maybeSingle();

        // Get upvote count for the image
        let upvoteCount = 0;
        let userHasUpvoted = false;

        if (review.imageid) {
          const { count } = await supabase
            .from("imagevotes")
            .select("*", { count: "exact", head: true })
            .eq("imageid", review.imageid);

          upvoteCount = count || 0;

          // Check if current user has upvoted
          if (currentUserId) {
            const { data: userVote } = await supabase
              .from("imagevotes")
              .select("voteid")
              .eq("imageid", review.imageid)
              .eq("userid", currentUserId)
              .maybeSingle();
            userHasUpvoted = !!userVote;
          }
        }

        return {
          reviewid: review.reviewid,
          imageid: review.imageid,
          imageurl: review.images?.imageurl || null,
          username: user?.name || user?.email?.split("@")[0] || "Anonymous",
          uploadedat: review.images?.uploadedat || review.createdat,
          menuitemname: review.menuitems?.name || "Unknown Item",
          reviewtext: review.reviewtext,
          rating: review.rating,
          upvote_count: upvoteCount,
          user_has_upvoted: userHasUpvoted,
        };
      })
    );

    return enrichedData;
  } catch (error) {
    throw error;
  }
}

async function getReviewsByStall(stallId) {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .select(
        `
        *,
        menuitems!inner (
          stallid
        ),
        images (
          imageurl
        )
      `
      )
      .eq("menuitems.stallid", stallId)
      .order("createdat", { ascending: false });

    if (error) throw error;

    // Reshape to include imageurl at top level
    const formattedData = data.map((review) => ({
      ...review,
      imageurl: review.images?.imageurl || null,
      menuitems: undefined, // Remove nested object
      images: undefined, // Remove nested object
    }));

    return formattedData;
  } catch (error) {
    throw error;
  }
}

async function getReviewsByUser(userId) {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .select(
        `
        reviewid,
        rating,
        reviewtext,
        createdat,
        menuitems (
          name
        ),
        images (
          imageurl
        )
      `
      )
      .eq("userid", userId)
      .order("createdat", { ascending: false });

    if (error) throw error;

    // Reshape to match your original format
    const formattedData = data.map((review) => ({
      reviewid: review.reviewid,
      rating: review.rating,
      reviewtext: review.reviewtext,
      createdat: review.createdat,
      menuitemname: review.menuitems?.name || null,
      imageurl: review.images?.imageurl || null,
    }));

    return formattedData;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  createReview,
  getReviewsByMenuItem,
  getReviewsByStall,
  getReviewsByUser,
};
