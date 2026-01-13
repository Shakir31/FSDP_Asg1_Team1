import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../Home.css";
import "../BrowsePages.css";

function HawkerCentresBrowse() {
  const [allHawkerCentres, setAllHawkerCentres] = useState([]);
  const [filteredHawkerCentres, setFilteredHawkerCentres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");

  const statuses = ["All", "Existing", "Upcoming"];

  useEffect(() => {
    async function fetchHawkerCentres() {
      try {
        const response = await fetch("http://localhost:3000/hawker-centres");
        if (!response.ok) {
          throw new Error("Failed to fetch hawker centres");
        }
        const data = await response.json();
        setAllHawkerCentres(data);
        setFilteredHawkerCentres(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchHawkerCentres();
  }, []);

  useEffect(() => {
    filterHawkerCentres();
  }, [searchTerm, selectedStatus, allHawkerCentres]);

  const filterHawkerCentres = () => {
    let filtered = [...allHawkerCentres];

    // Filter by status
    if (selectedStatus !== "All") {
      filtered = filtered.filter(
        (hawker) =>
          hawker.status &&
          hawker.status.toLowerCase() === selectedStatus.toLowerCase()
      );
    }

    // Filter by search term (name, address, postal code)
    if (searchTerm) {
      filtered = filtered.filter(
        (hawker) =>
          hawker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (hawker.address &&
            hawker.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (hawker.postal_code &&
            hawker.postal_code.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredHawkerCentres(filtered);
  };

  const handleStatusClick = (status) => {
    setSelectedStatus(status);
  };

  return (
    <div className="home-page">
      <section className="hawker">
        <div className="section-header">
          <h2>All Hawker Centres ({filteredHawkerCentres.length})</h2>
        </div>

        {/* Search Bar */}
        <div className="browse-search-container">
          <input
            type="text"
            placeholder="Search by name, address, or postal code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="browse-search-input"
          />
        </div>

        {/* Status Filters */}
        <div className="filters">
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => handleStatusClick(status)}
              className={selectedStatus === status ? "active" : ""}
            >
              {status}
            </button>
          ))}
        </div>

        {loading && <p className="browse-loading">Loading hawker centres...</p>}
        {error && <p className="browse-error">Error: {error}</p>}

        {!loading && !error && filteredHawkerCentres.length === 0 && (
          <p className="browse-no-results">
            No hawker centres found matching your criteria.
          </p>
        )}

        <div className="card-grid">
          {!loading &&
            !error &&
            filteredHawkerCentres.map((hawker) => (
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
                  {hawker.no_of_cooked_food_stalls && (
                    <p className="card-badge">
                      {hawker.no_of_cooked_food_stalls} stalls
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

export default HawkerCentresBrowse;
