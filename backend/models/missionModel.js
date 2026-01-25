const supabase = require("../supabaseClient");

async function getActiveMissions() {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("missions")
    .select("*")
    .gt("expires_at", now)
    .order("missionid", { ascending: true });
  if (error) throw error;
  return data || [];
}

async function createMissions(items) {
  const { data, error } = await supabase.from("missions").insert(items).select();
  if (error) throw error;
  return data;
}

async function getMissionById(missionId) {
  const { data, error } = await supabase.from("missions").select("*").eq("missionid", missionId).single();
  if (error) return null;
  return data;
}

async function getUserClaims(userId) {
  const { data, error } = await supabase.from("missions_claims").select("missionid").eq("userid", userId);
  if (error) throw error;
  return (data || []).map((r) => r.missionid);
}

async function claimMission(missionId, userId) {
  const { data, error } = await supabase
    .from("missions_claims")
    .insert([{ missionid: missionId, userid: userId }])
    .select();
  if (error) throw error;
  return data;
}

module.exports = { getActiveMissions, createMissions, getMissionById, getUserClaims, claimMission };