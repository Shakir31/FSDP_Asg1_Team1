import React from 'react';
import { Link } from 'react-router-dom';
import { Search, ShoppingCart, User } from 'lucide-react';
import '../StallPage.css';
import logo from '../assets/logo.png';

function StallPage() {
  return (
    <div className="stall-page-wrapper">
      <nav className="navbar">
        <div className="navbar-item">
          <Link to="/">
            <img src={logo} alt="BevEat Logo" className="logo-image" />
          </Link>
        </div>

        <div className="navbar-item">
          <Link to="/" className="navbar-link">Home</Link>
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

      <main className="stall-page-content">
        <div className="hero-section">
        </div>
        
        <div className="stalls-list-container">
          <h1>Stalls</h1>
          <p>This is where the list of stalls will go.</p>
        </div>
      </main>
    </div>
  );
}

export default StallPage;