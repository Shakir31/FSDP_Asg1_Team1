const supabase = require("../supabaseClient");

async function cleanupOldSessions() {
  try {
    // Close sessions active for more than 24 hours
    const { error } = await supabase
      .from("group_sessions")
      .update({ is_active: false })
      .eq("is_active", true)
      .lt("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (error) console.error("Cleanup failed:", error);
    else console.log("Old sessions cleaned up.");
  } catch (err) {
    console.error(err);
  }
}

module.exports = cleanupOldSessions;