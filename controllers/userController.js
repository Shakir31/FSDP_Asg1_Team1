const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { getUserById, updateUserById } = require('../models/userModel');
const { deleteUserById } = require('../models/userModel');

async function registerUser(req, res) {
  const { name, email, password, role } = req.body;
  try {
    if (!["customer", "stall_owner", "admin"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }
    const existingUser = await userModel.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: "Email already registered" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await userModel.createUser(
      name,
      email,
      hashedPassword,
      role
    );
    res.status(201).json({ message: "User registered", user: newUser });
  } catch (error) {
    console.error("Register error", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function loginUser(req, res) {
  const { email, password } = req.body;
  try {
    const user = await userModel.getUserByEmail(email);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const validPass = await bcrypt.compare(password, user.PasswordHash);
    if (!validPass)
      return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { userId: user.UserID, role: user.Role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    res.json({ token, role: user.Role });
  } catch (error) {
    console.error("Login error", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function listUsers(req, res) {
  try {
    const users = await userModel.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('List users error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function updateUser(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'Invalid id' });
    const { Name, Email, Password, Role } = req.body;
    let passwordHash = null;
    if (Password) {
      passwordHash = await bcrypt.hash(Password, 10);
    }
    const updated = await updateUserById(id, { Name, Email, Password: passwordHash, Role });
    res.json(updated);
  } catch (error) {
    console.error('Update user error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function deleteUser(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'Invalid id' });
    await deleteUserById(id);
    res.json({ deleted: true });
  } catch (error) {
    console.error('Delete user error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getUserProfile(req, res) {
  try {
    // req.user.userId is attached by the authenticateToken middleware
    const userId = parseInt(req.user.userId, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID from token" });
    }

    const user = await userModel.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Get user profile error", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { 
  registerUser, 
  loginUser,
  getUserProfile,listUsers, updateUser, deleteUser
};
