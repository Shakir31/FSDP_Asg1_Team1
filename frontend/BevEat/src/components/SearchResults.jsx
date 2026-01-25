import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../BrowsePages.css"; 
import "../VisualSearch.css"; // <--- Import the new CSS file

function SearchResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const { results, image } = location.state || { results: [] };

  return (
    <div className="visual-results-container">
      <div className="results-header">
        <h2>Visual Search Results</h2>
        
        {/* New "Card" Style for the uploaded image */}
        <div className="upload-preview-card">
          <img 
            src={image} 
            alt="Your upload" 
            className="upload-preview-img"
          />
          <div className="upload-text">
            <h4>You Uploaded</h4>
            <p>Searching for similar dishes...</p>
          </div>
        </div>
      </div>

      <div className="product-grid">
        {results.map((item) => (
          <div 
            key={item.menuitemid} 
            className="product-card" 
            onClick={() => navigate(`/menu-item/${item.menuitemid}`)}
          >
            <img src={item.mainimageurl} alt={item.name} />
            <div className="product-info">
              <h3>{item.name}</h3>
              <div className="price">
                ${parseFloat(item.price).toFixed(2)}
              </div>
              
              {/* New Badge Style */}
              <div className="match-badge">
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