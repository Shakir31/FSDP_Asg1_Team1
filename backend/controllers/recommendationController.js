const recommendationModel = require("../models/recommendationModel");

/**
 * Analyze user preferences from order history and reviews
 */
function analyzeUserPreferences(orderHistory, highRatedReviews) {
  const preferences = {
    favoriteCategories: new Map(),
    favoriteStalls: new Map(),
    priceRange: { min: Infinity, max: 0, avg: 0 },
    totalItems: 0,
  };

  // Analyze orders
  orderHistory.forEach((order) => {
    if (order.menuitems) {
      const menuItem = order.menuitems;

      // Track categories
      if (menuItem.category) {
        preferences.favoriteCategories.set(
          menuItem.category,
          (preferences.favoriteCategories.get(menuItem.category) || 0) + 1
        );
      }

      // Track stalls
      if (menuItem.stalls && menuItem.stalls.stallid) {
        preferences.favoriteStalls.set(
          menuItem.stalls.stallid,
          (preferences.favoriteStalls.get(menuItem.stalls.stallid) || 0) + 1
        );
      }

      // Track price range
      if (menuItem.price) {
        const price = parseFloat(menuItem.price);
        preferences.priceRange.min = Math.min(
          preferences.priceRange.min,
          price
        );
        preferences.priceRange.max = Math.max(
          preferences.priceRange.max,
          price
        );
        preferences.priceRange.avg += price;
        preferences.totalItems++;
      }
    }
  });

  // Analyze high-rated reviews (give these more weight)
  highRatedReviews.forEach((review) => {
    if (review.menuitems) {
      const menuItem = review.menuitems;

      // Track categories (weight = 1.5 for high ratings)
      if (menuItem.category) {
        preferences.favoriteCategories.set(
          menuItem.category,
          (preferences.favoriteCategories.get(menuItem.category) || 0) + 1.5
        );
      }

      // Track stalls (weight = 1.5)
      if (menuItem.stalls && menuItem.stalls.stallid) {
        preferences.favoriteStalls.set(
          menuItem.stalls.stallid,
          (preferences.favoriteStalls.get(menuItem.stalls.stallid) || 0) + 1.5
        );
      }

      // Track price range
      if (menuItem.price) {
        const price = parseFloat(menuItem.price);
        preferences.priceRange.min = Math.min(
          preferences.priceRange.min,
          price
        );
        preferences.priceRange.max = Math.max(
          preferences.priceRange.max,
          price
        );
        preferences.priceRange.avg += price * 1.5;
        preferences.totalItems += 1.5;
      }
    }
  });

  // Calculate average price
  if (preferences.totalItems > 0) {
    preferences.priceRange.avg =
      preferences.priceRange.avg / preferences.totalItems;
  }

  // Convert Maps to sorted arrays (most frequent first)
  preferences.favoriteCategories = Array.from(
    preferences.favoriteCategories.entries()
  )
    .sort((a, b) => b[1] - a[1])
    .map((entry) => entry[0]);

  preferences.favoriteStalls = Array.from(preferences.favoriteStalls.entries())
    .sort((a, b) => b[1] - a[1])
    .map((entry) => entry[0]);

  return preferences;
}

/**
 * Calculate recommendation score for a menu item
 * Scoring formula:
 * - Matches favorite category: +30 points
 * - Average rating: rating * 15 points
 * - From new stall (not in user's history): +20 points
 * - Similar price range: +10 points
 * - Has photos: +5 points per photo (max +15)
 */
function calculateScore(menuItem, preferences, averageRatings, photoCounts) {
  let score = 0;

  // Category match (30 points for top 3 categories)
  if (menuItem.category && preferences.favoriteCategories.length > 0) {
    const categoryIndex = preferences.favoriteCategories.indexOf(
      menuItem.category
    );
    if (categoryIndex === 0) {
      score += 30; // Top favorite category
    } else if (categoryIndex === 1) {
      score += 20; // Second favorite
    } else if (categoryIndex === 2) {
      score += 10; // Third favorite
    }
  }

  // Rating score (up to 75 points for 5-star items)
  const rating = averageRatings[menuItem.menuitemid] || 0;
  score += rating * 15;

  // New stall bonus (20 points)
  if (menuItem.stalls && menuItem.stalls.stallid) {
    const isNewStall = !preferences.favoriteStalls.includes(
      menuItem.stalls.stallid
    );
    if (isNewStall) {
      score += 20;
    }
  }

  // Price similarity (10 points if within user's typical range)
  if (menuItem.price && preferences.priceRange.avg > 0) {
    const price = parseFloat(menuItem.price);
    const priceDiff = Math.abs(price - preferences.priceRange.avg);
    const priceRange = preferences.priceRange.max - preferences.priceRange.min;

    if (priceRange > 0) {
      const similarityRatio = 1 - priceDiff / priceRange;
      score += similarityRatio * 10;
    } else if (priceDiff <= 2) {
      score += 10; // Close to average
    }
  }

  // Photo count bonus (up to 15 points)
  const photoCount = photoCounts[menuItem.menuitemid] || 0;
  score += Math.min(photoCount * 5, 15);

  return score;
}

