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
    const { stallId, name, description, price } = req.body;
    const menuItem = await stallModel.createMenuItem(
      stallId,
      name,
      description,
      price
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

module.exports = {
  createStall,
  getAllStalls,
  createMenuItem,
  getMenuByStall,
  updateMenuItemPhoto,
};
