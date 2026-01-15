const supabase = require("../supabaseClient");

/**
 * Get user's order history with menu item details
 */
async function getUserOrderHistory(userId, limit = 20) {
  try {
    // First, get user's recent orders
    const { data: userOrders, error: ordersError } = await supabase
      .from("orders")
      .select("orderid")
      .eq("userid", userId)
      .order("orderdate", { ascending: false })
      .limit(limit);

    if (ordersError) throw ordersError;

    if (!userOrders || userOrders.length === 0) {
      return [];
    }

    // Get order IDs
    const orderIds = userOrders.map((order) => order.orderid);

    // Get order items with menu item details
    const { data: orderItems, error: itemsError } = await supabase
      .from("orderitems")
      .select(
        `
        menuitemid,
        orderid
      `
      )
      .in("orderid", orderIds);

    if (itemsError) throw itemsError;

    if (!orderItems || orderItems.length === 0) {
      return [];
    }

    // Get unique menu item IDs
    const menuItemIds = [...new Set(orderItems.map((item) => item.menuitemid))];

    // Get menu item details with stall info
    const { data: menuItems, error: menuError } = await supabase
      .from("menuitems")
      .select(
        `
        menuitemid,
        name,
        category,
        price,
        stallid
      `
      )
      .in("menuitemid", menuItemIds);

    if (menuError) throw menuError;

    // Get stall details
    const stallIds = [...new Set(menuItems.map((item) => item.stallid))];
    const { data: stalls, error: stallsError } = await supabase
      .from("stalls")
      .select(
        `
        stallid,
        stallname
      `
      )
      .in("stallid", stallIds);

    if (stallsError) throw stallsError;

    // Create stall lookup map
    const stallMap = {};
    (stalls || []).forEach((stall) => {
      stallMap[stall.stallid] = stall;
    });

    // Combine data - format to match expected structure
    const result = orderItems
      .map((orderItem) => {
        const menuItem = menuItems.find(
          (m) => m.menuitemid === orderItem.menuitemid
        );
        if (!menuItem) return null;

        return {
          menuitemid: menuItem.menuitemid,
          menuitems: {
            menuitemid: menuItem.menuitemid,
            name: menuItem.name,
            category: menuItem.category,
            price: menuItem.price,
            stallid: menuItem.stallid,
            stalls: stallMap[menuItem.stallid] || null,
          },
        };
      })
      .filter((item) => item !== null);

    return result;
  } catch (error) {
    console.error("getUserOrderHistory error:", error);
    throw error;
  }
}

/**
 * Get user's high-rated reviews (4-5 stars)
 */
async function getUserHighRatedReviews(userId) {
  try {
    // Get high-rated reviews
    const { data: reviews, error: reviewsError } = await supabase
      .from("reviews")
      .select(
        `
        reviewid,
        menuitemid,
        rating
      `
      )
      .eq("userid", userId)
      .gte("rating", 4)
      .order("createdat", { ascending: false });

    if (reviewsError) throw reviewsError;

    if (!reviews || reviews.length === 0) {
      return [];
    }

    // Get menu item IDs
    const menuItemIds = reviews.map((r) => r.menuitemid);

    // Get menu item details
    const { data: menuItems, error: menuError } = await supabase
      .from("menuitems")
      .select(
        `
        menuitemid,
        name,
        category,
        price,
        stallid
      `
      )
      .in("menuitemid", menuItemIds);

    if (menuError) throw menuError;

    // Get stall details
    const stallIds = [...new Set(menuItems.map((item) => item.stallid))];
    const { data: stalls, error: stallsError } = await supabase
      .from("stalls")
      .select(
        `
        stallid,
        stallname
      `
      )
      .in("stallid", stallIds);

    if (stallsError) throw stallsError;

    // Create lookup maps
    const stallMap = {};
    (stalls || []).forEach((stall) => {
      stallMap[stall.stallid] = stall;
    });

    const menuItemMap = {};
    (menuItems || []).forEach((item) => {
      menuItemMap[item.menuitemid] = {
        ...item,
        stalls: stallMap[item.stallid] || null,
      };
    });

    // Combine data - format to match expected structure
    const result = reviews
      .map((review) => ({
        reviewid: review.reviewid,
        menuitemid: review.menuitemid,
        rating: review.rating,
        menuitems: menuItemMap[review.menuitemid] || null,
      }))
      .filter((item) => item.menuitems !== null);

    return result;
  } catch (error) {
    console.error("getUserHighRatedReviews error:", error);
    throw error;
  }
}

/**
 * Get all menu items user has already interacted with (ordered or reviewed)
 */
async function getUserInteractedMenuItems(userId) {
  try {
    // Get user's order IDs first
    const { data: userOrders, error: ordersError } = await supabase
      .from("orders")
      .select("orderid")
      .eq("userid", userId);

    if (ordersError) throw ordersError;

    let orderedIds = new Set();

    if (userOrders && userOrders.length > 0) {
      const orderIds = userOrders.map((order) => order.orderid);

      // Get ordered items
      const { data: orderedItems, error: orderItemsError } = await supabase
        .from("orderitems")
        .select("menuitemid")
        .in("orderid", orderIds);

      if (orderItemsError) throw orderItemsError;
      orderedIds = new Set((orderedItems || []).map((item) => item.menuitemid));
    }

    // Get reviewed items
    const { data: reviewedItems, error: reviewError } = await supabase
      .from("reviews")
      .select("menuitemid")
      .eq("userid", userId);

    if (reviewError) throw reviewError;

    // Combine and deduplicate
    const reviewedIds = new Set(
      (reviewedItems || []).map((item) => item.menuitemid)
    );

    return [...new Set([...orderedIds, ...reviewedIds])];
  } catch (error) {
    console.error("getUserInteractedMenuItems error:", error);
    throw error;
  }
}

