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
  const [currentPage, setCurrentPage] = useState(1);
  const stallsPerPage = 10;

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
    setCurrentPage(1); // Reset to page 1 whenever filters change
  }, [searchTerm, selectedCategory, allStalls]);

  // Pagination Logic
  const indexOfLastStall = currentPage * stallsPerPage;
  const indexOfFirstStall = indexOfLastStall - stallsPerPage;
  const currentStalls = filteredStalls.slice(
    indexOfFirstStall,
    indexOfLastStall
  );
  const totalPages = Math.ceil(filteredStalls.length / stallsPerPage);

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Helper to generate the array of page numbers to show
  const getPageNumbers = () => {
    const pageNumbers = [];
    
    // If 7 or fewer pages, show all of them (no dots needed)
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Logic for truncation
      if (currentPage <= 4) {
        // Case 1: Near the start -> 1 2 3 4 5 ... 100
        for (let i = 1; i <= 5; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        // Case 2: Near the end -> 1 ... 96 97 98 99 100
        pageNumbers.push(1);
        pageNumbers.push("...");
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        // Case 3: Somewhere in the middle -> 1 ... 49 50 51 ... 100
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
            currentStalls.map((stall) => (
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

        {/* Pagination Controls */}
        {!loading && !error && filteredStalls.length > stallsPerPage && (
          <div
            className="pagination"
            style={{
              marginTop: "20px",
              display: "flex",
              justifyContent: "center",
              gap: "8px",
            }}
          >
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
                <span
                  key={`ellipsis-${index}`}
                  style={{
                    padding: "8px 12px",
                    alignSelf: "center",
                  }}
                >
                  ...
                </span>
              ) : (
                <button
                  key={number}
                  onClick={() => paginate(number)}
                  style={{
                    padding: "8px 12px",
                    cursor: "pointer",
                    backgroundColor:
                      currentPage === number ? "#007bff" : "#fff",
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

export default StallsBrowse;