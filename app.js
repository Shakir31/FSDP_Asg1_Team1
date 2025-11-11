const path = require("path");
const sql = require("mssql");
const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");

dotenv.config();

const authController = require("./controllers/userController");
const stallController = require("./controllers/stallController");
const orderController = require("./controllers/orderController");
const imageController = require("./controllers/imageController");
const coinController = require("./controllers/coinController");
const voucherController = require("./controllers/voucherController");
const reviewController = require("./controllers/reviewController");

const {
  authenticateToken,
  authorizeRoles,
} = require("./middlewares/authMiddleware");

const app = express();
const port = process.env.PORT || 3000;

//middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//auth endpoints
app.post("/register", authController.registerUser);
app.post("/login", authController.loginUser);

//stall endpoints
app.get("/stalls", stallController.getAllStalls);
app.get("/stalls/category", stallController.getStallsByCategory);
app.get("/stalls/hawker-centre", stallController.getStallsByHawkerCentre);
app.post(
  "/stalls",
  authenticateToken,
  authorizeRoles("admin"),
  stallController.createStall
);
app.get("/stalls/:stallId/menu", stallController.getMenuByStall);
app.post(
  "/menuitems",
  authenticateToken,
  authorizeRoles("stall_owner"),
  stallController.createMenuItem
);
app.put(
  "/menuitems/photo",
  authenticateToken,
  authorizeRoles("stall_owner"),
  stallController.updateMenuItemPhoto
);

//order endpoints
app.post(
  "/orders",
  authenticateToken,
  authorizeRoles("customer"),
  orderController.placeOrder
);
app.get(
  "/orders/history",
  authenticateToken,
  authorizeRoles("customer"),
  orderController.getOrderHistory
);
app.put(
  "/orders/payment",
  authenticateToken,
  orderController.updatePaymentStatus
);

//image upload and voting
app.post("/images/upload", authenticateToken, imageController.uploadImage);
app.post("/images/upvote", authenticateToken, imageController.upvoteImage);

//coin gamification endpoints
app.get("/coins/balance", authenticateToken, coinController.getUserCoins);

app.post(
  "/coins/award-photo",
  authenticateToken,
  coinController.awardPhotoUploadCoins
);

//voucher
app.get("/vouchers", voucherController.getAllVouchers);
app.post(
  "/vouchers/redeem",
  authenticateToken,
  authorizeRoles("customer"),
  voucherController.redeemVoucher
);

app.get(
  "/vouchers/user",
  authenticateToken,
  authorizeRoles("customer"),
  voucherController.getUserVouchers
);

//review
app.post(
  "/reviews",
  authenticateToken,
  authorizeRoles("customer"),
  reviewController.createReview
);
app.get("/reviews/menuitem/:menuItemId", reviewController.getReviewsByMenuItem);
app.get("/reviews/stall/:stallId", reviewController.getReviewsByStall);

//start server
app.listen(port, () => {
  console.log(`Server running on port ${port}...`);
});

//graceful shutdown
process.on("SIGINT", async () => {
  console.log("Server shutting down gracefully");
  await sql.close();
  console.log("Database connections closed");
  process.exit(0);
});
