const stallModel = require("../models/stallModel");

async function createStall(req, res) {
  try {
    const { stallName, description, hawker_centre, category } = req.body;
    const stall = await stallModel.createStall(
      stallName,
      description,
      hawker_centre,
      category
    );
    res.status(201).json(stall);
  } catch (error) {
    console.error("Create stall error", error);
    res.status(500).json({ error: "Error creating stall" });
  }
}

async function getAllStalls(req, res) {
  try {
    const stalls = await stallModel.getAllStalls();
    res.json(stalls);
  } catch (error) {
    console.error("Get stalls error", error);
    res.status(500).json({ error: "Error fetching stalls" });
  }
}

async function createMenuItem(req, res) {
  try {
    const { stallId, name, description, price, url, category } = req.body;
    const menuItem = await stallModel.createMenuItem(
      stallId,
      name,
      description,
      price,
      url,
      category
    );
    res.status(201).json(menuItem);
  } catch (error) {
    console.error("Create menu item error", error);
    res.status(500).json({ error: "Error creating menu item" });
  }
}

async function getMenuByStall(req, res) {
  try {
    const { stallId } = req.params;
    const menuItems = await stallModel.getMenuByStall(stallId);
    res.json(menuItems);
  } catch (error) {
    console.error("Get menu error", error);
    res.status(500).json({ error: "Error fetching menu items" });
  }
}

async function updateMenuItemPhoto(req, res) {
  try {
    const { menuItemId, imageUrl } = req.body;
    await stallModel.updateMenuItemPhoto(menuItemId, imageUrl);
    res.json({ message: "Menu item photo updated" });
  } catch (error) {
    console.error("Update menu photo error", error);
    res.status(500).json({ error: "Error updating menu photo" });
  }
}

async function getStallsByCategory(req, res) {
  try {
    const { category } = req.query;
    if (!category)
      return res.status(400).json({ error: "Category is required" });
    const stalls = await stallModel.getStallsByCategory(category);
    res.json(stalls);
  } catch (error) {
    console.error("Get stalls by category error", error);
    res.status(500).json({ error: "Error fetching stalls by category" });
  }
}

async function getStallsByHawkerCentre(req, res) {
  try {
    const { hawker_centre } = req.query;
    if (!hawker_centre)
      return res.status(400).json({ error: "Hawker centre is required" });
    const stalls = await stallModel.getStallsByHawkerCentre(hawker_centre);
    res.json(stalls);
  } catch (error) {
    console.error("Get stalls by hawker centre error", error);
    res.status(500).json({ error: "Error fetching stalls by hawker centre" });
  }
}

async function getStallById(req, res) {
  try {
    const { id } = req.params;
    const stall = await stallModel.getStallById(id);
    if (!stall) {
      return res.status(404).json({ error: "Stall not found" });
    }
    res.json(stall);
  } catch (error) {
    console.error("Get stall by ID error", error);
    res.status(500).json({ error: "Error fetching stall" });
  }
}

async function getMenuItemById(req, res) {
  try {
    const { itemId } = req.params;
    const item = await stallModel.getMenuItemById(itemId);
    if (!item) {
      return res.status(404).json({ error: "Menu item not found" });
    }
    res.json(item);
  } catch (error) {
    console.error("Get menu item by ID error", error);
    res.status(500).json({ error: "Error fetching menu item" });
  }
}

module.exports = {
  createStall,
  getAllStalls,
  createMenuItem,
  getMenuByStall,
  updateMenuItemPhoto,
  getStallsByCategory,
  getStallsByHawkerCentre,
  getStallById,
  getMenuItemById,
};
