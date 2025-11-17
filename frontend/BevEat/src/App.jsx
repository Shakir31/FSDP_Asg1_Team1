import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import MainLayout from "./components/MainLayout";
import Login from "./components/Login";
import Signup from "./components/Signup";
import StallPage from "./components/StallPage";
import AdminHome from "./components/Admin";
import UserAccount from "./components/UserAccount";
import UserUpdate from "./components/UserUpdate";


function App() {
  const [count, setCount] = useState(0);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Signup />} />
      {/* <Route path="/home" element={<Home />} /> */}
      <Route element={<MainLayout />}>
        <Route path="/stalls/:id" element={<StallPage />} />
        <Route path="/admin" element={<AdminHome />} />
        <Route path="/admin/users" element={<UserAccount />} />
        <Route path="/admin/users/:id" element={<UserUpdate />} />
      </Route>
    </Routes>
  );
}

export default App;
