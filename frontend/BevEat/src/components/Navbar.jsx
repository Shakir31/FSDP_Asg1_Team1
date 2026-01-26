import React, { useState, useEffect, useRef } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Search, ShoppingCart, User, Bell } from "lucide-react";
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

  const [logoDropdownOpen, setLogoDropdownOpen] = useState(false);
  const logoRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (logoRef.current && !logoRef.current.contains(e.target)) {
        setLogoDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-item logo-container" ref={logoRef}>
        <button
          onClick={() => setLogoDropdownOpen((s) => !s)}
          className="logo-button"
          style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
          aria-haspopup="true"
          aria-expanded={logoDropdownOpen}
        >
          <img src={logo} alt="BevEat Logo" className="logo-image" />
        </button>

        {logoDropdownOpen && (
          <div className="logo-dropdown">
            {/* --- MOBILE ONLY LINKS (Visible only on small screens) --- */}
            <div className="dropdown-item mobile-only-item">
              <Link to="/home" className="navbar-link" onClick={() => setLogoDropdownOpen(false)}>
                Home
              </Link>
            </div>

            {isStallOwner && (
              <>
                <div className="dropdown-item mobile-only-item">
                  <Link to="/dashboard" className="navbar-link" onClick={() => setLogoDropdownOpen(false)}>
                    Dashboard
                  </Link>
                </div>
                <div className="dropdown-item mobile-only-item">
                  <Link to="/menu-management" className="navbar-link" onClick={() => setLogoDropdownOpen(false)}>
                    Menu
                  </Link>
                </div>
              </>
            )}

            {isAdmin && (
               <div className="dropdown-item mobile-only-item">
                 <Link to="/admin" className="navbar-link" onClick={() => setLogoDropdownOpen(false)}>
                   Dashboard
                 </Link>
               </div>
            )}
            {/* --------------------------------------------------------- */}

            <div className="dropdown-item">
              <Link to="/map" className="navbar-link" onClick={() => setLogoDropdownOpen(false)}>
                Map
              </Link>
            </div>

            {/* {isCustomer && (
              <div className="dropdown-item">
                <Link to="/redeem" className="navbar-link" onClick={() => setLogoDropdownOpen(false)}>
                  Redeem
                </Link>
              </div>
            )} */}

            {isCustomer && (
              <>
                {!session ? (
                  <>
                    <div className="dropdown-item">
                      <button
                        onClick={() => {
                          handleStartClick();
                          setLogoDropdownOpen(false);
                        }}
                        className="navbar-link"
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px" }}
                      >
                        Start Group
                      </button>
                    </div>
                    <div className="dropdown-item">
                      <button
                        onClick={async () => {
                          await handleJoinClick();
                          setLogoDropdownOpen(false);
                        }}
                        className="navbar-link"
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px" }}
                      >
                        Join Group
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="dropdown-item">
                    <Link
                      to="/group-lobby"
                      className="navbar-link"
                      style={{ color: "var(--orange)", fontWeight: "bold" }}
                      onClick={() => setLogoDropdownOpen(false)}
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

      {/* --- DESKTOP LINKS (Hidden on mobile) --- */}
      <div className="navbar-item desktop-only">
        <Link to="/home" className="navbar-link">
          Home
        </Link>
      </div>

      {isCustomer && (
        <div className="navbar-item desktop-only">
          <Link to="/redeem" className="navbar-link">
            Redeem
          </Link>
        </div>
      )}

      {/* Show Dashboard and Menu for stall owners */}
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

      {/* Show Dashboard for admin */}
      {isAdmin && (
        <>
          <div className="navbar-item desktop-only">
            <Link to="/admin" className="navbar-link">
              Dashboard
            </Link>
          </div>
        </>
      )}
      {/* -------------------------------------- */}

      <VisualSearchButton />

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