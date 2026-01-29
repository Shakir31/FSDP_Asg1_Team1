import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ShoppingCart, User, Bell, Menu } from "lucide-react";
import { useCart } from "./Cartcontext";
import { useGroupOrder } from "./GroupOrderContext";
import logo from "../assets/logo.png";
import "../Navbar.css";
import VisualSearchButton from "./VisualSearchButton";

function Navbar() {
  const { items } = useCart();
  const { startGroupOrder, joinGroupOrder, session } = useGroupOrder();
  const navigate = useNavigate();

  const cartCount = items.reduce((total, item) => total + (item.qty || 0), 0);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
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

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="navbar">
      {/* LEFT SECTION: Logo + Menu Icon */}
      <div className="navbar-left-section">
        {/* 1. Main Logo */}
        <Link to="/home" className="logo-link">
          <img src={logo} alt="BevEat Logo" className="logo-image" />
        </Link>

        {/* 2. Navigation Menu */}
        <div
          className="menu-container"
          ref={menuRef}
          onMouseEnter={() => setDropdownOpen(true)}
          onMouseLeave={() => setDropdownOpen(false)}
        >
          <button
            className="menu-trigger-btn"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-label="Toggle Menu"
          >
            <Menu size={32} />
          </button>

          {dropdownOpen && (
            <div className="nav-dropdown-menu">
              {/* Mobile Only Links */}
              <div className="dropdown-item mobile-only-item">
                <Link
                  to="/home"
                  className="navbar-link"
                  onClick={() => setDropdownOpen(false)}
                >
                  Home
                </Link>
              </div>
              {isStallOwner && (
                <>
                  <div className="dropdown-item mobile-only-item">
                    <Link
                      to="/dashboard"
                      className="navbar-link"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Dashboard
                    </Link>
                  </div>
                  <div className="dropdown-item mobile-only-item">
                    <Link
                      to="/menu-management"
                      className="navbar-link"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Menu
                    </Link>
                  </div>
                </>
              )}
              {isAdmin && (
                <div className="dropdown-item mobile-only-item">
                  <Link
                    to="/admin"
                    className="navbar-link"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Dashboard
                  </Link>
                </div>
              )}

              {/* General Links */}
              <div className="dropdown-item">
                <Link
                  to="/map"
                  className="navbar-link"
                  onClick={() => setDropdownOpen(false)}
                >
                  Map
                </Link>
              </div>

              {isCustomer && (
                <div className="dropdown-item">
                  <Link
                    to="/redeem"
                    className="navbar-link"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Redeem
                  </Link>
                </div>
              )}

              {isCustomer && (
                <>
                  {!session ? (
                    <>
                      <div className="dropdown-item">
                        <button
                          onClick={() => {
                            handleStartClick();
                            setDropdownOpen(false);
                          }}
                          className="navbar-link btn-link"
                        >
                          Start Group
                        </button>
                      </div>
                      <div className="dropdown-item">
                        <button
                          onClick={async () => {
                            await handleJoinClick();
                            setDropdownOpen(false);
                          }}
                          className="navbar-link btn-link"
                        >
                          Join Group
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="dropdown-item">
                      <Link
                        to="/group-lobby"
                        className="navbar-link active-group-link"
                        onClick={() => setDropdownOpen(false)}
                      >
                        Group Lobby ({session.join_code})
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CENTER/RIGHT SECTION: Desktop Links */}
      <div className="navbar-item desktop-only">
        <Link to="/home" className="navbar-link">
          Home
        </Link>
      </div>

      {isStallOwner && (
        <>
          <div className="navbar-item desktop-only">
            <Link to="/dashboard" className="navbar-link">
              Dashboard
            </Link>
          </div>
          <div className="navbar-item desktop-only">
            <Link to="/menu-management" className="navbar-link">
              Menu
            </Link>
          </div>
        </>
      )}

      {isAdmin && (
        <div className="navbar-item desktop-only">
          <Link to="/admin" className="navbar-link">
            Dashboard
          </Link>
        </div>
      )}

      {/* Add Redeem link for desktop customers */}
      {isCustomer && (
        <div className="navbar-item desktop-only">
          <Link to="/redeem" className="navbar-link">
            Redeem
          </Link>
        </div>
      )}

      <VisualSearchButton />

      {isCustomer && (
        <div className="navbar-item">
          <Link to="/cart" className="icon-link cart-wrapper">
            <ShoppingCart size={28} />
            <span className="cart-badge">{cartCount}</span>
          </Link>
        </div>
      )}

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
