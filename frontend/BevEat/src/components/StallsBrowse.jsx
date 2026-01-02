import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../Home.css";
import "../BrowsePages.css";

function StallsBrowse() {
  const [allStalls, setAllStalls] = useState([]);
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
    async function fetchStalls() {
      try {
        const response = await fetch("http://localhost:3000/stalls");
        if (!response.ok) {
          throw new Error("Failed to fetch stalls");
        }
        const data = await response.json();
        setAllStalls(data);
        setFilteredStalls(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchStalls();
  }, []);

  useEffect(() => {
    filterStalls();
  }, [searchTerm, selectedCategory, allStalls]);

  const filterStalls = () => {
    let filtered = [...allStalls];

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

  return (
    <div className="home-page">
      <section className="stalls">
        <div className="section-header">
          <h2>All Stalls ({filteredStalls.length})</h2>
        </div>

        {/* Search Bar */}
        <div className="browse-search-container">
          <input
            type="text"
            placeholder="Search stalls by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="browse-search-input"
          />
        </div>

        {/* Category Filters */}
        <div className="filters">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryClick(category)}
              className={selectedCategory === category ? "active" : ""}
            >
              {category}
            </button>
          ))}
        </div>

        {loading && <p className="browse-loading">Loading stalls...</p>}
        {error && <p className="browse-error">Error: {error}</p>}

        {!loading && !error && filteredStalls.length === 0 && (
          <p className="browse-no-results">
            No stalls found matching your criteria.
          </p>
        )}

        <div className="card-grid">
          {!loading &&
            !error &&
            filteredStalls.map((stall) => (
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
                    <p className="card-badge">{stall.category}</p>
                  )}
                </div>
              </Link>
            ))}
        </div>
      </section>
    </div>
  );
}

export default StallsBrowse;
