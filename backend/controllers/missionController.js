const missionModel = require("../models/missionModel");
const coinModel = require("../models/coinModel");

async function getDailyMissions(req, res) {
  try {
    const missions = await missionModel.getDailyMissions();
    let completedSet = new Set();
    if (req.user) {
      const claimed = await missionModel.getUserClaims(req.user.userId);
      completedSet = new Set(claimed);
    }
    const mapped = missions.map((m) => ({
      id: m.missionid,
      title: m.title,
      description: m.description,
      rewardCoins: m.rewardcoins,
      completed: completedSet.has(m.missionid),
    }));
    res.json(mapped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch missions" });
  }
}

async function claimMission(req, res) {
  try {
    const userId = req.user.userId;
    const { missionId } = req.body;
    // Prevent double-claim
    const claimed = await missionModel.getUserClaims(userId);
    if (claimed.includes(missionId)) {
      return res.status(400).json({ error: "Already claimed" });
    }
    const mission = await missionModel.getMissionById(missionId);
    if (!mission) return res.status(404).json({ error: "Mission not found" });
    await missionModel.claimMission(missionId, userId);
    // award coins (uses existing coinModel)
    await coinModel.addCoins(userId, mission.rewardcoins);
    res.json({ ok: true, awarded: mission.rewardcoins });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to claim mission" });
  }
}

module.exports = { getDailyMissions, claimMission };