const path = require("path");
const sql = require("mssql");
const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const cleanupOldSessions = require("./cron/cleanupSessions");

cleanupOldSessions();

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const {
  authRoutes,
  adminRoutes,
  stallRoutes,
  menuItemRoutes,
  hawkerRoutes,
  orderRoutes,
  imageRoutes,
  coinRoutes,
  voucherRoutes,
  reviewRoutes,
  notificationRoutes,
  menuManagementRoutes,
  reactionRoutes,
  recommendationRoutes,
  groupOrderRoutes,
  searchRoutes,
} = require("./routes");

// Cron job - Run daily at 2am
cron.schedule("0 2 * * *", () => {
  require("./detectPopularPhotos");
});

// Mount routes
app.use("/", authRoutes);
app.use("/admin", adminRoutes);
app.use("/stalls", stallRoutes);
app.use("/menu-item", menuItemRoutes);
app.use("/hawker-centres", hawkerRoutes);
app.use("/orders", orderRoutes);
app.use("/images", imageRoutes);
app.use("/coins", coinRoutes);
app.use("/vouchers", voucherRoutes);
app.use("/reviews", reviewRoutes);
app.use("/notifications", notificationRoutes);
app.use("/menu-management", menuManagementRoutes);
app.use("/reviews", reactionRoutes);
app.use("/recommendations", recommendationRoutes);
app.use("/group-order", groupOrderRoutes);
app.use("/api/search", searchRoutes);

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}...`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Server shutting down gracefully");
  await sql.close();
  console.log("Database connections closed");
  process.exit(0);
});
