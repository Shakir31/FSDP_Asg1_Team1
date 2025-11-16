import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom'; // Import useParams and hooks
import { Search, ShoppingCart, User } from 'lucide-react';
import '../StallPage.css'; // We'll create this
import logo from '../assets/logo.png';
import hero from '../assets/hero.png';

function StallPage() {
  // --- State for your data ---
  const [stall, setStall] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams(); // <-- Gets the stall ID from the URL

  // --- Data fetching logic ---
  useEffect(() => {
    async function fetchStallData() {
      try {
        setLoading(true);
        
        // --- Fetch 1: Get the stall's details ---
        // This requires the backend endpoint we discussed
        const stallResponse = await fetch(`http://localhost:3000/stalls/${id}`);
        if (!stallResponse.ok) {
          throw new Error(`Stall not found (ID: ${id})`);
        }
        const stallData = await stallResponse.json();
        setStall(stallData);

        // --- Fetch 2: Get the stall's menu items ---
        // This endpoint already exists in your app.js
        const menuResponse = await fetch(`http://localhost:3000/stalls/${id}/menu`);
        if (!menuResponse.ok) {
          throw new Error('Menu items not found');
        }
        const menuData = await menuResponse.json();
        setMenuItems(menuData);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchStallData();
  }, [id]); // This effect re-runs if the 'id' in the URL changes

  // --- Dynamic content to render ---
  let menuContent;
  if (loading) {
    menuContent = <p>Loading...</p>;
  } else if (error) {
    menuContent = <p>Error: {error}</p>;
  } else if (stall) {
    menuContent = (
      <>
        <div className="menu-items-list">
          {menuItems.length > 0 ? (
            menuItems.map(item => (
              <Link 
                key={item.MenuItemID} 
                to={`/menu-item/${item.MenuItemID}`}
                className="menu-item-link" 
              >
              <div key={item.MenuItemID} className="menu-item">
                <img 
                  src={item.MainImageURL || hero} // Use hero as fallback
                  alt={item.Name} 
                  className="menu-item-image"
                />
                <div className="menu-item-content">
                  <h3 className="menu-item-name">{item.Name}</h3>
                  <p className="menu-item-description">{item.Description}</p>
                  <p className="menu-item-price">${parseFloat(item.Price).toFixed(2)}</p>
                </div>
              </div>
              </Link>
            ))
          ) : (
            <p>No menu items available for this stall.</p>
          )}
        </div>
      </>
    );
  }

  return (
    <div className="stall-page-wrapper">
      <main className="stall-page-content">
        <div className="hero-section" style={{ backgroundImage: `url(${hero})` }}>
          {/* You could eventually put the stall's image here */}
          {error && <p className="hero-error">Error: {error}</p>}
          {stall && (
            <div className="hero-content">
              <h1 className="hero-title">{stall.StallName}</h1>
              <p className="hero-description">{stall.Description}</p>
              <p className="hero-info">
                <strong>Location:</strong> {stall.Hawker_Centre}
              </p>
              <p className="hero-info">
                <strong>Category:</strong> {stall.Category}
              </p>
              <Link to={`/stalls/${id}/photos`} className="hero-photos-button">
                View Photos
              </Link>
            </div>
          )}
        </div>
        
        <div className="menu-container">
          <h2 className="menu-title">Menu</h2>
          <div className="menu-items-container">
            {menuContent}
          </div>
        </div>
      </main>
    </div>
  );
}

export default StallPage;