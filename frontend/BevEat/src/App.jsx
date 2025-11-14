import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import Login from "./components/Login";
import Signup from "./components/Signup";
import StallPage from "./components/StallPage";
import MainLayout from "./components/MainLayout";

function App() {
  const [count, setCount] = useState(0);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Signup />} />
      {/* <Route path="/home" element={<Home />} /> */}
      <Route element={<MainLayout />}>
        <Route path="/stalls/:id" element={<StallPage />} />
      </Route>
    </Routes>
  );
}

export default App;
