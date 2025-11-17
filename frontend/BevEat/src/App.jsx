import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import Login from "./components/Login";
import Signup from "./components/Signup";
import StallPage from "./components/StallPage";
import MainLayout from "./components/MainLayout";

import NetsQrSamplePage from "./components/NetsQrSamplePage";
import TxnNetsSuccessStatusPage from "./components/TxnNetsSuccessStatusPage";
import TxnNetsFailStatusPage from "./components/TxnNetsFailStatusPage";

import { CartProvider, CartPage, CheckoutPage, CheckoutSuccess } from "./components/Cartcontext";

function App() {
  const [count, setCount] = useState(0);

  return (
    <CartProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Signup />} />
        {/* <Route path="/home" element={<Home />} /> */}
        <Route element={<MainLayout />}>
          <Route path="/stalls/:id" element={<StallPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/checkout/success" element={<CheckoutSuccess />} />
          <Route path="/nets-qr" element={<NetsQrSamplePage />} />
          <Route path="/nets-qr/success" element={<TxnNetsSuccessStatusPage />} />
          <Route path="/nets-qr/fail" element={<TxnNetsFailStatusPage />} />
        </Route>
      </Routes>
    </CartProvider>
  );
}

export default App;
