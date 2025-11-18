import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../HawkerPage.css";

function HawkerPage() {
  const [stalls, setStalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchStalls() {
      try {
        const response = await fetch("http://localhost:3000/stalls");
        if (!response.ok) {
          throw new Error("Failed to fetch stalls");
        }
        const data = await response.json();
        setStalls(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchStalls();
  }, []);

  return (
    <div className="hawker-page">
      {/* Banner Section */}
      <section className="hawker-banner">
        <img
          src="https://res.cloudinary.com/dv9rwydip/image/upload/v1763507632/Screenshot_2025-11-19_071248_gejxjk.png"
          alt="Maxwell Food Centre"
          className="banner-img"
        />
        <div className="banner-overlay"></div>
        <div className="banner-content">
          <button onClick={() => navigate(`/home`)} className="back-button">
            &larr; Back to Home
          </button>
          <h1>Explore All Stalls</h1>
          <p>Discover the best food near you</p>
          <button className="filter-btn">
            Filter <span className="arrow">▼</span>
          </button>
        </div>
      </section>

      {/* Hawker Stalls Grid */}
      <section className="hawkers">
        {loading && <p>Loading stalls...</p>}
        {error && <p style={{ color: "red" }}>Error: {error}</p>}

        <div className="hawker-grid">
          {!loading &&
            !error &&
            stalls.map((stall) => (
              <Link
                to={`/stalls/${stall.StallID}`}
                className="hawker-card-link"
                key={stall.StallID}
              >
                <div className="hawker-card">
                  <img
                    src={stall.Stall_Image || "/images/buta kin.jpg"}
                    alt={stall.StallName}
                    onError={(e) => {
                      e.target.src = "/images/buta kin.jpg";
                    }}
                  />
                  <h3>{stall.StallName}</h3>
                  <p>{stall.Hawker_Centre}</p>
                  {/* Location/Distance removed as requested */}
                </div>
              </Link>
            ))}
        </div>
      </section>
    </div>
  );
}

export default HawkerPage;
