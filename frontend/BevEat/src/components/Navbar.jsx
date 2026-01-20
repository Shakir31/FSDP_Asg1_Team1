import React, { useState, useEffect } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Search, ShoppingCart, User, Bell } from "lucide-react";
import { useCart } from "./Cartcontext";
import { useGroupOrder } from "./GroupOrderContext";
import logo from "../assets/logo.png";
import "../Navbar.css";

function Navbar() {
  const { items } = useCart();
  const { startGroupOrder, joinGroupOrder, session } = useGroupOrder();
  const navigate = useNavigate();

  const cartCount = items.reduce((total, item) => total + (item.qty || 0), 0);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    // Get user role from localStorage or sessionStorage
    const role = localStorage.getItem("role") || sessionStorage.getItem("role");
    setUserRole(role);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("role");
    window.location.href = "/";
  };

  const handleJoinClick = async () => {
    const code = prompt("Enter Group Code:");
    if (code) {
      const success = await joinGroupOrder(code);
      if (success) navigate("/group-lobby");
    }
  };

  const handleStartClick = async () => {
    const newSession = await startGroupOrder();
    if (newSession) {
      navigate("/group-lobby");
    }
  };

  const isStallOwner = userRole === "stall_owner";
  const isAdmin = userRole == "admin";
  const isCustomer = userRole == "customer";

  return (
    <nav className="navbar">
      <div className="navbar-item">
        <Link to="/home">
          <img src={logo} alt="BevEat Logo" className="logo-image" />
        </Link>
      </div>

      <div className="navbar-item">
        <Link to="/home" className="navbar-link">
          Home
        </Link>
      </div>

      {/* Show Dashboard and Menu for stall owners */}
      {isStallOwner && (
        <>
          <div className="navbar-item">
            <Link to="/dashboard" className="navbar-link">
              Dashboard
            </Link>
          </div>
          <div className="navbar-item">
            <Link to="/menu-management" className="navbar-link">
              Menu
            </Link>
          </div>
        </>
      )}

      {/* Show Dashboard for admin */}
      {isAdmin && (
        <>
          <div className="navbar-item">
            <Link to="/admin" className="navbar-link">
              Dashboard
            </Link>
          </div>
        </>
      )}

      {/* Show Redeem for regular users */}
      {isCustomer && (
        <div className="navbar-item">
          <Link to="/redeem" className="navbar-link">
            Redeem
          </Link>
        </div>
      )}

      {/* Group Order Dropdown for regular users */}
      {!session ? (
        <>
          <div className="navbar-item">
            <button
              onClick={handleStartClick}
              className="navbar-link"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "16px",
              }}
            >
              Start Group
            </button>
          </div>
          <div className="navbar-item">
            <button
              onClick={handleJoinClick}
              className="navbar-link"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "16px",
              }}
            >
              Join Group
            </button>
          </div>
        </>
      ) : (
        <div className="navbar-item">
          <Link
            to="/group-lobby"
            className="navbar-link"
            style={{ color: "var(--orange)", fontWeight: "bold" }}
          >
            Group Lobby ({session.join_code})
          </Link>
        </div>
      )}

      {/* Only show Cart for regular users */}
      {isCustomer && (
        <div className="navbar-item">
          <Link to="/cart" className="icon-link cart-wrapper">
            <ShoppingCart size={28} />
            <span className="cart-badge">{cartCount}</span>
          </Link>
        </div>
      )}

      {/* Profile Dropdown */}
      <div className="navbar-item profile-icon-container">
        <div className="icon-link profile-trigger">
          <User size={28} />
        </div>

        <div className="profile-dropdown">
          <Link to="/profile" className="dropdown-item">
            Profile
          </Link>
          <button onClick={handleLogout} className="dropdown-item logout-btn">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