/**
 * Generate personalized recommendations for a user
 * GET /recommendations?limit=10
 */
async function getRecommendations(req, res) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const limit = parseInt(req.query.limit) || 10;

    // Try to get cached recommendations first
    const cachedIds = await recommendationModel.getCachedRecommendations(
      userId
    );
    if (cachedIds && cachedIds.length > 0) {
      // Fetch full menu item details for cached IDs
      const { data: cachedItems, error } = await require("../supabaseClient")
        .from("menuitems")
        .select(
          `
          menuitemid,
          name,
          description,
          price,
          category,
          mainimageurl,
          stallid,
          stalls (
            stallid,
            stallname
          )
        `
        )
        .in("menuitemid", cachedIds.slice(0, limit));

      if (!error && cachedItems && cachedItems.length > 0) {
        return res.json({
          recommendations: cachedItems,
          cached: true,
        });
      }
    }

    // Generate fresh recommendations
    // Step 1: Get user's order history and high-rated reviews
    let orderHistory = [];
    let highRatedReviews = [];

    try {
      [orderHistory, highRatedReviews] = await Promise.all([
        recommendationModel.getUserOrderHistory(userId, 20),
        recommendationModel.getUserHighRatedReviews(userId),
      ]);
    } catch (historyError) {
      console.error("Error fetching user history:", historyError);
      // If we can't get history, fall back to popular items
      return getPopularRecommendations(req, res);
    }

    // If user has no history, return popular items
    if (orderHistory.length === 0 && highRatedReviews.length === 0) {
      return res.json({
        recommendations: [],
        message: "Start ordering to get personalized recommendations!",
        usePopular: true,
      });
    }

    // Step 2: Analyze user preferences
    const preferences = analyzeUserPreferences(orderHistory, highRatedReviews);

    // Step 3: Get items user has already interacted with
    let excludeIds = [];
    try {
      excludeIds = await recommendationModel.getUserInteractedMenuItems(userId);
    } catch (excludeError) {
      console.error("Error getting interacted items:", excludeError);
      // Continue without exclusions
    }

    // Step 4: Get candidate menu items from favorite categories
    const topCategories = preferences.favoriteCategories.slice(0, 5); // Top 5 categories
    if (topCategories.length === 0) {
      return res.json({
        recommendations: [],
        message: "Not enough data to generate recommendations",
        usePopular: true,
      });
    }

    // First try: Get items user hasn't tried yet
    let candidates = await recommendationModel.getMenuItemsByCategories(
      topCategories,
      excludeIds,
      50 // Get more candidates than needed for better scoring
    );

    // If no new items found, relax the restriction and include already-tried items
    // but prioritize items from different stalls
    if (candidates.length === 0) {
      console.log(
        "No new items in favorite categories, including already-tried items..."
      );
      candidates = await recommendationModel.getMenuItemsByCategories(
        topCategories,
        [], // Don't exclude anything
        50
      );

      // Still no items? Try more categories
      if (candidates.length === 0) {
        console.log("Expanding to more categories...");
        const { data: allItems, error } = await require("../supabaseClient")
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
          .limit(50);

        if (!error && allItems && allItems.length > 0) {
          // Get stalls for these items
          const stallIds = [...new Set(allItems.map((item) => item.stallid))];
          const { data: stalls } = await require("../supabaseClient")
            .from("stalls")
            .select("stallid, stallname, category")
            .in("stallid", stallIds);

          const stallMap = {};
          (stalls || []).forEach((stall) => {
            stallMap[stall.stallid] = {
              stallid: stall.stallid,
              stallname: stall.stallname,
              stall_category: stall.category,
            };
          });

          candidates = allItems.map((item) => ({
            ...item,
            stalls: stallMap[item.stallid] || null,
          }));
        }
      }
    }

    if (candidates.length === 0) {
      return res.json({
        recommendations: [],
        message: "No items available",
        usePopular: true,
      });
    }

    // Step 5: Get ratings and photo counts for candidates
    const candidateIds = candidates.map((item) => item.menuitemid);
    const [averageRatings, photoCounts] = await Promise.all([
      recommendationModel.getMenuItemRatings(candidateIds),
      recommendationModel.getMenuItemPhotoCounts(candidateIds),
    ]);

    // Step 6: Score and rank candidates
    const scoredItems = candidates.map((item) => {
      let score = calculateScore(
        item,
        preferences,
        averageRatings,
        photoCounts
      );

      // Heavy penalty for already-tried items (but don't exclude completely)
      if (excludeIds.includes(item.menuitemid)) {
        score = score * 0.3; // Reduce score by 70%
      }

      return {
        ...item,
        score: score,
        averageRating: averageRatings[item.menuitemid] || 0,
        photoCount: photoCounts[item.menuitemid] || 0,
        isNew: !excludeIds.includes(item.menuitemid),
      };
    });

    // Sort by score (highest first)
    scoredItems.sort((a, b) => b.score - a.score);

    // Get top N recommendations
    const recommendations = scoredItems.slice(0, limit);

    // Cache the recommendation IDs
    try {
      const recommendationIds = scoredItems
        .slice(0, 20)
        .map((item) => item.menuitemid);
      await recommendationModel.saveCachedRecommendations(
        userId,
        recommendationIds
      );
    } catch (cacheError) {
      console.error("Error caching recommendations:", cacheError);
      // Don't fail if caching fails
    }

    res.json({
      recommendations,
      cached: false,
      preferences: {
        topCategories: preferences.favoriteCategories.slice(0, 3),
        avgPrice: preferences.priceRange.avg.toFixed(2),
      },
    });
  } catch (error) {
    console.error("getRecommendations error:", error);
    // Fall back to popular items on any error
    return getPopularRecommendations(req, res);
  }
}

