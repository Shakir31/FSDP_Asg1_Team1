import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; 
import { useCart } from './Cartcontext';
import { Star } from 'lucide-react'; // Added Star import
import { ThumbsUp } from 'lucide-react'; // Added ThumbsUp import
import '../Product.css';
import hero from '../assets/hero.png'; 

// Helper component for star ratings (reused logic from ProfilePage)
const StarRating = ({ rating }) => {
  return (
    <div className="star-rating">
      {[...Array(5)].map((_, index) => (
        <Star
          key={index}
          size={16}
          color={index < rating ? "#ffc107" : "#e0e0e0"}
          fill={index < rating ? "#ffc107" : "none"}
        />
      ))}
    </div>
  );
};

function Product() {
  const { itemId } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviews, setReviews] = useState([]); // New state for reviews
  const [reviewsLoading, setReviewsLoading] = useState(true); // New state for reviews loading
  const [reviewsError, setReviewsError] = useState(null); // New state for reviews error
  
  async function handleUpvote(imageId) {
    const token = localStorage.getItem('token') || sessionStorage.getItem("token");
    if (!token) {
        alert("Please log in to upvote.");
        return;
    }
    try {
        const res = await fetch('http://localhost:3000/images/upvote', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ imageId })
        });
        const data = await res.json();
        if (res.ok) {
            alert("Upvoted!");
        } else {
            alert(data.error || "Failed to upvote");
        }
    } catch (err) {
        alert("Error: " + err.message);
    }
  }
  
  // 2. This line will now work because it's imported
  const navigate = useNavigate(); 
  const { addItem } = useCart();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setReviewsLoading(true);
        setError(null);
        setReviewsError(null);

        // Fetch menu item data
        const itemResponse = await fetch(`http://localhost:3000/menu-item/${itemId}`);
        if (!itemResponse.ok) {
          throw new Error('Menu item not found');
        }
        const itemData = await itemResponse.json();
        setItem(itemData);

        // Fetch reviews for the menu item
        const reviewsResponse = await fetch(`http://localhost:3000/reviews/menuitem/${itemId}`); // API endpoint
        if (!reviewsResponse.ok) {
          throw new Error('Failed to fetch reviews');
        }
        const reviewsData = await reviewsResponse.json();
        setReviews(reviewsData);

      } catch (err) {
        // Set main error only if fetching item failed, otherwise set reviews error
        if (item === null) {
            setError(err.message);
        } else if (err.message.includes('reviews')) {
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
      id: item.MenuItemID,
      name: item.Name,
      price: parseFloat(item.Price),
      desc: item.Description || '',
      image : item.MainImageURL,
    };

    addItem(cartItem);
    alert(`${item.Name} added to cart!`);
  };

  if (loading) {
    return <div className="product-wrapper"><p>Loading...</p></div>;
  }

  if (error) {
    return <div className="product-wrapper"><p>Error: {error}</p></div>;
  }

  if (!item) {
    return <div className="product-wrapper"><p>Item not found.</p></div>;
  }

  // Review Section Content logic
  let reviewsContent;
  if (reviewsLoading) {
    reviewsContent = <p>Loading reviews...</p>;
  } else if (reviewsError) {
    reviewsContent = <p className="review-error">Error loading reviews: {reviewsError}</p>;
  } else if (reviews.length === 0) {
    reviewsContent = <p className="review-empty">No reviews have been posted for this item yet.</p>;
  } else {
    reviewsContent = (
        <div className="review-list-container">
            {reviews.map((review) => (
              <div key={review.ReviewID} className="review-card">
                <div className="review-card-header">
                    <StarRating rating={review.Rating} />
                </div>
                <div className="review-card-body">
                    <p className="review-text">{review.ReviewText}</p>
                    {review.ImageURL && (
                      <img
                        src={review.ImageURL}
                        alt="User review"
                        className="review-card-image"
                      />
                    )}
                    <button
                      onClick={() => handleUpvote(review.ReviewID)}
                      className="upvote-button"
                    >
                      <ThumbsUp size={18} />
                    </button>
                </div>
              </div>
            ))}
        </div>
    );
  }

  return (
    <div className="product-wrapper">
      <div className="product-content-main"> {/* New wrapper to manage page width */}
        <div className="product-layout"> 
          
          <div className="back-button-container">
              <button onClick={() => navigate(-1)} className="back-button">
                  &larr; Back to Stall
              </button>
          </div>

          <div className="product-image-frame">
            <img 
              src={item.MainImageURL || hero} 
              alt={item.Name} 
              className="product-image"
            />
          </div>

          <div className="product-info">
              <h1 className="product-name">{item.Name}</h1>
              <p className="product-price">${parseFloat(item.Price).toFixed(2)}</p>
              <p className="product-description">{item.Description}</p>
              <button className="add-to-cart-button" onClick={handleAddToCart}>
                  Add to Cart
              </button>
          </div>
        </div>
        
        {/* NEW: Reviews Section */}
        <section className="product-reviews-section">
            <h2 className="reviews-title">Customer Reviews</h2>
            {reviewsContent}
        </section>
      </div>
    </div>
  );
}

export default Product;