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

async function getReviewsByMenuItem(menuItemId) {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .select(
        `
        *,
        images (
          imageurl
        )
      `
      )
      .eq("menuitemid", menuItemId)
      .order("createdat", { ascending: false });

    if (error) throw error;

    // Reshape to include imageurl at top level
    const formattedData = data.map((review) => ({
      ...review,
      imageurl: review.images?.imageurl || null,
      images: undefined, // Remove nested object
    }));

    return formattedData;
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
