import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../BrowsePages.css"; // Reuse existing styles

function SearchResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const { results, image } = location.state || { results: [] };

  return (
    <div className="container" style={{ padding: "20px" }}>
      <h2>Visual Search Results</h2>
      
      {/* Show what the user uploaded */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "30px" }}>
        <img 
          src={image} 
          alt="Your upload" 
          style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "8px", border: "2px solid #ff6b6b" }} 
        />
        <p>We found these dishes that look like your photo:</p>
      </div>

      <div className="product-grid">
        {results.map((item) => (
          <div key={item.menuitemid} className="product-card" onClick={() => navigate(`/menu-item/${item.menuitemid}`)}>
            <img src={item.mainimageurl} alt={item.name} />
            <div className="product-info">
              <h3>{item.name}</h3>
              <div className="price">${item.price}</div>
              {/* Show match confidence */}
              <div style={{ fontSize: "0.8em", color: "green", marginTop: "5px" }}>
                {(item.similarity * 100).toFixed(0)}% Visual Match
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SearchResults;