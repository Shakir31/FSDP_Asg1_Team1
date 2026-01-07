const hawkerModel = require("../models/hawkerModel");

async function getAllHawkerCentres(req, res) {
  try {
    const hawkerCentres = await hawkerModel.getAllHawkerCentres();
    res.json(hawkerCentres);
  } catch (error) {
    console.error("Get hawker centres error", error);
    res.status(500).json({ error: "Error fetching hawker centres" });
  }
}

async function getHawkerCentreById(req, res) {
  try {
    const { id } = req.params;
    const hawkerCentre = await hawkerModel.getHawkerCentreById(id);
    if (!hawkerCentre) {
      return res.status(404).json({ error: "Hawker centre not found" });
    }
    res.json(hawkerCentre);
  } catch (error) {
    console.error("Get hawker centre by ID error", error);
    res.status(500).json({ error: "Error fetching hawker centre" });
  }
}

async function getHawkerCentresByStatus(req, res) {
  try {
    const { status } = req.query;
    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }
    const hawkerCentres = await hawkerModel.getHawkerCentresByStatus(status);
    res.json(hawkerCentres);
  } catch (error) {
    console.error("Get hawker centres by status error", error);
    res.status(500).json({ error: "Error fetching hawker centres by status" });
  }
}

async function searchHawkerCentres(req, res) {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: "Search query is required" });
    }
    const hawkerCentres = await hawkerModel.searchHawkerCentres(q);
    res.json(hawkerCentres);
  } catch (error) {
    console.error("Search hawker centres error", error);
    res.status(500).json({ error: "Error searching hawker centres" });
  }
}

async function getStallsByHawkerCentreId(req, res) {
  try {
    const { id } = req.params;
    const stalls = await hawkerModel.getStallsByHawkerCentreId(id);
    res.json(stalls);
  } catch (error) {
    console.error("Get stalls by hawker centre ID error", error);
    res.status(500).json({ error: "Error fetching stalls" });
  }
}

module.exports = {
  getAllHawkerCentres,
  getHawkerCentreById,
  getHawkerCentresByStatus,
  searchHawkerCentres,
  getStallsByHawkerCentreId,
};
