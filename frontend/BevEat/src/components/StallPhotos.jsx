import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import SocialPostCard from "./SocialPostCard";
import "../StallPhotos.css";

// Helper function to get token from either storage
function getToken() {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}

function StallPhotos() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [stallName, setStallName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // Photos take more space, so 6 is a good number

  async function handleUpvote(imageId, currentlyUpvoted) {
    const token = getToken();

    if (!token) {
      toast.warning("You must be logged in to upvote images.");
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/images/upvote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ imageId }),
      });

      if (res.status === 403 || res.status === 401) {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        toast.error("Session expired. Please log in again.");
        navigate("/login");
        return;
      }

      const data = await res.json();

      if (res.ok) {
        setImages((prevImages) =>
          prevImages.map((img) =>
            img.imageid === imageId
              ? {
                  ...img,
                  user_has_upvoted: data.upvoted,
                  upvote_count: data.upvoted
                    ? img.upvote_count + 1
                    : img.upvote_count - 1,
                }
              : img,
          ),
        );
      } else {
        toast.error(data.error || "Action failed.");
      }
    } catch (err) {
      toast.error("Error: " + err.message);
    }
  }

  useEffect(() => {
    async function fetchStallImages() {
      try {
        setLoading(true);
        setCurrentPage(1); // Reset page on stall change
        const token = getToken();

        const headers = {
          "Content-Type": "application/json",
        };

        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const [photoResponse, stallResponse] = await Promise.all([
          fetch(`http://localhost:3000/stalls/${id}/photos`, { headers }),
          fetch(`http://localhost:3000/stalls/${id}`),
        ]);

        if (!photoResponse.ok || !stallResponse.ok) {
          throw new Error("Could not fetch stall photos or stall details.");
        }

        const photoData = await photoResponse.json();
        const stallData = await stallResponse.json();
        setImages(photoData);
        setStallName(stallData.stallname);
      } catch (err) {
        setError(err.message);
        toast.error("Failed to load stall photos");
      } finally {
        setLoading(false);
      }
    }

    fetchStallImages();
  }, [id]);

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentImages = images.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(images.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  let content;
  if (loading) {
    content = <p className="loading-text">Loading photos...</p>;
  } else if (error) {
    content = <p className="error-text">Error: {error}</p>;
  } else if (images.length === 0) {
    content = (
      <p className="no-photos-text">
        No photos have been uploaded for this stall yet.
      </p>
    );
  } else {
    content = (
      <>
        <div className="social-feed">
          {currentImages.map((image) => (
            <SocialPostCard
              key={image.imageid}
              image={image}
              onUpvote={handleUpvote}
            />
          ))}
        </div>

        {/* Pagination Controls */}
        {images.length > itemsPerPage && (
          <div className="pagination" style={{marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '8px'}}>
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => paginate(i + 1)}
                className={currentPage === i + 1 ? "active" : ""}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="photo-page-wrapper">
      <div className="photo-page-container">
        <div className="photo-header">
          <button
            onClick={() => navigate(`/stalls/${id}`)}
            className="back-button"
          >
            &larr; Back to Stall
          </button>
          <h1 className="photo-title">
            {stallName ? `${stallName} - Photos` : "Photos"}
          </h1>
        </div>
        {content}
      </div>
    </div>
  );
}

export default StallPhotos;