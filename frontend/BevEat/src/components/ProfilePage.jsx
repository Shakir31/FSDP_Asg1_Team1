import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Coins, Star, ShoppingBag } from "lucide-react";
import "../ProfilePage.css";

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
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const getToken = () => {
      return localStorage.getItem("token") || sessionStorage.getItem("token");
    };

    const fetchData = async () => {
      const token = getToken();

      if (!token) {
        alert("Please log in to view your profile.");
        navigate("/login");
        return;
      }

      try {
        setLoading(true);

        const [
          profileResponse,
          coinsResponse,
          reviewsResponse,
          ordersResponse,
        ] = await Promise.all([
          fetch("http://localhost:3000/users/profile", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:3000/coins/balance", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:3000/reviews/user", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:3000/orders/history", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (profileResponse.status === 401 || profileResponse.status === 403) {
          throw new Error("Session expired");
        }

        if (!profileResponse.ok) throw new Error("Failed to fetch profile");
        if (!coinsResponse.ok) throw new Error("Failed to fetch coins");
        if (!reviewsResponse.ok) throw new Error("Failed to fetch reviews");
        if (!ordersResponse.ok) throw new Error("Failed to fetch orders");

        const profileData = await profileResponse.json();
        const coinsData = await coinsResponse.json();
        const reviewsData = await reviewsResponse.json();
        const ordersData = await ordersResponse.json();

        setUser(profileData);
        setCoins(coinsData.coins);
        setReviews(reviewsData);
        setOrders(ordersData);
      } catch (err) {
        console.error("Profile Error:", err);
        if (
          err.message === "Session expired" ||
          err.message === "Failed to fetch profile"
        ) {
          alert("Your session has expired. Please log in again.");
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

  // Helper function to get status class
  const getStatusClass = (status) => {
    if (status === "Completed") return "status-completed";
    if (status === "Pending") return "status-pending";
    return "status-default";
  };

  if (loading)
    return (
      <div className="profile-wrapper">
        <p>Loading profile...</p>
      </div>
    );
  if (error)
    return (
      <div className="profile-wrapper">
        <p>Error: {error}</p>
      </div>
    );
  if (!user) return null;

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

      {/* Orders Section */}
      <div className="profile-reviews-container profile-section">
        <div className="profile-section-title section-header-content">
          <ShoppingBag size={20} />
          <span>My Orders</span>
        </div>

        {orders.length > 0 ? (
          <div className="review-list">
            {orders.map((order) => (
              <div key={order.OrderID} className="review-card">
                <div className="review-card-header">
                  <span className="review-item-name">
                    Order #{order.OrderID}
                  </span>
                  <span className="review-date">
                    {new Date(order.OrderDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="review-card-body">
                  {/* 1. Status */}
                  <div className="order-row">
                    <span className="order-label">Status:</span>
                    <span
                      className={`status-text ${getStatusClass(
                        order.OrderStatus
                      )}`}
                    >
                      {order.OrderStatus}
                    </span>
                  </div>

                  {/* 3. Total */}
                  <div className="order-row">
                    <span className="order-label">Total:</span>
                    <span className="order-total-price">
                      ${order.TotalAmount.toFixed(2)}
                    </span>
                  </div>

                  {/* 4. Payment */}
                  <div className="order-row payment-row">
                    <span className="order-label">Payment:</span>
                    <span className="payment-text">{order.PaymentStatus}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-message">No orders yet.</p>
        )}
      </div>

      {/* Reviews Section */}
      <div className="profile-reviews-container">
        <div className="profile-section-title section-header-content">
          <h3 className="profile-section-title">My Reviews</h3>
          <button
            className="btn btn-orange"
            style={{ marginLeft: "auto" }}
            onClick={() => navigate("/upload")}
          >
            Add Review
          </button>
        </div>
        {reviews.length > 0 ? (
          <div className="review-list">
            {reviews.map((review) => (
              <div key={review.ReviewID} className="review-card">
                <div className="review-card-header">
                  <span className="review-item-name">
                    {review.MenuItemName}
                  </span>
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
          <p className="empty-message">No reviews made</p>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;
