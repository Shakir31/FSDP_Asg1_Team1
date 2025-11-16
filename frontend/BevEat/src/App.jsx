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

function App() {
  const [count, setCount] = useState(0);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Signup />} />
      {/* <Route path="/home" element={<Home />} /> */}
      <Route element={<MainLayout />}>
        <Route path="/stalls/:id" element={<StallPage />} />
        <Route path="/stalls/:id/photos" element={<StallPhotos />} />
        <Route path="/menu-item/:itemId" element={<Product />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
    </Routes>
  );
}

export default App;
