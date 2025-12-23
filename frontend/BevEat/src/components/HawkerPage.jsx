import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import "../Home.css";

function HawkerPage() {
  const { id } = useParams();
  const [hawkerCentre, setHawkerCentre] = useState(null);
  const [stalls, setStalls] = useState([]);
  const [filteredStalls, setFilteredStalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = [
    "All",
    "Chinese",
    "Malay",
    "Indian",
    "Peranakan",
    "Hakka",
  ];

  useEffect(() => {
    async function fetchHawkerCentreAndStalls() {
      try {
        // Fetch hawker centre details
        const hawkerResponse = await fetch(
          `http://localhost:3000/hawker-centres/${id}`
        );
        if (!hawkerResponse.ok) {
          throw new Error("Failed to fetch hawker centre details");
        }
        const hawkerData = await hawkerResponse.json();
        setHawkerCentre(hawkerData);

        // Fetch stalls for this hawker centre
        const stallsResponse = await fetch(
          `http://localhost:3000/hawker-centres/${id}/stalls`
        );
        if (!stallsResponse.ok) {
          throw new Error("Failed to fetch stalls");
        }
        const stallsData = await stallsResponse.json();
        setStalls(stallsData);
        setFilteredStalls(stallsData);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchHawkerCentreAndStalls();
  }, [id]);

  useEffect(() => {
    filterStalls();
  }, [searchTerm, selectedCategory, stalls]);

  const filterStalls = () => {
    let filtered = [...stalls];

    // Filter by category
    if (selectedCategory !== "All") {
      filtered = filtered.filter(
        (stall) => stall.category === selectedCategory
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (stall) =>
          stall.stallname.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (stall.description &&
            stall.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredStalls(filtered);
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
  };

  if (loading) {
    return (
      <div className="home-page">
        <section className="stalls">
          <p>Loading...</p>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-page">
        <section className="stalls">
          <p style={{ color: "red" }}>Error: {error}</p>
        </section>
      </div>
    );
  }

  return (
    <div className="home-page">
      {/* Hawker Centre Hero Section */}
      {hawkerCentre && (
        <section className="hero">
          <img
            src={
              hawkerCentre.photo_url ||
              "https://res.cloudinary.com/dv9rwydip/image/upload/v1763507632/Screenshot_2025-11-19_071248_gejxjk.png"
            }
            alt={hawkerCentre.name}
            className="hero-image"
            onError={(e) => {
              e.target.src =
                "https://res.cloudinary.com/dv9rwydip/image/upload/v1763507632/Screenshot_2025-11-19_071248_gejxjk.png";
            }}
          />
        </section>
      )}

      {/* Hawker Centre Details */}
      {hawkerCentre && (
        <section className="stalls">
          <h1 style={{ fontSize: "2rem", marginBottom: "10px", color: "#333" }}>
            {hawkerCentre.name}
          </h1>
          <p style={{ fontSize: "1rem", color: "#666", marginBottom: "10px" }}>
            📍 {hawkerCentre.address}
            {hawkerCentre.postal_code && `, ${hawkerCentre.postal_code}`}
          </p>
          {hawkerCentre.no_of_cooked_food_stalls && (
            <p
              style={{
                fontSize: "0.9rem",
                color: "#ff7622",
                marginBottom: "20px",
              }}
            >
              🏪 {hawkerCentre.no_of_cooked_food_stalls} cooked food stalls
            </p>
          )}
          {hawkerCentre.status && (
            <p
              style={{
                fontSize: "0.9rem",
                color: "#666",
                marginBottom: "20px",
              }}
            >
              Status: {hawkerCentre.status}
            </p>
          )}
        </section>
      )}

      {/* Stalls Section */}
      <section className="stalls">
        <div className="section-header">
          <h2>Stalls at this Hawker Centre ({filteredStalls.length})</h2>
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: "20px" }}>
          <input
            type="text"
            placeholder="Search stalls by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 16px",
              fontSize: "1rem",
              border: "1px solid #ddd",
              borderRadius: "8px",
              outline: "none",
            }}
          />
        </div>

        {/* Category Filters */}
        <div className="filters">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryClick(category)}
              style={{
                backgroundColor:
                  selectedCategory === category ? "#ff7622" : "#f0f0f0",
                color: selectedCategory === category ? "white" : "#333",
              }}
            >
              {category}
            </button>
          ))}
        </div>

        {filteredStalls.length === 0 && (
          <p style={{ textAlign: "center", color: "#666", marginTop: "40px" }}>
            No stalls found matching your criteria.
          </p>
        )}

        <div className="card-grid">
          {filteredStalls.map((stall) => (
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
                {stall.category && (
                  <p
                    style={{
                      color: "#ff7622",
                      fontWeight: "500",
                      fontSize: "0.85rem",
                    }}
                  >
                    {stall.category}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

export default HawkerPage;
