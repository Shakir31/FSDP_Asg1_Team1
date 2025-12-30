import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import Login from "./components/Login";
import Signup from "./components/Signup";
import StallPage from "./components/StallPage";
import MainLayout from "./components/MainLayout";
import AdminHome from "./components/Admin";
import UserAccount from "./components/UserAccount";
import UserUpdate from "./components/UserUpdate";
import Stall from "./components/Stall";
import StallUpdate from "./components/StallUpdate";
import StallCreate from "./components/StallCreate";
import Product from "./components/Product";
import StallPhotos from "./components/StallPhotos";
import StallsBrowse from "./components/StallsBrowse";
import HawkerCentresBrowse from "./components/HawkerCentresBrowse";
import ProfilePage from "./components/ProfilePage";
import Home from "./components/Home";
import HawkerPage from "./components/HawkerPage";
import NetsQrSamplePage from "./components/NetsQrSamplePage";
import TxnNetsSuccessStatusPage from "./components/TxnNetsSuccessStatusPage";
import TxnNetsFailStatusPage from "./components/TxnNetsFailStatusPage";
import UploadPage from "./components/UploadPage";
import RedeemPage from "./components/RedeemPage";
import StallOwnerDashboard from "./components/StallOwnerDashboard";
import MenuManagement from "./components/MenuManagement";
import LandingPage from "./components/LandingPage";
import ForbiddenPage from "./components/ForbiddenPage";
import {
  ProtectedRoute,
  RoleProtectedRoute,
} from "./components/ProtectedRoute";
import {
  CartProvider,
  CartPage,
  CheckoutPage,
  CheckoutSuccess,
} from "./components/Cartcontext";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const [count, setCount] = useState(0);

  return (
    <CartProvider>
      {/* Toast Container - handles all toast notifications */}
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        style={{ zIndex: 9999 }}
      />

      <Routes>
        {/* Public routes - no authentication required */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Signup />} />
        <Route path="/forbidden" element={<ForbiddenPage />} />

        <Route element={<MainLayout />}>
          {/* Public browsing routes */}
          <Route path="/stalls" element={<StallsBrowse />} />
          <Route path="/hawker-centres" element={<HawkerCentresBrowse />} />
          <Route path="/hawker-centres/:id" element={<HawkerPage />} />
          <Route path="/stalls/:id" element={<StallPage />} />
          <Route path="/stalls/:id/photos" element={<StallPhotos />} />
          <Route path="/menu-item/:itemId" element={<Product />} />

          {/* Protected routes - requires any logged-in user */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <CartPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/checkout/success"
            element={
              <ProtectedRoute>
                <CheckoutSuccess />
              </ProtectedRoute>
            }
          />

          <Route
            path="/nets-qr"
            element={
              <ProtectedRoute>
                <NetsQrSamplePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/nets-qr/success"
            element={
              <ProtectedRoute>
                <TxnNetsSuccessStatusPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/nets-qr/fail"
            element={
              <ProtectedRoute>
                <TxnNetsFailStatusPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <UploadPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/redeem"
            element={
              <ProtectedRoute>
                <RedeemPage />
              </ProtectedRoute>
            }
          />

          {/* Stall Owner only routes */}
          <Route
            path="/dashboard"
            element={
              <RoleProtectedRoute allowedRoles={["stall_owner"]}>
                <StallOwnerDashboard />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="/menu-management"
            element={
              <RoleProtectedRoute allowedRoles={["stall_owner"]}>
                <MenuManagement />
              </RoleProtectedRoute>
            }
          />

          {/* Admin only routes */}
          <Route
            path="/admin"
            element={
              <RoleProtectedRoute allowedRoles={["admin"]}>
                <AdminHome />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <RoleProtectedRoute allowedRoles={["admin"]}>
                <UserAccount />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="/admin/users/:id"
            element={
              <RoleProtectedRoute allowedRoles={["admin"]}>
                <UserUpdate />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="/admin/stalls"
            element={
              <RoleProtectedRoute allowedRoles={["admin"]}>
                <Stall />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="/admin/stalls/:id"
            element={
              <RoleProtectedRoute allowedRoles={["admin"]}>
                <StallUpdate />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="/admin/stalls/create-stall"
            element={
              <RoleProtectedRoute allowedRoles={["admin"]}>
                <StallCreate />
              </RoleProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </CartProvider>
  );
}

export default App;
