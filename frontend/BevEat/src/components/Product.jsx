import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCart } from "./Cartcontext";
import { useGroupOrder } from "./GroupOrderContext";
import { toast } from "react-toastify";
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

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 5; // Adjust this number as needed

  const navigate = useNavigate();
  const { addItem } = useCart();
  const { session, addItemToGroup } = useGroupOrder();

  async function handleUpvote(imageId, currentlyUpvoted) {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      toast.warning("Please log in to upvote.");
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
        toast.error(data.error || "Failed to upvote");
      }
    } catch (err) {
      toast.error("Error: " + err.message);
    }
  }

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setReviewsLoading(true);
        setError(null);
        setReviewsError(null);
        setCurrentPage(1); // Reset to first page when item changes

        const token =
          localStorage.getItem("token") || sessionStorage.getItem("token");

        const headers = {
          "Content-Type": "application/json",
        };

        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const itemResponse = await fetch(
          `http://localhost:3000/menu-item/${itemId}`
        );
        if (!itemResponse.ok) {
          throw new Error("Menu item not found");
        }
        const itemData = await itemResponse.json();
        setItem(itemData);

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

    if (session) {
      addItemToGroup(item.menuitemid, 1);
      toast.success(`${item.name} added to group order!`, {
        position: "bottom-right",
        autoClose: 2000,
      });
      return;
    }
    
    const cartItem = {
      id: item.menuitemid,
      name: item.name,
      price: parseFloat(item.price),
      desc: item.description || "",
      image: item.mainimageurl,
    };

    addItem(cartItem);
    toast.success(`${item.name} added to cart!`, {
      position: "bottom-right",
      autoClose: 2000,
    });
  };

  // Pagination Logic
  const indexOfLastReview = currentPage * reviewsPerPage;
  const indexOfFirstReview = indexOfLastReview - reviewsPerPage;
  const currentReviews = reviews.slice(indexOfFirstReview, indexOfLastReview);
  const totalPages = Math.ceil(reviews.length / reviewsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

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
      <>
        <div className="social-feed">
          {currentReviews.map((review) => (
            <SocialPostCard
              key={review.reviewid}
              image={review}
              onUpvote={handleUpvote}
            />
          ))}
        </div>
        
        {/* Pagination Controls */}
        {reviews.length > reviewsPerPage && (
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
    <div className="product-wrapper">
      <div className="product-content-main">
        <div className="product-layout">
          <div className="back-button-container">
            <button onClick={() => navigate(`/stalls/${item.stallid}`)} className="back-button">
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