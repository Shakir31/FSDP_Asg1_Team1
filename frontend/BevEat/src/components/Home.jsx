import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../Home.css";

function Home() {
  const [stalls, setStalls] = useState([]);
  const [hawkerCentres, setHawkerCentres] = useState([]);
  const [stallsLoading, setStallsLoading] = useState(true);
  const [hawkersLoading, setHawkersLoading] = useState(true);
  const [stallsError, setStallsError] = useState(null);
  const [hawkersError, setHawkersError] = useState(null);

  useEffect(() => {
    async function fetchStalls() {
      try {
        const response = await fetch("http://localhost:3000/stalls");
        if (!response.ok) {
          throw new Error("Failed to fetch stalls");
        }
        const data = await response.json();
        // Show only first 4 stalls on homepage
        setStalls(data.slice(0, 4));
      } catch (err) {
        console.error(err);
        setStallsError(err.message);
      } finally {
        setStallsLoading(false);
      }
    }

    async function fetchHawkerCentres() {
      try {
        const response = await fetch("http://localhost:3000/hawker-centres");
        if (!response.ok) {
          throw new Error("Failed to fetch hawker centres");
        }
        const data = await response.json();
        // Show only first 4 hawker centres on homepage
        setHawkerCentres(data.slice(0, 4));
      } catch (err) {
        console.error(err);
        setHawkersError(err.message);
      } finally {
        setHawkersLoading(false);
      }
    }

    fetchStalls();
    fetchHawkerCentres();
  }, []);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <img
          src="https://res.cloudinary.com/dv9rwydip/image/upload/v1763507453/Screenshot_2025-11-19_070921_jc19cv.png"
          alt="satay cooking"
          className="hero-image"
        />
      </section>

      {/* Popular Stalls Section */}
      <section className="stalls">
        <div className="section-header">
          <h2>Popular Stalls Near You</h2>
          <Link to="/stalls" className="see-all">
            See all &gt;
          </Link>
        </div>

        {stallsLoading && <p>Loading stalls...</p>}
        {stallsError && <p style={{ color: "red" }}>Error: {stallsError}</p>}

        <div className="card-grid">
          {!stallsLoading &&
            !stallsError &&
            stalls.map((stall) => (
              <Link
                to={`/stalls/${stall.stallid}`}
                className="card-link"
                key={stall.stallid}
              >
                <div className="card">
                  <img
                    src={
                      stall.stall_image ||
                      "https://res.cloudinary.com/dv9rwydip/image/upload/v1761451673/samples/cup-on-a-table.jpg"
                    }
                    alt={stall.stallname}
                    onError={(e) => {
                      e.target.src =
                        "https://res.cloudinary.com/dv9rwydip/image/upload/v1761451673/samples/cup-on-a-table.jpg";
                    }}
                  />
                  <h3>{stall.stallname}</h3>
                  <p>{stall.description}</p>
                </div>
              </Link>
            ))}
        </div>
      </section>

      {/* Hawker Centres Section */}
      <section className="hawker">
        <div className="section-header">
          <h2>Hawker Centres Near You</h2>
          <Link to="/hawker-centres" className="see-all">
            See all &gt;
          </Link>
        </div>

        {hawkersLoading && <p>Loading hawker centres...</p>}
        {hawkersError && <p style={{ color: "red" }}>Error: {hawkersError}</p>}

        <div className="card-grid">
          {!hawkersLoading &&
            !hawkersError &&
            hawkerCentres.map((hawker) => (
              <Link
                to={`/hawker-centres/${hawker.id}`}
                className="card-link"
                key={hawker.id}
              >
                <div className="card">
                  <img
                    src={
                      hawker.photo_url ||
                      "https://res.cloudinary.com/dv9rwydip/image/upload/v1763507632/Screenshot_2025-11-19_071248_gejxjk.png"
                    }
                    alt={hawker.name}
                    onError={(e) => {
                      e.target.src =
                        "https://res.cloudinary.com/dv9rwydip/image/upload/v1763507632/Screenshot_2025-11-19_071248_gejxjk.png";
                    }}
                  />
                  <h3>{hawker.name}</h3>
                  <p>{hawker.address}</p>
                </div>
              </Link>
            ))}
        </div>
      </section>
    </div>
  );
}

export default Home;
