const supabase = require("../supabaseClient");

async function createStall({
  stallname,
  description,
  hawker_centre_id,
  category,
  stall_image,
  owner_id,
}) {
  try {
    const insertData = {
      stallname,
      category,
    };

    // Add optional fields if provided
    if (
      description !== undefined &&
      description !== null &&
      description !== ""
    ) {
      insertData.description = description;
    }
    if (
      hawker_centre_id !== undefined &&
      hawker_centre_id !== null &&
      hawker_centre_id !== ""
    ) {
      insertData.hawker_centre_id = hawker_centre_id;
    }
    if (
      stall_image !== undefined &&
      stall_image !== null &&
      stall_image !== ""
    ) {
      insertData.stall_image = stall_image;
    }
    if (owner_id !== undefined && owner_id !== null && owner_id !== "") {
      insertData.owner_id = parseInt(owner_id, 10);
    }

    const { data, error } = await supabase
      .from("stalls")
      .insert([insertData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("DB createStall error:", error);
    throw error;
  }
}

async function getAllStalls() {
  try {
    const { data, error } = await supabase.from("stalls").select("*");

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("DB getAllStalls error:", error);
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
    console.error("DB createMenuItem error:", error);
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
    console.error("DB getMenuByStall error:", error);
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
    console.error("DB updateMenuItemPhoto error:", error);
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
    console.error("DB getStallsByCategory error:", error);
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
    console.error("DB getStallsByHawkerCentre error:", error);
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
    console.error("DB getStallById error:", error);
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
    console.error("DB getMenuItemById error:", error);
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
    console.error("DB getImagesByStall error:", error);
    throw error;
  }
}

async function updateStallById(
  id,
  { stallname, description, category, stall_image, hawker_centre_id, owner_id }
) {
  try {
    const updateData = {};

    // Only include fields that are provided
    if (stallname !== undefined && stallname !== null)
      updateData.stallname = stallname;
    if (description !== undefined) updateData.description = description; // Allow null for clearing
    if (category !== undefined && category !== null)
      updateData.category = category;
    if (stall_image !== undefined) updateData.stall_image = stall_image; // Allow null for clearing
    if (hawker_centre_id !== undefined)
      updateData.hawker_centre_id = hawker_centre_id; // Allow null
    if (owner_id !== undefined) updateData.owner_id = owner_id; // Allow null for unassigning

    // Return early if no fields to update
    if (Object.keys(updateData).length === 0) {
      throw new Error("No fields to update");
    }

    const { data, error } = await supabase
      .from("stalls")
      .update(updateData)
      .eq("stallid", id)
      .select("*")
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("DB updateStallById error:", error);
    throw error;
  }
}

async function deleteStallById(id) {
  try {
    const { error } = await supabase.from("stalls").delete().eq("stallid", id);

    if (error) throw error;
    return { deleted: true };
  } catch (error) {
    console.error("DB deleteStallById error:", error);
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
  updateStallById,
  deleteStallById,
};
