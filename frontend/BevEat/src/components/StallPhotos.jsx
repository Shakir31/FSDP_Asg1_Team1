import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import SocialPostCard from "./SocialPostCard";
import "../StallPhotos.css";

function StallPhotos() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [stallName, setStallName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function handleUpvote(imageId, currentlyUpvoted) {
    const token = localStorage.getItem("token");
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
      const data = await res.json();

      if (res.ok) {
        // Update the local state to reflect the upvote toggle
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
              : img
          )
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
        const token = localStorage.getItem("token");

        const headers = {
          "Content-Type": "application/json",
        };

        // Add auth token if available
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
      <div className="social-feed">
        {images.map((image) => (
          <SocialPostCard
            key={image.imageid}
            image={image}
            onUpvote={handleUpvote}
          />
        ))}
      </div>
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
