import React from "react";
import { Link } from "react-router-dom";
import { Search, ShoppingCart, User } from "lucide-react";
import { useCart } from "./Cartcontext"; // 1. Import the cart hook
import logo from "../assets/logo.png";
import "../Navbar.css";

function Navbar() {
  const { items } = useCart(); // 2. Get cart items

  // 3. Calculate total items (sum of quantities)
  const cartCount = items.reduce((total, item) => total + (item.qty || 0), 0);

  return (
    <nav className="navbar">
      <div className="navbar-item">
        <Link to="/">
          <img src={logo} alt="BevEat Logo" className="logo-image" />
        </Link>
      </div>
      <div className="navbar-item">
        <Link to="/home" className="navbar-link">
          Home
        </Link>
      </div>
      <div className="navbar-item">
        <Link to="/redeem" className="navbar-link">
          Redeem
        </Link>
      </div>
      <div className="navbar-item">
        <Link to="/cart" className="icon-link cart-wrapper">
          <ShoppingCart size={28} />
          <span className="cart-badge">{cartCount}</span>
        </Link>
      </div>
      <div className="navbar-item">
        <Link to="/profile" className="icon-link">
          <User size={28} />
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;
