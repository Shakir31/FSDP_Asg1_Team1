// backend/scripts/generate-embeddings.js
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const supabase = require("../supabaseClient");

const BATCH_SIZE = 50; // Process 50 items at a time

async function backfillVectors() {
  console.log("🚀 Starting Persistent Vector Backfill...");
  
  if (!process.env.SUPABASE_URL) {
    console.error("❌ ERROR: SUPABASE_URL is missing. Check your .env file.");
    process.exit(1);
  }

  let totalProcessed = 0;

  // LOOP UNTIL DONE
  while (true) {
    // 1. Fetch the next batch of items that still have NULL embeddings
    const { data: items, error } = await supabase
      .from("menuitems")
      .select("menuitemid, name, mainimageurl")
      .is("embedding", null)
      .limit(BATCH_SIZE); // Only get 50 at a time

    if (error) {
      console.error("❌ Database Error:", error);
      break;
    }

    // 2. If no items are left, we are finished!
    if (!items || items.length === 0) {
      console.log("✅ All items have been processed! No more null embeddings found.");
      break;
    }

    console.log(`\n📦 Processing Batch of ${items.length} items...`);

    // 3. Process this batch
    for (const item of items) {
      if (!item.mainimageurl) {
        console.log(`   ⚠️ Skipping ${item.name} (No Image URL)`);
        continue;
      }

      try {
        // Call AI Service
        const aiResponse = await fetch("http://localhost:5000/embed-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: item.mainimageurl }),
        });

        if (!aiResponse.ok) {
          console.error(`   ❌ AI Error for ${item.name}: ${await aiResponse.text()}`);
          continue;
        }

        const { embedding } = await aiResponse.json();

        // Save to DB
        const { error: updateError } = await supabase
          .from("menuitems")
          .update({ embedding: embedding })
          .eq("menuitemid", item.menuitemid);

        if (updateError) {
          console.error(`   ❌ DB Save Error for ${item.name}:`, updateError);
        } else {
          console.log(`   ✨ Done: ${item.name}`);
          totalProcessed++;
        }

      } catch (err) {
        console.error(`   💥 Crash on ${item.name}:`, err.message);
      }
    }
    
    console.log(`💤 Batch complete. Waiting 1 second to cool down...`);
    await new Promise(r => setTimeout(r, 1000)); // Cool down pause
  }

  console.log(`\n🎉 GRAND TOTAL PROCESSED: ${totalProcessed}`);
}

backfillVectors();