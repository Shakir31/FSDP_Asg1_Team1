import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // 1. Import useNavigate
import { User, Coins, Star } from 'lucide-react';
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
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate(); // 2. Initialize the hook

  useEffect(() => {
    const getToken = () => {
      return localStorage.getItem("token") || sessionStorage.getItem("token");
    };

    const fetchData = async () => {
      const token = getToken();

      // 1. Check if token exists locally
      if (!token) {
        alert("Please log in to view your profile.");
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        
        const [profileResponse, coinsResponse, reviewsResponse] = await Promise.all([
          fetch("http://localhost:3000/users/profile", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:3000/coins/balance", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:3000/reviews/user", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        // 2. Check if the token was actually valid (API returned 401 or 403)
        if (profileResponse.status === 401 || profileResponse.status === 403) {
            throw new Error("Session expired"); // Throw specific error
        }

        if (!profileResponse.ok) throw new Error("Failed to fetch profile");
        if (!coinsResponse.ok) throw new Error("Failed to fetch coins");
        if (!reviewsResponse.ok) throw new Error("Failed to fetch reviews");

        const profileData = await profileResponse.json();
        const coinsData = await coinsResponse.json();
        const reviewsData = await reviewsResponse.json();

        setUser(profileData);
        setCoins(coinsData.coins);
        setReviews(reviewsData);

      } catch (err) {
        console.error("Profile Error:", err);
        
        // 3. Handle Invalid/Expired Token Error
        if (err.message === "Session expired" || err.message === "Failed to fetch profile") {
            alert("Your session has expired. Please log in again.");
            // Clear invalid tokens so the loop doesn't repeat
            localStorage.removeItem("token");
            sessionStorage.removeItem("token");
            navigate("/login");
        } else {
            setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  if (loading) {
    return <div className="profile-wrapper"><p>Loading profile...</p></div>;
  }

  if (error) {
    return <div className="profile-wrapper"><p>Error: {error}</p></div>;
  }

  if (!user) {
    return null; // Don't render anything if redirecting
  }

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