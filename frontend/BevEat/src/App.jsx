import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import Login from "./components/Login";
import Signup from "./components/Signup";
import StallPage from "./components/StallPage";
import MainLayout from "./components/MainLayout";
import Product from "./components/Product";
import StallPhotos from "./components/StallPhotos";
import ProfilePage from "./components/ProfilePage";
import Home from "./components/Home";
import NetsQrSamplePage from "./components/NetsQrSamplePage";
import TxnNetsSuccessStatusPage from "./components/TxnNetsSuccessStatusPage";
import TxnNetsFailStatusPage from "./components/TxnNetsFailStatusPage";
import UploadPage from "./components/UploadPage";
import RedeemPage from "./components/RedeemPage";
import { CartProvider, CartPage, CheckoutPage, CheckoutSuccess } from "./components/Cartcontext";


function App() {
  const [count, setCount] = useState(0);

  return (
    <CartProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Signup />} />
        <Route element={<MainLayout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/stalls/:id" element={<StallPage />} />
          <Route path="/stalls/:id/photos" element={<StallPhotos />} />
          <Route path="/menu-item/:itemId" element={<Product />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/checkout/success" element={<CheckoutSuccess />} />
          <Route path="/nets-qr" element={<NetsQrSamplePage />} />
          <Route path="/nets-qr/success" element={<TxnNetsSuccessStatusPage />} />
          <Route path="/nets-qr/fail" element={<TxnNetsFailStatusPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/redeem" element={<RedeemPage />} />
        </Route>
      </Routes>
    </CartProvider>
  );
}

export default App;
