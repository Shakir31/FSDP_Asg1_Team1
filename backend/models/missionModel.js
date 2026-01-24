const supabase = require("../supabaseClient");

async function getDailyMissions() {
  // simple: return active missions not expired
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("missions")
    .select("missionid, title, description, rewardcoins, expires_at")
    .gt("expires_at", now)
    .order("missionid", { ascending: true });
  if (error) throw error;
  return data;
}

async function getUserClaims(userId) {
  const { data, error } = await supabase
    .from("missions_claims")
    .select("missionid")
    .eq("userid", userId);
  if (error) throw error;
  return (data || []).map((r) => r.missionid);
}

async function claimMission(missionId, userId) {
  const { data, error } = await supabase
    .from("missions_claims")
    .insert([{ missionid: missionId, userid: userId }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function getMissionById(missionId) {
  const { data, error } = await supabase
    .from("missions")
    .select("*")
    .eq("missionid", missionId)
    .single();
  if (error) throw error;
  return data;
}

module.exports = { getDailyMissions, getUserClaims, claimMission, getMissionById };