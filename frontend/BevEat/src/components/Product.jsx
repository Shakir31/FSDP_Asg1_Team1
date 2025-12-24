import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCart } from "./Cartcontext";
import SocialPostCard from "./SocialPostCard";
import "../Product.css";
import hero from "../assets/hero.png";

function Product() {
  const { itemId } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState(null);

  const navigate = useNavigate();
  const { addItem } = useCart();

  async function handleUpvote(imageId, currentlyUpvoted) {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      alert("Please log in to upvote.");
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
        setReviews((prevReviews) =>
          prevReviews.map((review) =>
            review.imageid === imageId
              ? {
                  ...review,
                  user_has_upvoted: data.upvoted,
                  upvote_count: data.upvoted
                    ? review.upvote_count + 1
                    : review.upvote_count - 1,
                }
              : review
          )
        );
      } else {
        alert(data.error || "Failed to upvote");
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  }

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setReviewsLoading(true);
        setError(null);
        setReviewsError(null);

        const token =
          localStorage.getItem("token") || sessionStorage.getItem("token");

        const headers = {
          "Content-Type": "application/json",
        };

        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        // Fetch menu item data
        const itemResponse = await fetch(
          `http://localhost:3000/menu-item/${itemId}`
        );
        if (!itemResponse.ok) {
          throw new Error("Menu item not found");
        }
        const itemData = await itemResponse.json();
        setItem(itemData);

        // Fetch reviews for the menu item
        const reviewsResponse = await fetch(
          `http://localhost:3000/reviews/menuitem/${itemId}`,
          { headers }
        );
        if (!reviewsResponse.ok) {
          throw new Error("Failed to fetch reviews");
        }
        const reviewsData = await reviewsResponse.json();
        setReviews(reviewsData);
      } catch (err) {
        if (item === null) {
          setError(err.message);
        } else if (err.message.includes("reviews")) {
          setReviewsError(err.message);
        }
      } finally {
        setLoading(false);
        setReviewsLoading(false);
      }
    }

    fetchData();
  }, [itemId]);

  const handleAddToCart = () => {
    if (!item) return;

    const cartItem = {
      id: item.menuitemid,
      name: item.name,
      price: parseFloat(item.price),
      desc: item.description || "",
      image: item.mainimageurl,
    };

    addItem(cartItem);
    alert(`${item.name} added to cart!`);
  };

  if (loading) {
    return (
      <div className="product-wrapper">
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-wrapper">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="product-wrapper">
        <p>Item not found.</p>
      </div>
    );
  }

  // Review Section Content
  let reviewsContent;
  if (reviewsLoading) {
    reviewsContent = <p>Loading reviews...</p>;
  } else if (reviewsError) {
    reviewsContent = (
      <p className="review-error">Error loading reviews: {reviewsError}</p>
    );
  } else if (reviews.length === 0) {
    reviewsContent = (
      <p className="review-empty">
        No reviews have been posted for this item yet.
      </p>
    );
  } else {
    reviewsContent = (
      <div className="social-feed">
        {reviews.map((review) => (
          <SocialPostCard
            key={review.reviewid}
            image={review}
            onUpvote={handleUpvote}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="product-wrapper">
      <div className="product-content-main">
        <div className="product-layout">
          <div className="back-button-container">
            <button onClick={() => navigate(-1)} className="back-button">
              &larr; Back to Stall
            </button>
          </div>

          <div className="product-image-frame">
            <img
              src={item.mainimageurl || hero}
              alt={item.name}
              className="product-image"
            />
          </div>

          <div className="product-info">
            <h1 className="product-name">{item.name}</h1>
            <p className="product-price">
              ${parseFloat(item.price).toFixed(2)}
            </p>
            <p className="product-description">{item.description}</p>
            <button className="add-to-cart-button" onClick={handleAddToCart}>
              Add to Cart
            </button>
          </div>
        </div>

        {/* Reviews Section with Social Media Style */}
        <section className="product-reviews-section">
          <h2 className="reviews-title">Customer Reviews</h2>
          {reviewsContent}
        </section>
      </div>
    </div>
  );
}

export default Product;
