import React from 'react';
import { Link } from 'react-router-dom';
import { Search, ShoppingCart, User } from 'lucide-react';
import '../StallPage.css'; // We'll create this CSS file next

function StallPage() {
  return (
    <div className="stall-page-wrapper">
      
      {/* --- NAVBAR STARTS HERE --- */}
      <nav className="navbar">
        <div className="navbar-logo">
          <Link to="/">
            <div className="logo-circle"></div>
          </Link>
        </div>
        <div className="navbar-links">
          <Link to="/">Home</Link>
          <Link to="/redeem">Redeem</Link>
          <Link to="/contact">Contact Us</Link>
        </div>
        <div className="navbar-actions">
          <div className="search-container">
            <input type="text" placeholder="Search..." />
            <button className="search-button">
              <Search size={20} />
            </button>
          </div>
          <Link to="/cart" className="icon-link">
            <ShoppingCart size={28} />
          </Link>
          <Link to="/profile" className="icon-link">
            <User size={28} />
          </Link>
        </div>
      </nav>
      {/* --- NAVBAR ENDS HERE --- */}

      {/* --- PAGE CONTENT STARTS HERE --- */}
      <main className="stall-page-content">
        
        {/* 1. Hero Section (from your Figma) */}
        <div className="hero-section">
          {/* You can add text or other elements inside here if you want */}
        </div>
        
        {/* 2. Stalls List */}
        <div className="stalls-list-container">
          <h1>Stalls</h1>
          <p>This is where the list of stalls will go.</p>
        </div>

      </main>
      {/* --- PAGE CONTENT ENDS HERE --- */}
    </div>
  );
}

export default StallPage;