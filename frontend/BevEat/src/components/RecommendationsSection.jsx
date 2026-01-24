import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "../RecommendationsSection.css";

function RecommendationsSection({ limit = 6, showTitle = true }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRecommendations();
  }, [limit]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");

      let endpoint = "";
      let headers = {};

      if (token) {
        // Try personalized first
        endpoint = `/recommendations?limit=${limit}`;
        headers = { Authorization: `Bearer ${token}` };
      } else {
        // No token, use popular
        endpoint = `/recommendations/popular?limit=${limit}`;
      }

      const response = await fetch(`http://localhost:3000${endpoint}`, {
        headers,
      });
      const data = await response.json();

      if (!response.ok) {
        // If personalized fails and we have token, try popular as fallback
        if (token && response.status === 500) {
          console.log(
            "Personalized recommendations failed, trying popular items..."
          );
          const popularResponse = await fetch(
            `http://localhost:3000/recommendations/popular?limit=${limit}`
          );
          const popularData = await popularResponse.json();

          if (popularResponse.ok && popularData.recommendations) {
            setRecommendations(popularData.recommendations);
            return;
          }
        }
        throw new Error(data.error || "Failed to fetch recommendations");
      }

      // Handle different response formats
      if (data.usePopular && token) {
        // Backend says to use popular items instead
        console.log("Using popular items as fallback...");
        const popularResponse = await fetch(
          `http://localhost:3000/recommendations/popular?limit=${limit}`
        );
        const popularData = await popularResponse.json();

        if (popularResponse.ok && popularData.recommendations) {
          setRecommendations(popularData.recommendations);
        }
      } else if (data.recommendations && data.recommendations.length > 0) {
        setRecommendations(data.recommendations);
      } else if (data.message) {
        // No recommendations available, try popular as last resort
        if (token) {
          const popularResponse = await fetch(
            `http://localhost:3000/recommendations/popular?limit=${limit}`
          );
          const popularData = await popularResponse.json();

          if (popularResponse.ok && popularData.recommendations) {
            setRecommendations(popularData.recommendations);
          } else {
            setError(data.message);
          }
        } else {
          setError(data.message);
        }
      }
    } catch (err) {
      console.error("Error fetching recommendations:", err);
      // Try popular items as final fallback
      try {
        const popularResponse = await fetch(
          `http://localhost:3000/recommendations/popular?limit=${limit}`
        );
        const popularData = await popularResponse.json();

        if (
          popularResponse.ok &&
          popularData.recommendations &&
          popularData.recommendations.length > 0
        ) {
          setRecommendations(popularData.recommendations);
        } else {
          setError("Unable to load recommendations");
        }
      } catch (fallbackErr) {
        setError("Unable to load recommendations");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = (menuItem) => {
    // Navigate to stall page with the menu item highlighted
    navigate(`/stalls/${menuItem.stallid}`, {
      state: { highlightItem: menuItem.menuitemid },
    });
  };

  if (loading) {
    return (
      <div className="recommendations-section">
        {showTitle && (
          <div className="recommendations-header">
            <h2>🎯 Recommended For You</h2>
            <p className="subtitle">Based on your taste</p>
          </div>
        )}
        <div className="recommendations-loading">
          <div className="loading-spinner"></div>
          <p>Finding dishes you'll love...</p>
        </div>
      </div>
    );
  }

  if (error || recommendations.length === 0) {
    return null; // Don't show section if no recommendations
  }

  return (
    <div className="recommendations-section">
      {showTitle && (
        <div className="recommendations-header">
          <h2>🎯 Recommended For You</h2>
          <p className="subtitle">Based on your taste</p>
        </div>
      )}

      <div className="recommendations-grid">
        {recommendations.map((item) => (
          <div
            key={item.menuitemid}
            className="recommendation-card"
            onClick={() => handleItemClick(item)}
          >
            {/* Image */}
            <div className="recommendation-image-container">
              {item.mainimageurl ? (
                <img
                  src={item.mainimageurl}
                  alt={item.name}
                  className="recommendation-image"
                  onError={(e) => {
                    e.target.src =
                      "https://via.placeholder.com/300x200?text=No+Image";
                  }}
                />
              ) : (
                <div className="recommendation-image-placeholder">
                  <span>🍽️</span>
                </div>
              )}

              {/* Category badge */}
              {item.category && (
                <div className="category-badge">{item.category}</div>
              )}
            </div>

            {/* Content */}
            <div className="recommendation-content">
              <h3 className="recommendation-name">{item.name}</h3>

              {item.stalls && (
                <p className="recommendation-stall">
                  📍 {item.stalls.stallname}
                </p>
              )}

              {item.description && (
                <p className="recommendation-description">
                  {item.description.length > 80
                    ? `${item.description.substring(0, 80)}...`
                    : item.description}
                </p>
              )}

              <div className="recommendation-footer">
                <span className="recommendation-price">
                  ${parseFloat(item.price).toFixed(2)}
                </span>

                {item.averageRating > 0 && (
                  <span className="recommendation-rating">
                    ⭐ {item.averageRating.toFixed(1)}
                  </span>
                )}

                {item.photoCount > 0 && (
                  <span className="recommendation-photos">
                    📸 {item.photoCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* See all link */}
      <div className="recommendations-footer">
        <button
          className="see-all-btn"
          onClick={() => navigate("/stalls")}
        >
          Explore All Stalls →
        </button>
      </div>
    </div>
  );
}

export default RecommendationsSection;
