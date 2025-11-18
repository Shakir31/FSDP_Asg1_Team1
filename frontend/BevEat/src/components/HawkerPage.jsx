import React, { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import "../HawkerPage.css";

function HawkerPage() {
  const [stalls, setStalls] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get hawkerCentre from query string
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const hawkerCentre = searchParams.get("hawkerCentre") || "Maxwell"; // default to Maxwell

  useEffect(() => {
    async function fetchStalls() {
      try {
        const res = await fetch(
          `http://localhost:3000/stalls/hawker-centre?hawkerCentre=${hawkerCentre}`
        );
        const data = await res.json();
        setStalls(data);
      } catch (err) {
        console.error("Error fetching stalls:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchStalls();
  }, [hawkerCentre]);

  if (loading) return <p>Loading stalls...</p>;

  return (
    <div className="hawker-page">
      {/* Banner Section */}
      <section className="hawker-banner">
        <img
          src={`/images/${hawkerCentre}.png`}
          alt={hawkerCentre}
          className="banner-img"
        />
        <div className="banner-overlay"></div>
        <div className="banner-content">
          <h1>{hawkerCentre}</h1>
          <p>Address hardcoded for now</p>
          <button className="filter-btn">
            Filter <span className="arrow">▼</span>
          </button>
        </div>
      </section>

      {/* Hawker Stalls Grid */}
      <section className="hawkers">
        <div className="hawker-grid">
          {stalls.length === 0 && <p>No stalls found for this hawker centre.</p>}

          {stalls.map((stall) => (
            <Link
              to={`/stalls/${stall.StallID}`}
              key={stall.StallID}
              className="hawker-card-link"
            >
              <div className="hawker-card">
                <img
                  src={stall.Stall_Image || "/images/default-stall.png"}
                  alt={stall.Name}
                />
                <h3>{stall.Name}</h3>
                <p>{stall.Address || "Address not available"}</p>
                <p className="distance">{stall.Distance || "📍 N/A"}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

export default HawkerPage;
