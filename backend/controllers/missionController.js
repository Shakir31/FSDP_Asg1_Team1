const missionModel = require("../models/missionModel");
const coinModel = require("../models/coinModel");

// next local midnight ISO
function nextMidnightISO() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

async function seedDefaultMissions() {
  const expires_at = nextMidnightISO();
  const items = [
    { title: "First Login", description: "Log in today to receive coins.", rewardcoins: 5, expires_at },
    { title: "Complete Profile", description: "Add a profile picture or bio.", rewardcoins: 10, expires_at },
    { title: "Upload Photo", description: "Upload a photo of a stall or dish.", rewardcoins: 8, expires_at },
    { title: "Write a Review", description: "Leave a review for a stall you visited.", rewardcoins: 6, expires_at },
    { title: "Share App", description: "Share the app link with a friend.", rewardcoins: 4, expires_at },
  ];
  return missionModel.createMissions(items);
}

async function getDailyMissions(req, res) {
  try {
    let missions = await missionModel.getActiveMissions();
    if (!missions || missions.length === 0) {
      // create default set for today (idempotent from controller view)
      await seedDefaultMissions();
      missions = await missionModel.getActiveMissions();
    }

    let userClaims = [];
    if (req.user) {
      userClaims = await missionModel.getUserClaims(req.user.userId);
    }
    const mapped = missions.map((m) => ({
      id: m.missionid,
      title: m.title,
      description: m.description,
      rewardCoins: m.rewardcoins,
      expiresAt: m.expires_at,
      completed: userClaims.includes(m.missionid),
    }));
    res.json(mapped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch missions" });
  }
}

async function claimMission(req, res) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const { missionId } = req.body;
    const mission = await missionModel.getMissionById(missionId);
    if (!mission) return res.status(404).json({ error: "Mission not found" });

    // prevent double claim
    const claimed = await missionModel.getUserClaims(user.userId);
    if (claimed.includes(missionId)) return res.status(400).json({ error: "Already claimed" });

    await missionModel.claimMission(missionId, user.userId);
    // award coins (uses existing coinModel)
    await coinModel.addCoins(user.userId, mission.rewardcoins);
    res.json({ ok: true, awarded: mission.rewardcoins });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to claim mission" });
  }
}

module.exports = { getDailyMissions, claimMission };