import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Search, ShoppingCart, User } from "lucide-react";
import "../StallPage.css";
import logo from "../assets/logo.png";
import hero from "../assets/hero.png";

function StallPage() {
  const [stall, setStall] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchStallData() {
      try {
        setLoading(true);

        const stallResponse = await fetch(`http://localhost:3000/stalls/${id}`);
        if (!stallResponse.ok) {
          throw new Error(`Stall not found (ID: ${id})`);
        }
        const stallData = await stallResponse.json();
        setStall(stallData);

        const menuResponse = await fetch(
          `http://localhost:3000/stalls/${id}/menu`
        );
        if (!menuResponse.ok) {
          throw new Error("Menu items not found");
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
  }, [id]);

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
            menuItems.map((item) => (
              <Link
                key={item.menuitemid}
                to={`/menu-item/${item.menuitemid}`}
                className="menu-item-link"
              >
                <div key={item.menuitemid} className="menu-item">
                  <img
                    src={item.mainimageurl || hero}
                    alt={item.name}
                    className="menu-item-image"
                  />
                  <div className="menu-item-content">
                    <h3 className="menu-item-name">{item.name}</h3>
                    <p className="menu-item-description">{item.description}</p>
                    <p className="menu-item-price">
                      ${parseFloat(item.price).toFixed(2)}
                    </p>
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
        {/* UPDATED: Uses stall.stall_image if available, otherwise default hero */}
        <div
          className="hero-section"
          style={{
            backgroundImage: `url(${stall?.stall_image || hero})`,
          }}
        >
          {error && <p className="hero-error">Error: {error}</p>}
          {stall && (
            <div className="hero-content">
              <button onClick={() => navigate(`/home`)} className="back-button">
                &larr; Back to Home
              </button>
              <h1 className="hero-title">{stall.stallname}</h1>
              <p className="hero-description">{stall.description}</p>
              <p className="hero-info">
                <strong>Location:</strong> {stall.hawker_centre}
              </p>
              <p className="hero-info">
                <strong>Category:</strong> {stall.category}
              </p>
              <Link to={`/stalls/${id}/photos`} className="hero-photos-button">
                View Reviews
              </Link>
            </div>
          )}
        </div>

        <div className="menu-container">
          <h2 className="menu-title">Menu</h2>
          <div className="menu-items-container">{menuContent}</div>
        </div>
      </main>
    </div>
  );
}

export default StallPage;
