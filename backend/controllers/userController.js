const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// ===== KEEP THESE AS-IS (YOUR WORKING FUNCTIONS) =====

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

    const validPass = await bcrypt.compare(password, user.passwordhash);
    if (!validPass)
      return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { userId: user.userid, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    res.json({ token, role: user.role });
  } catch (error) {
    console.error("Login error", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function getUserProfile(req, res) {
  try {
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

// ===== ADMIN FUNCTIONS (REDONE) =====

async function listUsers(req, res) {
  try {
    const users = await userModel.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error("List users error", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
}

async function getUser(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const user = await userModel.getUserById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Get user error", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
}

async function updateUser(req, res) {
  try {
    // IMPORTANT: Use req.params.id (the user to update), NOT req.user.userId (the admin)
    const id = parseInt(req.params.id, 10);

    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const { name, email, password, role, coins } = req.body;

    // Check if at least one field is provided
    if (!name && !email && !password && !role && coins === undefined) {
      return res
        .status(400)
        .json({ error: "At least one field is required to update" });
    }

    // Check if user exists
    const existingUser = await userModel.getUserById(id);
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Validate role if provided
    if (role && !["customer", "stall_owner", "admin", "user"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    // Check if email is being changed to one that already exists
    if (email && email !== existingUser.email) {
      const emailExists = await userModel.getUserByEmail(email);
      if (emailExists) {
        return res.status(409).json({ error: "Email already in use" });
      }
    }

    // Hash password if provided
    let passwordHash = null;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    // Update user
    const updated = await userModel.updateUserById(id, {
      name,
      email,
      password: passwordHash,
      role,
      coins,
    });

    res.json({
      message: "User updated successfully",
      user: updated,
    });
  } catch (error) {
    console.error("Update user error", error);

    // Handle duplicate email error from database
    if (error.code === "23505") {
      return res.status(409).json({ error: "Email already in use" });
    }

    res.status(500).json({ error: "Failed to update user" });
  }
}

async function deleteUser(req, res) {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // Check if user exists
    const user = await userModel.getUserById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Prevent admin from deleting themselves
    if (req.user.userId === id) {
      return res.status(403).json({ error: "Cannot delete your own account" });
    }

    await userModel.deleteUserById(id);

    res.json({
      message: "User deleted successfully",
      deleted: true,
    });
  } catch (error) {
    console.error("Delete user error", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
}

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  listUsers,
  updateUser,
  deleteUser,
  getUser,
};
