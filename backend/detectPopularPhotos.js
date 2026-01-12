// Photo suggestion detection cron job
// Run this daily: node detectPopularPhotos.js
// Or set up with node-cron, pm2-cron, or your hosting platform's scheduler

require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing environment variables!");
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Configuration
const CONFIG = {
  MIN_VOTES: 3, // Minimum votes a photo must have
  RELATIVE_THRESHOLD: 2.0, // Photo must have 2x more votes than 2nd place
  MAX_NOTIFICATIONS_PER_RUN: 100, // Prevent spam
};

async function detectPopularPhotos() {
  console.log("🔍 Starting photo detection job...");
  console.log(
    `⚙️  Config: MIN_VOTES=${CONFIG.MIN_VOTES}, THRESHOLD=${CONFIG.RELATIVE_THRESHOLD}x\n`
  );

  try {
    // Step 1: Get all menu items with their current image and stall owner
    console.log("📋 Step 1: Fetching menu items with owner info...");
    const { data: menuItems, error: menuError } = await supabase.from(
      "menuitems"
    ).select(`
        menuitemid,
        stallid,
        name,
        mainimageurl,
        stalls!inner(owner_id)
      `);

    if (menuError) throw menuError;
    console.log(`✅ Found ${menuItems.length} menu items\n`);

    let suggestionsCreated = 0;
    let itemsProcessed = 0;

    // Step 2: Process each menu item
    for (const item of menuItems) {
      if (!item.stalls?.owner_id) {
        // Skip items without stall owners
        continue;
      }

      itemsProcessed++;

      // Get all photos for this menu item with vote counts
      const { data: photos, error: photosError } = await supabase
        .from("images")
        .select(
          `
          imageid,
          imageurl,
          imagevotes(voteid)
        `
        )
        .eq("menuitemid", item.menuitemid);

      if (photosError || !photos || photos.length === 0) continue;

      // Calculate vote counts
      const photosWithVotes = photos
        .map((photo) => ({
          imageid: photo.imageid,
          imageurl: photo.imageurl,
          voteCount: photo.imagevotes?.length || 0,
        }))
        .filter((p) => p.voteCount >= CONFIG.MIN_VOTES);

      if (photosWithVotes.length === 0) continue;

      // Sort by votes descending
      photosWithVotes.sort((a, b) => b.voteCount - a.voteCount);

      const topPhoto = photosWithVotes[0];
      const secondPhoto = photosWithVotes[1];

      // Check if top photo should be suggested
      const meetsThreshold =
        !secondPhoto ||
        topPhoto.voteCount >= secondPhoto.voteCount * CONFIG.RELATIVE_THRESHOLD;

      // Don't suggest if it's already the main image
      const isAlreadyMainImage = item.mainimageurl === topPhoto.imageurl;

      if (meetsThreshold && !isAlreadyMainImage) {
        // Check if notification already exists
        const { data: existingNotif, error: checkError } = await supabase
          .from("notifications")
          .select("notificationid")
          .eq("menuitemid", item.menuitemid)
          .eq("suggestedimageid", topPhoto.imageid)
          .eq("status", "pending")
          .single();

        if (checkError && checkError.code !== "PGRST116") {
          // PGRST116 = no rows returned (which is fine)
          console.error(
            `⚠️  Error checking notification for menu item ${item.menuitemid}:`,
            checkError.message
          );
          continue;
        }

        if (existingNotif) {
          // Notification already exists, skip
          continue;
        }

        // Create notification
        const { error: notifError } = await supabase
          .from("notifications")
          .insert({
            userid: item.stalls.owner_id,
            stallid: item.stallid,
            menuitemid: item.menuitemid,
            suggestedimageid: topPhoto.imageid,
            type: "photo_suggestion",
            suggested_image_votes: topPhoto.voteCount,
            current_image_url: item.mainimageurl,
            status: "pending",
          });

        if (notifError) {
          console.error(
            `⚠️  Failed to create notification for menu item ${item.menuitemid}:`,
            notifError.message
          );
          continue;
        }

        suggestionsCreated++;
        console.log(
          `✨ Created suggestion for "${item.name}" (${topPhoto.voteCount} votes)`
        );

        if (suggestionsCreated >= CONFIG.MAX_NOTIFICATIONS_PER_RUN) {
          console.log(
            `\n⚠️  Reached max notifications limit (${CONFIG.MAX_NOTIFICATIONS_PER_RUN}), stopping...\n`
          );
          break;
        }
      }
    }

    // Summary
    console.log("\n📊 DETECTION COMPLETE!\n");
    console.log("Summary:");
    console.log(`- Menu items processed: ${itemsProcessed}`);
    console.log(`- New suggestions created: ${suggestionsCreated}`);
    console.log(`- Timestamp: ${new Date().toISOString()}\n`);

    // Get total pending notifications
    const { count: pendingCount } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    console.log(
      `📬 Total pending notifications across all owners: ${pendingCount || 0}\n`
    );
  } catch (error) {
    console.error("❌ Fatal error:", error.message);
    process.exit(1);
  }
}

// Run the detection
detectPopularPhotos();
