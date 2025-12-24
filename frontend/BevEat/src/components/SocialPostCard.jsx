import React from "react";
import { ThumbsUp, Star } from "lucide-react";
import "../SocialPostCard.css";

function SocialPostCard({ image, onUpvote }) {
  // Format timestamp to relative time
  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const uploadDate = new Date(timestamp);
    const seconds = Math.floor((now - uploadDate) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return uploadDate.toLocaleDateString();
  };

  // Render star rating (1-5)
  const renderStars = (rating) => {
    const stars = [];
    const ratingValue = rating || 0;

    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={16}
          fill={i <= ratingValue ? "#ff7622" : "none"}
          stroke={i <= ratingValue ? "#ff7622" : "#ddd"}
          strokeWidth={2}
        />
      );
    }

    return <div className="star-rating">{stars}</div>;
  };

  return (
    <div className="social-post">
      {/* Post Header */}
      <div className="post-header">
        <div className="user-avatar">
          {image.username.charAt(0).toUpperCase()}
        </div>
        <div className="post-user-info">
          <div className="post-username">{image.username}</div>
          <div className="post-time">{formatTimeAgo(image.uploadedat)}</div>
        </div>
        {/* Rating on top right */}
        <div className="post-rating">{renderStars(image.rating)}</div>
      </div>

      {/* Post Image */}
      <div className="post-image-container">
        <img
          src={image.imageurl}
          alt={image.menuitemname || "Food Photo"}
          className="post-image"
        />
      </div>

      {/* Post Actions */}
      <div className="post-actions">
        <button
          onClick={() => onUpvote(image.imageid, image.user_has_upvoted)}
          className={`upvote-btn ${image.user_has_upvoted ? "upvoted" : ""}`}
        >
          <ThumbsUp
            size={20}
            fill={image.user_has_upvoted ? "#ff7622" : "none"}
          />
          <span>{image.upvote_count}</span>
        </button>
      </div>

      {/* Post Content */}
      <div className="post-content">
        <div className="post-menu-item">
          <strong>{image.username}</strong> ordered{" "}
          <strong>{image.menuitemname}</strong>
        </div>
        {image.reviewtext && (
          <div className="post-review">
            <em>"{image.reviewtext}"</em>
          </div>
        )}
      </div>
    </div>
  );
}

export default SocialPostCard;
