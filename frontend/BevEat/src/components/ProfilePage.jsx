import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Coins,
  Star,
  ShoppingBag,
  Store,
  Bell,
  Shield,
  Users,
  TrendingUp,
} from "lucide-react";
import { toast } from "react-toastify";
import OrderDetailsModal from "./OrderDetailsModel";
import "../ProfilePage.css";

// Helper function to get token from either storage
function getToken() {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}

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
  const [adminStats, setAdminStats] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination State
  const [currentOrderPage, setCurrentOrderPage] = useState(1);
  const [currentReviewPage, setCurrentReviewPage] = useState(1);
  const [currentStallPage, setCurrentStallPage] = useState(1);
  const itemsPerPage = 6;

  const navigate = useNavigate();

  const refreshOrders = async () => {
    const token = getToken();

    if (!token) return;

    try {
      const ordersResponse = await fetch(
        "http://localhost:3000/orders/history",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (ordersResponse.status === 403 || ordersResponse.status === 401) {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        toast.error("Session expired. Please log in again.");
        navigate("/login");
        return;
      }

      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        ordersData.sort(
          (a, b) => new Date(b.orderdate) - new Date(a.orderdate),
        );
        setOrders(ordersData);
      }
    } catch (error) {
      console.error("Error refreshing orders:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const token = getToken();

      if (!token) {
        toast.warning("Please log in to view your profile.");
        navigate("/login");
        return;
      }

      try {
        setLoading(true);

        // Fetch profile first to check role
        const profileResponse = await fetch(
          "http://localhost:3000/users/profile",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (profileResponse.status === 401 || profileResponse.status === 403) {
          throw new Error("Session expired");
        }

        if (!profileResponse.ok) throw new Error("Failed to fetch profile");

        const profileData = await profileResponse.json();
        setUser(profileData);

        // Fetch different data based on role
        if (profileData.role === "admin") {
          // Fetch admin specific data
          const [coinsResponse, usersResponse, stallsResponse] =
            await Promise.all([
              fetch("http://localhost:3000/coins/balance", {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              }),
              fetch("http://localhost:3000/admin/users", {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              }),
              fetch("http://localhost:3000/admin/stalls", {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              }),
            ]);

          if (
            coinsResponse.status === 403 ||
            coinsResponse.status === 401 ||
            usersResponse.status === 403 ||
            usersResponse.status === 401 ||
            stallsResponse.status === 403 ||
            stallsResponse.status === 401
          ) {
            throw new Error("Session expired");
          }

          if (!coinsResponse.ok) throw new Error("Failed to fetch coins");

          const coinsData = await coinsResponse.json();
          setCoins(coinsData.coins);

          // Calculate admin stats
          if (usersResponse.ok && stallsResponse.ok) {
            const usersData = await usersResponse.json();
            const stallsData = await stallsResponse.json();

            setAdminStats({
              totalUsers: usersData.length,
              totalStalls: stallsData.length,
              stallOwners: usersData.filter((u) => u.role === "stall_owner")
                .length,
              regularUsers: usersData.filter(
                (u) => u.role === "user" || u.role === "customer",
              ).length,
            });
          }
        } else if (profileData.role === "stall_owner") {
          // Fetch stall owner specific data
          const [coinsResponse, stallsResponse, notifStatsResponse] =
            await Promise.all([
              fetch("http://localhost:3000/coins/balance", {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              }),
              fetch("http://localhost:3000/stalls", {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              }),
              fetch("http://localhost:3000/notifications/stats", {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              }),
            ]);

          if (
            coinsResponse.status === 403 ||
            coinsResponse.status === 401 ||
            stallsResponse.status === 403 ||
            stallsResponse.status === 401 ||
            notifStatsResponse.status === 403 ||
            notifStatsResponse.status === 401
          ) {
            throw new Error("Session expired");
          }

          if (!coinsResponse.ok) throw new Error("Failed to fetch coins");

          const coinsData = await coinsResponse.json();
          setCoins(coinsData.coins);

          // Get stalls owned by this user
          if (stallsResponse.ok) {
            const allStalls = await stallsResponse.json();
            const myStalls = allStalls.filter(
              (stall) => stall.owner_id === profileData.userid,
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
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              }),
              fetch("http://localhost:3000/reviews/user", {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              }),
              fetch("http://localhost:3000/orders/history", {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              }),
            ]);

          if (
            coinsResponse.status === 403 ||
            coinsResponse.status === 401 ||
            reviewsResponse.status === 403 ||
            reviewsResponse.status === 401 ||
            ordersResponse.status === 403 ||
            ordersResponse.status === 401
          ) {
            throw new Error("Session expired");
          }

          if (!coinsResponse.ok) throw new Error("Failed to fetch coins");
          if (!reviewsResponse.ok) throw new Error("Failed to fetch reviews");
          if (!ordersResponse.ok) throw new Error("Failed to fetch orders");

          const coinsData = await coinsResponse.json();
          const reviewsData = await reviewsResponse.json();
          // Sort reviews by date descending
          reviewsData.sort(
            (a, b) => new Date(b.createdat) - new Date(a.createdat),
          );

          const ordersData = await ordersResponse.json();
          // Sort orders by date descending
          ordersData.sort(
            (a, b) => new Date(b.orderdate) - new Date(a.orderdate),
          );

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
          toast.error("Your session has expired. Please log in again.");
          localStorage.removeItem("token");
          sessionStorage.removeItem("token");
          navigate("/login");
        } else {
          setError(err.message);
          toast.error("Error loading profile: " + err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  // --- Pagination Logic ---

  // 1. Orders
  const indexOfLastOrder = currentOrderPage * itemsPerPage;
  const indexOfFirstOrder = indexOfLastOrder - itemsPerPage;
  const currentOrders = orders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalOrderPages = Math.ceil(orders.length / itemsPerPage);

  // 2. Reviews
  const indexOfLastReview = currentReviewPage * itemsPerPage;
  const indexOfFirstReview = indexOfLastReview - itemsPerPage;
  const currentReviews = reviews.slice(indexOfFirstReview, indexOfLastReview);
  const totalReviewPages = Math.ceil(reviews.length / itemsPerPage);

  // 3. Stalls (for owners)
  const indexOfLastStall = currentStallPage * itemsPerPage;
  const indexOfFirstStall = indexOfLastStall - itemsPerPage;
  const currentStalls = stalls.slice(indexOfFirstStall, indexOfLastStall);
  const totalStallPages = Math.ceil(stalls.length / itemsPerPage);

  // Reusable Pagination Helper
  const getPageNumbers = (currentPage, totalPages) => {
    const pageNumbers = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pageNumbers.push(i);
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pageNumbers.push(1);
        pageNumbers.push("...");
        for (let i = totalPages - 4; i <= totalPages; i++) pageNumbers.push(i);
      } else {
        pageNumbers.push(1);
        pageNumbers.push("...");
        pageNumbers.push(currentPage - 1);
        pageNumbers.push(currentPage);
        pageNumbers.push(currentPage + 1);
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      }
    }
    return pageNumbers;
  };

  // Reusable Render Pagination Controls
  const renderPagination = (currentPage, totalPages, paginate) => {
    if (totalPages <= 1) return null;

    return (
      <div
        className="pagination"
        style={{
          marginTop: "20px",
          display: "flex",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        <button
          onClick={() => paginate(currentPage - 1)}
          disabled={currentPage === 1}
          style={{
            padding: "6px 10px",
            cursor: currentPage === 1 ? "not-allowed" : "pointer",
            border: "1px solid #ddd",
            borderRadius: "4px",
            backgroundColor: "#fff",
            fontSize: "0.9rem",
            color: "black",
          }}
        >
          Prev
        </button>

        {getPageNumbers(currentPage, totalPages).map((number, index) =>
          number === "..." ? (
            <span
              key={`ellipsis-${index}`}
              style={{
                padding: "6px 10px",
                alignSelf: "center",
                fontSize: "0.9rem",
              }}
            >
              ...
            </span>
          ) : (
            <button
              key={number}
              onClick={() => paginate(number)}
              style={{
                padding: "6px 10px",
                cursor: "pointer",
                backgroundColor: currentPage === number ? "#ff7622" : "#fff",
                color: currentPage === number ? "white" : "black",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "0.9rem",
              }}
            >
              {number}
            </button>
          ),
        )}

        <button
          onClick={() => paginate(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{
            padding: "6px 10px",
            cursor: currentPage === totalPages ? "not-allowed" : "pointer",
            border: "1px solid #ddd",
            borderRadius: "4px",
            backgroundColor: "#fff",
            fontSize: "0.9rem",
            color: "black",
          }}
        >
          Next
        </button>
      </div>
    );
  };

  // Open order details modal
  const openOrderDetails = async (order) => {
    setSelectedOrder(order);
    setLoadingOrderDetails(true);

    const token = getToken();

    if (!token) {
      toast.error("Please log in to view order details");
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3000/orders/${order.orderid}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.status === 403 || response.status === 401) {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        toast.error("Session expired. Please log in again.");
        navigate("/login");
        return;
      }

      if (!response.ok) throw new Error("Failed to fetch order details");

      const details = await response.json();
      setOrderDetails(details);
    } catch (err) {
      console.error("Error fetching order details:", err);
      toast.error("Failed to load order details");
      setSelectedOrder(null);
    } finally {
      setLoadingOrderDetails(false);
    }
  };

  // Close modal
  const closeOrderDetails = () => {
    setSelectedOrder(null);
    setOrderDetails(null);
  };

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

  // Render for Admins
  if (user.role === "admin") {
    return (
      <div className="profile-wrapper">
        <div className="profile-container">
          <div className="profile-picture-container admin-picture">
            <Shield size={80} color="#dc2626" />
          </div>
          <h2 className="profile-name">{user.name}</h2>
          <div className="profile-role-badge admin-badge">Administrator</div>
          <div className="profile-coins">
            <Coins size={24} color="#ff7622" />
            <span>{coins} Coins</span>
          </div>
        </div>

        {/* Admin Stats Section */}
        {adminStats && (
          <div className="profile-reviews-container profile-section">
            <div className="profile-section-title section-header-content">
              <TrendingUp size={20} />
              <span>System Overview</span>
            </div>
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <div className="admin-stat-icon users-icon">
                  <Users size={32} />
                </div>
                <div className="admin-stat-content">
                  <div className="admin-stat-number">
                    {adminStats.totalUsers}
                  </div>
                  <div className="admin-stat-label">Total Users</div>
                </div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-icon stalls-icon">
                  <Store size={32} />
                </div>
                <div className="admin-stat-content">
                  <div className="admin-stat-number">
                    {adminStats.totalStalls}
                  </div>
                  <div className="admin-stat-label">Total Stalls</div>
                </div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-icon owners-icon">
                  <User size={32} />
                </div>
                <div className="admin-stat-content">
                  <div className="admin-stat-number">
                    {adminStats.stallOwners}
                  </div>
                  <div className="admin-stat-label">Stall Owners</div>
                </div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-icon customers-icon">
                  <ShoppingBag size={32} />
                </div>
                <div className="admin-stat-content">
                  <div className="admin-stat-number">
                    {adminStats.regularUsers}
                  </div>
                  <div className="admin-stat-label">Customers</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Admin Quick Actions */}
        <div className="profile-reviews-container profile-section">
          <div className="profile-section-title section-header-content">
            <Shield size={20} />
            <span>Admin Actions</span>
          </div>
          <div className="admin-actions-grid">
            <button
              className="admin-action-btn"
              onClick={() => navigate("/admin")}
            >
              <Users size={20} />
              <span>Manage Users & Stalls</span>
            </button>
            <button
              className="admin-action-btn"
              onClick={() => navigate("/admin/add-stall")}
            >
              <Store size={20} />
              <span>Add New Stall</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

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
            <>
              <div className="review-list">
                {currentStalls.map((stall) => (
                  <div key={stall.stallid} className="review-card">
                    <div className="review-card-header">
                      <span className="review-item-name">
                        {stall.stallname}
                      </span>
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
              {/* Pagination for Stalls */}
              {renderPagination(
                currentStallPage,
                totalStallPages,
                setCurrentStallPage,
              )}
            </>
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
          <>
            <div className="review-list">
              {currentOrders.map((order) => (
                <div
                  key={order.orderid}
                  className="review-card order-card-clickable"
                  onClick={() => openOrderDetails(order)}
                >
                  <div className="review-card-header">
                    <span className="review-item-name">
                      Order #{order.orderid}
                    </span>
                    <span className="review-date">
                      {new Date(order.orderdate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="review-card-body">
                    <div className="order-row">
                      <span className="order-label">Status:</span>
                      <span
                        className={`status-text ${getStatusClass(
                          order.orderstatus,
                        )}`}
                      >
                        {order.orderstatus}
                      </span>
                    </div>

                    <div className="order-row">
                      <span className="order-label">Total:</span>
                      <span className="order-total-price">
                        ${order.totalamount.toFixed(2)}
                      </span>
                    </div>

                    <div className="order-row payment-row">
                      <span className="order-label">Payment:</span>
                      <span className="payment-text">
                        {order.paymentstatus}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Pagination for Orders */}
            {renderPagination(
              currentOrderPage,
              totalOrderPages,
              setCurrentOrderPage,
            )}
          </>
        ) : (
          <p className="empty-message">No orders yet.</p>
        )}
      </div>

      {/* Reviews Section */}
      <div className="profile-reviews-container">
        <div className="profile-section-title section-header-content">
          <h3 className="profile-section-title">My Reviews</h3>
        </div>
        {reviews.length > 0 ? (
          <>
            <div className="review-list">
              {currentReviews.map((review) => (
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
            {/* Pagination for Reviews */}
            {renderPagination(
              currentReviewPage,
              totalReviewPages,
              setCurrentReviewPage,
            )}
          </>
        ) : (
          <p className="empty-message">No reviews made</p>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          orderDetails={orderDetails}
          loading={loadingOrderDetails}
          onClose={closeOrderDetails}
          onOrderUpdated={refreshOrders}
        />
      )}
    </div>
  );
}

export default ProfilePage;
