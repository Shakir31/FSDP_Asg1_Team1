import React from 'react';
import { Link } from 'react-router-dom';
import { Search, ShoppingCart, User } from 'lucide-react';
import logo from '../assets/logo.png';
import '../Navbar.css'; // We'll create this next

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-item">
        <Link to="/">
          <img src={logo} alt="BevEat Logo" className="logo-image" />
        </Link>
      </div>
      <div className="navbar-item">
        <Link to="/home" className="navbar-link">Home</Link>
      </div>
      <div className="navbar-item">
        <Link to="/redeem" className="navbar-link">Redeem</Link>
      </div>
      <div className="navbar-item">
        <Link to="/contact" className="navbar-link">Contact Us</Link>
      </div>
      <div className="navbar-item">
        <div className="search-container">
          <input type="text" placeholder="Search..." />
          <button className="search-button">
            <Search size={20} />
          </button>
        </div>
      </div>
      <div className="navbar-item">
        <Link to="/cart" className="icon-link">
          <ShoppingCart size={28} />
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