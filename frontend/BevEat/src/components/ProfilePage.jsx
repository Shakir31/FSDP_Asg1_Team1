import React, { useState, useEffect } from 'react';
import { User, Coins, Star } from 'lucide-react'; // <-- 1. Import Star icon
import '../ProfilePage.css';

// Helper component for star ratings
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

function ProfilePage() {
  const [user, setUser] = useState(null);
  const [coins, setCoins] = useState(0);
  const [reviews, setReviews] = useState([]); // <-- 2. Add state for reviews
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getToken = () => {
      return localStorage.getItem("token") || sessionStorage.getItem("token");
    };

    const fetchData = async () => {
      const token = getToken();
      if (!token) {
        setError("You are not logged in.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // 3. Add the new reviews fetch to the Promise.all
        const [profileResponse, coinsResponse, reviewsResponse] = await Promise.all([
          fetch("http://localhost:3000/users/profile", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:3000/coins/balance", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          // New fetch for user's reviews
          fetch("http://localhost:3000/reviews/user", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!profileResponse.ok) {
          throw new Error("Failed to fetch profile");
        }
        const profileData = await profileResponse.json();
        setUser(profileData);

        if (!coinsResponse.ok) {
          throw new Error("Failed to fetch coins");
        }
        const coinsData = await coinsResponse.json();
        setCoins(coinsData.coins);

        // 4. Set the reviews state
        if (!reviewsResponse.ok) {
          throw new Error("Failed to fetch reviews");
        }
        const reviewsData = await reviewsResponse.json();
        setReviews(reviewsData);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="profile-wrapper"><p>Loading profile...</p></div>;
  }

  if (error) {
    return <div className="profile-wrapper"><p>Error: {error}</p></div>;
  }

  if (!user) {
    return <div className="profile-wrapper"><p>Please log in to see your profile.</p></div>;
  }

  // 5. Add the JSX to render the reviews
  return (
    <div className="profile-wrapper">
      <div className="profile-container">
        <div className="profile-picture-container">
          <User size={80} color="#121223" />
        </div>
        <h2 className="profile-name">{user.Name}</h2>
        <div className="profile-coins">
          <Coins size={24} color="#ff7622" />
          <span>{coins} Coins</span>
        </div>
      </div>

      {/* --- NEW REVIEWS SECTION --- */}
      <div className="profile-reviews-container">
        <h3 className="profile-section-title">My Reviews</h3>
        {reviews.length > 0 ? (
          <div className="review-list">
            {reviews.map((review) => (
              <div key={review.ReviewID} className="review-card">
                <div className="review-card-header">
                  <span className="review-item-name">{review.MenuItemName}</span>
                  <span className="review-date">
                    {new Date(review.CreatedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="review-card-body">
                  <StarRating rating={review.Rating} />
                  <p className="review-text">{review.ReviewText}</p>
                  {review.ImageURL && (
                    <img 
                      src={review.ImageURL} 
                      alt="User review" 
                      className="review-card-image"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "black" }}>No reviews made</p>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;