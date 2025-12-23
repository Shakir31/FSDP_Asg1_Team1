const path = require("path");
const sql = require("mssql");
const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");

dotenv.config();

const authController = require("./controllers/userController");
const stallController = require("./controllers/stallController");
const hawkerController = require("./controllers/hawkerController");
const orderController = require("./controllers/orderController");
const imageController = require("./controllers/imageController");
const coinController = require("./controllers/coinController");
const voucherController = require("./controllers/voucherController");
const reviewController = require("./controllers/reviewController");

const { validateReview } = require("./middlewares/reviewValidation");
const { validateMenuItem } = require("./middlewares/menuItemValidation");
const { validateImageUpload } = require("./middlewares/imageValidation");

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
app.get("/users/profile", authenticateToken, authController.getUserProfile);

// Helper function to ensure handler is implemented
function ensureHandler(handler, name) {
  if (typeof handler === "function") return handler;
  return (req, res) => {
    res.status(501).json({ error: `Handler not implemented: ${name}` });
  };
}

//admin: users list
app.get(
  "/admin/users",
  authenticateToken,
  ensureHandler(authorizeRoles("admin"), 'authorizeRoles("admin")'),
  ensureHandler(authController.listUsers, "authController.listUsers")
);
app.get(
  "/admin/users/:id",
  authenticateToken,
  ensureHandler(authorizeRoles("admin"), 'authorizeRoles("admin")'),
  ensureHandler(authController.getUser, "authController.getUser")
);
app.put(
  "/admin/users/:id",
  authenticateToken,
  ensureHandler(authorizeRoles("admin"), 'authorizeRoles("admin")'),
  ensureHandler(authController.updateUser, "authController.updateUser")
);
app.delete(
  "/admin/users/:id",
  authenticateToken,
  ensureHandler(authorizeRoles("admin"), 'authorizeRoles("admin")'),
  ensureHandler(authController.deleteUser, "authController.deleteUser")
);

//admin: stalls list
app.get(
  "/admin/stalls",
  authenticateToken,
  authorizeRoles("admin"),
  stallController.getAllStalls
);
app.get(
  "/admin/stalls/:id",
  authenticateToken,
  authorizeRoles("admin"),
  stallController.getStallById
);
// app.put("/admin/stalls/:id", authenticateToken, authorizeRoles("admin"), (req, res) => {
//   res.status(501).json({ error: 'Not implemented' });
// });
// app.delete("/admin/stalls/:id", authenticateToken, authorizeRoles("admin"), (req, res) => {
//   res.status(501).json({ error: 'Not implemented' });
// });

//stall endpoints
app.get("/stalls", stallController.getAllStalls);
app.get("/stalls/category", stallController.getStallsByCategory);
app.get("/stalls/hawker-centre", stallController.getStallsByHawkerCentre);
app.get("/stalls/:id/photos", stallController.getStallImages);
app.get("/stalls/:id", stallController.getStallById);
app.get("/menu-item/:itemId", stallController.getMenuItemById);
app.post(
  "/stalls",
  authenticateToken,
  authorizeRoles("admin"),
  stallController.createStall
);
app.get("/stalls/:stallId/menu", stallController.getMenuByStall);
app.post(
  "/menuitems",
  validateMenuItem,
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

//hawker endpoints
app.get("/hawker-centres", hawkerController.getAllHawkerCentres);
app.get("/hawker-centres/search", hawkerController.searchHawkerCentres);
app.get("/hawker-centres/status", hawkerController.getHawkerCentresByStatus);
app.get("/hawker-centres/:id", hawkerController.getHawkerCentreById);
app.get(
  "/hawker-centres/:id/stalls",
  hawkerController.getStallsByHawkerCentreId
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
app.post(
  "/images/upload",
  authenticateToken,
  validateImageUpload,
  imageController.uploadImage
);
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
  validateReview,
  authenticateToken,
  authorizeRoles("customer"),
  reviewController.createReview
);
app.get("/reviews/menuitem/:menuItemId", reviewController.getReviewsByMenuItem);
app.get("/reviews/stall/:stallId", reviewController.getReviewsByStall);
app.get("/reviews/user", authenticateToken, reviewController.getReviewsByUser);

// app.get("/vouchers/available", voucherController.getAvailableVouchers);
// app.post("/vouchers/redeem", authenticateToken, voucherController.redeemVoucher);

// app.get("/coins/balance", authenticateToken, coinController.getBalance);
// app.post("/coins/award-photo", authenticateToken, coinController.awardForPhoto);

// // image upload route (ensure validateImageUpload matches frontend)
// app.post("/images/upload", authenticateToken, validateImageUpload, imageController.uploadImage);

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