/**
 * Get popular/trending items (fallback for users with no history)
 * GET /recommendations/popular?limit=10
 */
async function getPopularRecommendations(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const supabase = require("../supabaseClient");

    // Get all reviews with ratings
    const { data: reviews, error: reviewError } = await supabase
      .from("reviews")
      .select("menuitemid, rating");

    if (reviewError) throw reviewError;

    // Calculate average ratings and review counts
    const itemStats = {};
    (reviews || []).forEach((review) => {
      if (!itemStats[review.menuitemid]) {
        itemStats[review.menuitemid] = { sum: 0, count: 0 };
      }
      itemStats[review.menuitemid].sum += review.rating;
      itemStats[review.menuitemid].count += 1;
    });

    // Score items (avg rating * review count)
    const scoredItems = Object.entries(itemStats).map(
      ([menuitemid, stats]) => ({
        menuitemid: parseInt(menuitemid),
        avgRating: stats.sum / stats.count,
        reviewCount: stats.count,
        score: (stats.sum / stats.count) * Math.log(stats.count + 1), // Logarithmic scaling
      })
    );

    // Sort by score
    scoredItems.sort((a, b) => b.score - a.score);

    // Get top items
    const topItemIds = scoredItems
      .slice(0, limit * 2)
      .map((item) => item.menuitemid);

    if (topItemIds.length === 0) {
      // No reviews exist, just return some menu items
      const { data: fallbackItems, error: fallbackError } = await supabase
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
        .limit(limit);

      if (fallbackError) throw fallbackError;

      return res.json({
        recommendations: fallbackItems || [],
        type: "popular",
      });
    }

    // Fetch full menu item details
    const { data: menuItems, error: menuError } = await supabase
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
      .in("menuitemid", topItemIds)
      .limit(limit);

    if (menuError) throw menuError;

    // Get stall details
    const stallIds = [
      ...new Set((menuItems || []).map((item) => item.stallid)),
    ];
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

    // Combine data
    const result = (menuItems || []).map((item) => ({
      ...item,
      stalls: stallMap[item.stallid] || null,
    }));

    res.json({
      recommendations: result,
      type: "popular",
    });
  } catch (error) {
    console.error("getPopularRecommendations error:", error);
    res.status(500).json({ error: "Failed to get popular items" });
  }
}

/**
 * Clear user's cached recommendations
 * POST /recommendations/refresh
 */
async function refreshRecommendations(req, res) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    await recommendationModel.clearCachedRecommendations(userId);

    res.json({ message: "Recommendations cache cleared" });
  } catch (error) {
    console.error("refreshRecommendations error:", error);
    res.status(500).json({ error: "Failed to refresh recommendations" });
  }
}

module.exports = {
  getRecommendations,
  getPopularRecommendations,
  refreshRecommendations,
};
