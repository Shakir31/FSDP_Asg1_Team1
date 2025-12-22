import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ThumbsUp } from "lucide-react";
import "../StallPhotos.css";

function StallPhotos() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [stallName, setStallName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function handleUpvote(imageId) {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You must be logged in to upvote images.");
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
        alert("Upvoted successfully!");
      } else {
        alert(data.error || "Upvote failed.");
      }
    } catch (err) {
      alert("Error upvoting image: " + err.message);
    }
  }
  useEffect(() => {
    async function fetchStallImages() {
      try {
        setLoading(true);
        const [photoResponse, stallResponse] = await Promise.all([
          fetch(`http://localhost:3000/stalls/${id}/photos`),
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
      } finally {
        setLoading(false);
      }
    }

    fetchStallImages();
  }, [id]);

  let content;
  if (loading) {
    content = <p>Loading photos...</p>;
  } else if (error) {
    content = <p>Error: {error}</p>;
  } else if (images.length === 0) {
    content = <p>No photos have been uploaded for this stall yet.</p>;
  } else {
    content = (
      <div className="photo-grid">
        {images.map((image) => (
          <div key={image.imageid} className="photo-card">
            <img
              src={image.imageurl}
              alt={image.menuitemname || "Stall Photo"}
              className="photo-img"
            />
            <p className="photo-caption">For: {image.menuitemname}</p>
            <button
              onClick={() => handleUpvote(image.imageid)}
              className="upvote-button"
            >
              <ThumbsUp size={18} />
            </button>
          </div>
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
