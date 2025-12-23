import React from 'react';
import { Link } from 'react-router-dom';
import { Search, ShoppingCart, User } from 'lucide-react';
import { useCart } from './Cartcontext'; // 1. Import the cart hook
import logo from '../assets/logo.png';
import '../Navbar.css';

function Navbar() {
  const { items } = useCart();
  const cartCount = items.reduce((total, item) => total + (item.qty || 0), 0);

  // Add the logout handler since it wasn't in the repo file
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('role');
    window.location.href = '/login';
  }

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

      {/* MODIFIED SECTION: Profile Dropdown */}
      <div className="navbar-item profile-icon-container">
        <div className="icon-link profile-trigger">
          <User size={28} />
        </div>
        
        <div className="profile-dropdown">
          <Link to="/profile" className="dropdown-item">Profile</Link>
          <button onClick={handleLogout} className="dropdown-item logout-btn">Logout</button>
        </div>
      </div>
      {/* END MODIFIED SECTION */}

    </nav>
  );
}

export default Navbar;