/**
 * Get menu items by categories with optional filters
 */
async function getMenuItemsByCategories(
  categories,
  excludeIds = [],
  limit = 50
) {
  try {
    let query = supabase
      .from("menuitems")
      .select(
        `
        menuitemid,
        name,
        description,
        price,
        category,
        mainimageurl,
        stallid
      `
      )
      .in("category", categories);

    // Exclude already interacted items
    if (excludeIds.length > 0) {
      query = query.not("menuitemid", "in", `(${excludeIds.join(",")})`);
    }

    query = query.limit(limit);

    const { data: menuItems, error: menuError } = await query;

    if (menuError) throw menuError;

    if (!menuItems || menuItems.length === 0) {
      return [];
    }

    // Get stall details
    const stallIds = [...new Set(menuItems.map((item) => item.stallid))];
    const { data: stalls, error: stallsError } = await supabase
      .from("stalls")
      .select(
        `
        stallid,
        stallname,
        category
      `
      )
      .in("stallid", stallIds);

    if (stallsError) throw stallsError;

    // Create stall lookup map
    const stallMap = {};
    (stalls || []).forEach((stall) => {
      stallMap[stall.stallid] = {
        stallid: stall.stallid,
        stallname: stall.stallname,
        stall_category: stall.category,
      };
    });

    // Combine data
    const result = menuItems.map((item) => ({
      ...item,
      stalls: stallMap[item.stallid] || null,
    }));

    return result;
  } catch (error) {
    console.error("getMenuItemsByCategories error:", error);
    throw error;
  }
}

/**
 * Get average rating for menu items
 */
async function getMenuItemRatings(menuItemIds) {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .select("menuitemid, rating")
      .in("menuitemid", menuItemIds);

    if (error) throw error;

    // Calculate average ratings
    const ratingMap = {};
    (data || []).forEach((review) => {
      if (!ratingMap[review.menuitemid]) {
        ratingMap[review.menuitemid] = { sum: 0, count: 0 };
      }
      ratingMap[review.menuitemid].sum += review.rating;
      ratingMap[review.menuitemid].count += 1;
    });

    // Convert to average
    const averages = {};
    Object.keys(ratingMap).forEach((menuItemId) => {
      averages[menuItemId] =
        ratingMap[menuItemId].sum / ratingMap[menuItemId].count;
    });

    return averages;
  } catch (error) {
    console.error("getMenuItemRatings error:", error);
    throw error;
  }
}

/**
 * Get photo count for menu items
 */
async function getMenuItemPhotoCounts(menuItemIds) {
  try {
    const { data, error } = await supabase
      .from("images")
      .select("menuitemid")
      .in("menuitemid", menuItemIds);

    if (error) throw error;

    // Count photos per menu item
    const photoCounts = {};
    (data || []).forEach((image) => {
      photoCounts[image.menuitemid] = (photoCounts[image.menuitemid] || 0) + 1;
    });

    return photoCounts;
  } catch (error) {
    console.error("getMenuItemPhotoCounts error:", error);
    throw error;
  }
}

/**
 * Get cached recommendations for user
 */
async function getCachedRecommendations(userId) {
  try {
    const { data, error } = await supabase
      .from("userrecommendations")
      .select("*")
      .eq("userid", userId)
      .single();

    if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows found

    // Check if cache is still valid (24 hours)
    if (data && data.expiryat && new Date(data.expiryat) > new Date()) {
      return data.recommendedmenuitemids;
    }

    return null;
  } catch (error) {
    console.error("getCachedRecommendations error:", error);
    return null;
  }
}

/**
 * Save recommendations to cache
 */
async function saveCachedRecommendations(userId, menuItemIds) {
  try {
    const expiryAt = new Date();
    expiryAt.setHours(expiryAt.getHours() + 24); // 24 hour expiry

    const { data, error } = await supabase.from("userrecommendations").upsert(
      {
        userid: userId,
        recommendedmenuitemids: menuItemIds,
        generatedat: new Date().toISOString(),
        expiryat: expiryAt.toISOString(),
      },
      {
        onConflict: "userid",
      }
    );

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("saveCachedRecommendations error:", error);
    // Don't throw - caching is optional
    return null;
  }
}

/**
 * Clear cached recommendations for user (call after new order/review)
 */
async function clearCachedRecommendations(userId) {
  try {
    const { error } = await supabase
      .from("userrecommendations")
      .delete()
      .eq("userid", userId);

    if (error) throw error;
  } catch (error) {
    console.error("clearCachedRecommendations error:", error);
    // Don't throw - this is a nice-to-have
  }
}

module.exports = {
  getUserOrderHistory,
  getUserHighRatedReviews,
  getUserInteractedMenuItems,
  getMenuItemsByCategories,
  getMenuItemRatings,
  getMenuItemPhotoCounts,
  getCachedRecommendations,
  saveCachedRecommendations,
  clearCachedRecommendations,
};
