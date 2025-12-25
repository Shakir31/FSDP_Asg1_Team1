import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Coins, Star, ShoppingBag, Store, Bell } from "lucide-react";
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
  const [stalls, setStalls] = useState([]);
  const [notificationStats, setNotificationStats] = useState(null);
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

        // Fetch profile first to check role
        const profileResponse = await fetch(
          "http://localhost:3000/users/profile",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (profileResponse.status === 401 || profileResponse.status === 403) {
          throw new Error("Session expired");
        }

        if (!profileResponse.ok) throw new Error("Failed to fetch profile");

        const profileData = await profileResponse.json();
        setUser(profileData);

        // Fetch different data based on role
        if (profileData.role === "stall_owner") {
          // Fetch stall owner specific data
          const [coinsResponse, stallsResponse, notifStatsResponse] =
            await Promise.all([
              fetch("http://localhost:3000/coins/balance", {
                headers: { Authorization: `Bearer ${token}` },
              }),
              fetch("http://localhost:3000/stalls", {
                headers: { Authorization: `Bearer ${token}` },
              }),
              fetch("http://localhost:3000/notifications/stats", {
                headers: { Authorization: `Bearer ${token}` },
              }),
            ]);

          if (!coinsResponse.ok) throw new Error("Failed to fetch coins");

          const coinsData = await coinsResponse.json();
          setCoins(coinsData.coins);

          // Get stalls owned by this user
          if (stallsResponse.ok) {
            const allStalls = await stallsResponse.json();
            const myStalls = allStalls.filter(
              (stall) => stall.owner_id === profileData.userid
            );
            setStalls(myStalls);
          }

          // Get notification stats
          if (notifStatsResponse.ok) {
            const notifData = await notifStatsResponse.json();
            setNotificationStats(notifData);
          }
        } else {
          // Fetch regular user data
          const [coinsResponse, reviewsResponse, ordersResponse] =
            await Promise.all([
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

          if (!coinsResponse.ok) throw new Error("Failed to fetch coins");
          if (!reviewsResponse.ok) throw new Error("Failed to fetch reviews");
          if (!ordersResponse.ok) throw new Error("Failed to fetch orders");

          const coinsData = await coinsResponse.json();
          const reviewsData = await reviewsResponse.json();
          const ordersData = await ordersResponse.json();

          setCoins(coinsData.coins);
          setReviews(reviewsData);
          setOrders(ordersData);
        }
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

  // Render for Stall Owners
  if (user.role === "stall_owner") {
    return (
      <div className="profile-wrapper">
        <div className="profile-container">
          <div className="profile-picture-container">
            <User size={80} color="#121223" />
          </div>
          <h2 className="profile-name">{user.name}</h2>
          <div className="profile-role-badge">Stall Owner</div>
          <div className="profile-coins">
            <Coins size={24} color="#ff7622" />
            <span>{coins} Coins</span>
          </div>
        </div>

        {/* Notifications Section */}
        {notificationStats && (
          <div className="profile-reviews-container profile-section">
            <div className="profile-section-title section-header-content">
              <Bell size={20} />
              <span>Photo Suggestions</span>
            </div>
            <div className="stall-owner-stats">
              <div className="stat-box">
                <div className="stat-number">{notificationStats.pending}</div>
                <div className="stat-label">Pending</div>
              </div>
              <div className="stat-box">
                <div className="stat-number">{notificationStats.approved}</div>
                <div className="stat-label">Approved</div>
              </div>
              <div className="stat-box">
                <div className="stat-number">{notificationStats.dismissed}</div>
                <div className="stat-label">Dismissed</div>
              </div>
            </div>
            <button
              className="btn btn-orange"
              style={{ marginTop: "16px", width: "100%" }}
              onClick={() => navigate("/dashboard")}
            >
              View Dashboard
            </button>
          </div>
        )}

        {/* My Stalls Section */}
        <div className="profile-reviews-container profile-section">
          <div className="profile-section-title section-header-content">
            <Store size={20} />
            <span>My Stalls ({stalls.length})</span>
          </div>

          {stalls.length > 0 ? (
            <div className="review-list">
              {stalls.map((stall) => (
                <div key={stall.stallid} className="review-card">
                  <div className="review-card-header">
                    <span className="review-item-name">{stall.stallname}</span>
                    <span className="review-date">{stall.category}</span>
                  </div>
                  <div className="review-card-body">
                    <p className="review-text">{stall.description}</p>
                    <button
                      className="btn btn-orange"
                      style={{ marginTop: "12px" }}
                      onClick={() => navigate(`/stalls/${stall.stallid}`)}
                    >
                      View Stall
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-message">No stalls assigned yet.</p>
          )}
        </div>
      </div>
    );
  }

  // Render for Regular Users
  return (
    <div className="profile-wrapper">
      <div className="profile-container">
        <div className="profile-picture-container">
          <User size={80} color="#121223" />
        </div>
        <h2 className="profile-name">{user.name}</h2>
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
              <div key={order.orderid} className="review-card">
                <div className="review-card-header">
                  <span className="review-item-name">
                    Order #{order.orderid}
                  </span>
                  <span className="review-date">
                    {new Date(order.orderdate).toLocaleDateString()}
                  </span>
                </div>
                <div className="review-card-body">
                  {/* 1. Status */}
                  <div className="order-row">
                    <span className="order-label">Status:</span>
                    <span
                      className={`status-text ${getStatusClass(
                        order.orderstatus
                      )}`}
                    >
                      {order.orderstatus}
                    </span>
                  </div>

                  {/* 3. Total */}
                  <div className="order-row">
                    <span className="order-label">Total:</span>
                    <span className="order-total-price">
                      ${order.totalamount.toFixed(2)}
                    </span>
                  </div>

                  {/* 4. Payment */}
                  <div className="order-row payment-row">
                    <span className="order-label">Payment:</span>
                    <span className="payment-text">{order.paymentstatus}</span>
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
              <div key={review.reviewid} className="review-card">
                <div className="review-card-header">
                  <span className="review-item-name">
                    {review.menuitemname}
                  </span>
                  <span className="review-date">
                    {new Date(review.createdat).toLocaleDateString()}
                  </span>
                </div>
                <div className="review-card-body">
                  <StarRating rating={review.rating} />
                  <p className="review-text">{review.reviewtext}</p>
                  {review.imageurl && (
                    <img
                      src={review.imageurl}
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
