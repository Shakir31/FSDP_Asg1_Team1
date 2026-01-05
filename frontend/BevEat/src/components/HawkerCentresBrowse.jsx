import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../Home.css";
import "../BrowsePages.css";

function HawkerCentresBrowse() {
  const [allHawkerCentres, setAllHawkerCentres] = useState([]);
  const [filteredHawkerCentres, setFilteredHawkerCentres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

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

  // Filter Logic
  useEffect(() => {
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
    setCurrentPage(1); // Reset to page 1 on filter change
  }, [searchTerm, selectedStatus, allHawkerCentres]);

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentHawkerCentres = filteredHawkerCentres.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredHawkerCentres.length / itemsPerPage);

  const handleStatusClick = (status) => {
    setSelectedStatus(status);
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Helper to generate page numbers (1 2 3 ... 10)
  const getPageNumbers = () => {
    const pageNumbers = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pageNumbers.push(i);
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pageNumbers.push(1);
        pageNumbers.push("...");
        for (let i = totalPages - 4; i <= totalPages; i++) pageNumbers.push(i);
      } else {
        pageNumbers.push(1);
        pageNumbers.push("...");
        pageNumbers.push(currentPage - 1);
        pageNumbers.push(currentPage);
        pageNumbers.push(currentPage + 1);
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      }
    }
    return pageNumbers;
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

        {/* Grid displaying current page items */}
        <div className="card-grid">
          {!loading &&
            !error &&
            currentHawkerCentres.map((hawker) => (
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

        {/* Pagination Controls */}
        {!loading && !error && filteredHawkerCentres.length > itemsPerPage && (
          <div className="pagination" style={{ marginTop: "20px", display: "flex", justifyContent: "center", gap: "8px" }}>
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              style={{
                padding: "8px 12px",
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                border: "1px solid #ddd",
                borderRadius: "4px",
                backgroundColor: "#fff",
                color: "black",
              }}
            >
              Prev
            </button>

            {getPageNumbers().map((number, index) =>
              number === "..." ? (
                <span key={`ellipsis-${index}`} style={{ padding: "8px 12px", alignSelf: "center" }}>...</span>
              ) : (
                <button
                  key={number}
                  onClick={() => paginate(number)}
                  style={{
                    padding: "8px 12px",
                    cursor: "pointer",
                    backgroundColor: currentPage === number ? "#007bff" : "#fff",
                    color: currentPage === number ? "white" : "black",
                    border: "1px solid #ddd",
                    borderRadius: "4px",

                  }}
                >
                  {number}
                </button>
              )
            )}

            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{
                padding: "8px 12px",
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                border: "1px solid #ddd",
                borderRadius: "4px",
                backgroundColor: "#fff",
                color: "black",
              }}
            >
              Next
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

export default HawkerCentresBrowse;