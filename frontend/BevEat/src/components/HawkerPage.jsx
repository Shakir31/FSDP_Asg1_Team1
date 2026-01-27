import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import "../HawkerPage.css";
import "../Home.css";
import hero from "../assets/hero.png";

function HawkerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hawkerCentre, setHawkerCentre] = useState(null);
  const [stalls, setStalls] = useState([]);
  const [filteredStalls, setFilteredStalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const categories = [
    "All",
    "Chinese",
    "Malay",
    "Indian",
    "Western",
    "Japanese",
    "Thai",
    "Korean",
    "Vietnamese",
    "Fusion",
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

  // Filter Logic
  useEffect(() => {
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
    setCurrentPage(1); // Reset to page 1 on filter
  }, [searchTerm, selectedCategory, stalls]);

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentStalls = filteredStalls.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredStalls.length / itemsPerPage);

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

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
      {/* Hero wrapper to constrain width */}
      <div className="hawker-hero-wrapper">
        {/* Hawker Centre Hero Section */}
        <div
          className="hawker-hero-section"
          style={{
            backgroundImage: `url(${
              hawkerCentre?.photo_url || hero
            })`,
          }}
        >
        {hawkerCentre && (
          <div className="hawker-hero-content">
            <button
              onClick={() => navigate("/home")}
              className="back-button"
              style={{ background: "white" }}
            >
              &larr; Back to Home
            </button>
            <h1 className="hawker-hero-title">{hawkerCentre.name}</h1>
            <p className="hawker-hero-info">
              <strong>Location:</strong> {hawkerCentre.address}
              {hawkerCentre.postal_code && `, ${hawkerCentre.postal_code}`}
            </p>
            {hawkerCentre.no_of_cooked_food_stalls && (
              <p className="hawker-hero-info">
                <strong>Stalls:</strong> {hawkerCentre.no_of_cooked_food_stalls} cooked food stalls
              </p>
            )}
            {hawkerCentre.status && (
              <p className="hawker-hero-info">
                <strong>Status:</strong> {hawkerCentre.status}
              </p>
            )}
          </div>
        )}
      </div>
    </div>

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
              backgroundColor: "#ffffff",
              color: "#111827",
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
          {currentStalls.map((stall) => (
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

        {/* Pagination Controls */}
        {!loading && !error && filteredStalls.length > itemsPerPage && (
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

export default HawkerPage;
