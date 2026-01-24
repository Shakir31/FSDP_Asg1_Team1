import React, { useState, useEffect } from "react";
import { ThumbsUp, Star } from "lucide-react";
import "../SocialPostCard.css";
import EmojiReactionPicker from "./EmojiReactionPicker";
import ReactionBar from "./ReactionBar";
import { toast } from "react-toastify";

// Helper function to get token from either storage
function getToken() {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}

function SocialPostCard({ image, onUpvote }) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [pickerPosition, setPickerPosition] = useState({ x: 0, y: 0 });
  const [reactions, setReactions] = useState({});
  const [userReactions, setUserReactions] = useState([]);
  const [touchTimer, setTouchTimer] = useState(null);
  const [reviewId, setReviewId] = useState(null);

  // Get reviewId from imageId
  useEffect(() => {
    const getReviewId = async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/images/${image.imageid}/reviewid`,
        );
        const data = await response.json();
        setReviewId(data.reviewid);
      } catch (error) {
        console.error("Error getting reviewId:", error);
      }
    };

    if (image.imageid) {
      getReviewId();
    }
  }, [image.imageid]);

  // Fetch reactions when reviewId is available
  useEffect(() => {
    if (reviewId) {
      fetchReactions();
    }
  }, [reviewId]);

  const fetchReactions = async () => {
    if (!reviewId) return;

    const token = getToken();

    try {
      const headers = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(
        `http://localhost:3000/reviews/${reviewId}/reactions`,
        { headers },
      );
      const data = await response.json();

      setReactions(data.reactions || {});
      setUserReactions(data.userReactions || []);
    } catch (error) {
      console.error("Error fetching reactions:", error);
    }
  };

  const handleRightClick = (e) => {
    e.preventDefault();

    const token = getToken();

    if (!token) {
      toast.warning("Please log in to react");
      return;
    }

    if (!reviewId) {
      toast.info("No review to react to");
      return;
    }

    setPickerPosition({ x: e.clientX, y: e.clientY });
    setShowEmojiPicker(true);
  };

  const handleReact = async (emoji) => {
    const token = getToken();

    if (!token) {
      toast.warning("Please log in to react");
      return;
    }

    if (!reviewId) {
      toast.info("No review to react to");
      return;
    }

    try {
      // Optimistic update
      const isCurrentlyReacted = userReactions.includes(emoji);
      const newUserReactions = isCurrentlyReacted
        ? userReactions.filter((e) => e !== emoji)
        : [...userReactions, emoji];

      const newReactions = { ...reactions };
      if (isCurrentlyReacted) {
        newReactions[emoji] = (newReactions[emoji] || 1) - 1;
        if (newReactions[emoji] <= 0) delete newReactions[emoji];
      } else {
        newReactions[emoji] = (newReactions[emoji] || 0) + 1;
      }

      setUserReactions(newUserReactions);
      setReactions(newReactions);
      setShowEmojiPicker(false);

      // Send to backend
      const response = await fetch(
        `http://localhost:3000/reviews/${reviewId}/react`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ emoji }),
        },
      );

      if (!response.ok) throw new Error("Failed to react");

      const data = await response.json();

      // Update with server response
      setReactions(data.reactions);
      setUserReactions(data.userReactions);
    } catch (error) {
      console.error("Error reacting:", error);
      toast.error("Failed to add reaction");
      // Revert optimistic update
      fetchReactions();
    }
  };

  // Mobile long-press support
  const handleTouchStart = (e) => {
    const token = getToken();

    if (!token || !reviewId) return;

    const timer = setTimeout(() => {
      const touch = e.touches[0];
      setPickerPosition({ x: touch.clientX, y: touch.clientY });
      setShowEmojiPicker(true);
    }, 500); // 500ms long press

    setTouchTimer(timer);
  };

  const handleTouchEnd = () => {
    if (touchTimer) {
      clearTimeout(touchTimer);
      setTouchTimer(null);
    }
  };

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
        />,
      );
    }

    return <div className="star-rating">{stars}</div>;
  };

  return (
    <div
      className="social-post"
      onContextMenu={handleRightClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
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

      {/* Post Actions - Upvote + Reactions on same line */}
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

        {/* Reaction Bar inline */}
        {reviewId && (
          <ReactionBar
            reactions={reactions}
            userReactions={userReactions}
            onReact={handleReact}
          />
        )}
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

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <EmojiReactionPicker
          position={pickerPosition}
          onReact={handleReact}
          onClose={() => setShowEmojiPicker(false)}
        />
      )}
    </div>
  );
}

export default SocialPostCard;
