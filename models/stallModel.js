const supabase = require("../supabaseClient");

async function createStall(stallName, description, hawker_centre, category) {
  try {
    const { data, error } = await supabase
      .from("stalls")
      .insert([
        {
          stallname: stallName,
          description: description,
          hawker_centre: hawker_centre,
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

async function getAllStalls() {
  try {
    const { data, error } = await supabase.from("stalls").select("*");

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

async function createMenuItem(
  stallId,
  name,
  description,
  price,
  url,
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
          mainimageurl: url,
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

async function getMenuByStall(stallId) {
  try {
    const { data, error } = await supabase
      .from("menuitems")
      .select("*")
      .eq("stallid", stallId);

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

async function updateMenuItemPhoto(menuItemId, imageUrl) {
  try {
    const { error } = await supabase
      .from("menuitems")
      .update({ mainimageurl: imageUrl })
      .eq("menuitemid", menuItemId);

    if (error) throw error;
  } catch (error) {
    throw error;
  }
}

async function getStallsByCategory(category) {
  try {
    const { data, error } = await supabase
      .from("stalls")
      .select("*")
      .eq("category", category);

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

async function getStallsByHawkerCentre(hawkerCentre) {
  try {
    const { data, error } = await supabase
      .from("stalls")
      .select("*")
      .eq("hawker_centre", hawkerCentre);

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

async function getStallById(stallId) {
  try {
    const { data, error } = await supabase
      .from("stalls")
      .select("*")
      .eq("stallid", stallId)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

async function getMenuItemById(menuItemId) {
  try {
    const { data, error } = await supabase
      .from("menuitems")
      .select("*")
      .eq("menuitemid", menuItemId)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

async function getImagesByStall(stallId, currentUserId = null) {
  try {
    // First, get images with user info and menu item name
    const { data: images, error } = await supabase
      .from("images")
      .select(
        `
        imageid,
        imageurl,
        uploadedat,
        uploaderid,
        menuitems!inner (
          name,
          stallid
        )
      `
      )
      .eq("menuitems.stallid", stallId)
      .order("uploadedat", { ascending: false });

    if (error) throw error;

    // For each image, fetch additional data
    const enrichedData = await Promise.all(
      images.map(async (img) => {
        // Get uploader username
        const { data: user } = await supabase
          .from("users")
          .select("name, email")
          .eq("userid", img.uploaderid)
          .maybeSingle();

        // Get review text AND rating for this image
        const { data: review } = await supabase
          .from("reviews")
          .select("reviewtext, rating")
          .eq("imageid", img.imageid)
          .maybeSingle();

        // Get upvote count
        const { count: upvoteCount } = await supabase
          .from("imagevotes")
          .select("*", { count: "exact", head: true })
          .eq("imageid", img.imageid);

        // Check if current user has upvoted (if userId provided)
        let userHasUpvoted = false;
        if (currentUserId) {
          const { data: userVote } = await supabase
            .from("imagevotes")
            .select("voteid")
            .eq("imageid", img.imageid)
            .eq("userid", currentUserId)
            .maybeSingle();
          userHasUpvoted = !!userVote;
        }

        return {
          imageid: img.imageid,
          imageurl: img.imageurl,
          uploadedat: img.uploadedat,
          menuitemname: img.menuitems.name,
          username: user?.name || user?.email?.split("@")[0] || "Anonymous",
          reviewtext: review?.reviewtext || null,
          rating: review?.rating || null,
          upvote_count: upvoteCount || 0,
          user_has_upvoted: userHasUpvoted,
        };
      })
    );

    return enrichedData;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  createStall,
  getAllStalls,
  createMenuItem,
  getMenuByStall,
  updateMenuItemPhoto,
  getStallsByCategory,
  getStallsByHawkerCentre,
  getStallById,
  getMenuItemById,
  getImagesByStall,
};
