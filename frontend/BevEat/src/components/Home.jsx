import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "./Cartcontext";
import RecommendationsSection from "./RecommendationsSection";
import "../Home.css";

function Home() {
  const [stalls, setStalls] = useState([]);
  const [hawkerCentres, setHawkerCentres] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [expandedOrderIds, setExpandedOrderIds] = useState([]);
  const [stallsLoading, setStallsLoading] = useState(true);
  const [hawkersLoading, setHawkersLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [stallsError, setStallsError] = useState(null);
  const [hawkersError, setHawkersError] = useState(null);
  const { addItem } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchStalls() {
      try {
        const response = await fetch("http://localhost:3000/stalls");
        if (!response.ok) {
          throw new Error("Failed to fetch stalls");
        }
        const data = await response.json();
        // Show only first 4 stalls on homepage
        setStalls(data.slice(0, 4));
      } catch (err) {
        console.error(err);
        setStallsError(err.message);
      } finally {
        setStallsLoading(false);
      }
    }

    async function fetchHawkerCentres() {
      try {
        const response = await fetch("http://localhost:3000/hawker-centres");
        if (!response.ok) {
          throw new Error("Failed to fetch hawker centres");
        }
        const data = await response.json();
        // Show only first 4 hawker centres on homepage
        setHawkerCentres(data.slice(0, 4));
      } catch (err) {
        console.error(err);
        setHawkersError(err.message);
      } finally {
        setHawkersLoading(false);
      }
    }

    async function fetchRecentOrders() {
      const token = localStorage.getItem("token");
      if (!token) {
        setOrdersLoading(false);
        return;
      }

      try {
        const response = await fetch("http://localhost:3000/orders/history", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch order history");
        }
        const data = await response.json();
        
        // Filter for completed orders only and fetch full details
        const completedOrders = data.filter(order => order.orderstatus === "Completed");
        
        // Fetch full details for each completed order to get items and stall info
        const detailedOrders = await Promise.all(
          completedOrders.slice(0, 2).map(async (order) => {
            try {
              const detailResponse = await fetch(`http://localhost:3000/orders/${order.orderid}`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });
              if (detailResponse.ok) {
                return await detailResponse.json();
              }
              return order;
            } catch (err) {
              console.error("Error fetching order details:", err);
              return order;
            }
          })
        );
        
        setRecentOrders(detailedOrders);
      } catch (err) {
        console.error(err);
      } finally {
        setOrdersLoading(false);
      }
    }

    fetchStalls();
    fetchHawkerCentres();
    fetchRecentOrders();
  }, []);

  const handleOrderAgain = async (orderId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch order details");
      }
      
      const orderDetails = await response.json();
      
      // Add all items from the order to cart
      orderDetails.items?.forEach((item) => {
        addItem({
          id: item.menuitemid,
          name: item.name,
          price: parseFloat(item.price),
          qty: item.quantity,
        });
      });
      
      // Navigate to cart
      navigate("/cart");
    } catch (error) {
      console.error("Error reordering:", error);
      alert("Failed to add items to cart. Please try again.");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <img
          src="https://res.cloudinary.com/dv9rwydip/image/upload/v1763507453/Screenshot_2025-11-19_070921_jc19cv.png"
          alt="satay cooking"
          className="hero-image"
        />
      </section>

      {/* Order Again Section */}
      {!ordersLoading && recentOrders.length > 0 && (
        <section className="order-again">
          <div className="section-header">
            <h2>Order It Again</h2>
            <Link to="/profile" className="see-all">
              View All Orders &gt;
            </Link>
          </div>

          <div className="order-again-grid">
            {recentOrders.map((order) => (
              <div key={order.orderid} className="order-again-card">
                <div className="order-info">
                  <p className="order-items">
                    {order.items?.length || 0} ITEM{order.items?.length !== 1 ? "S" : ""}, {formatDate(order.orderdate)}
                  </p>
                  <h3 className="order-stall">{order.items?.[0]?.stallname || "Unknown Stall"}</h3>
                  {expandedOrderIds.includes(order.orderid) && (
                    <div className="order-items-preview">
                      {order.items?.slice(0, 2).map((item, idx) => (
                        <span key={idx}>
                          {item.quantity}x {item.name}
                          {idx < Math.min(order.items.length - 1, 1) && ", "}
                        </span>
                      ))}
                      {order.items?.length > 2 && <span>...</span>}
                    </div>
                  )}
                </div>
                <div className="order-actions">
                  <button
                    className="view-details-btn"
                    onClick={() => {
                      if (expandedOrderIds.includes(order.orderid)) {
                        setExpandedOrderIds(expandedOrderIds.filter(id => id !== order.orderid));
                      } else {
                        setExpandedOrderIds([...expandedOrderIds, order.orderid]);
                      }
                    }}
                  >
                    {expandedOrderIds.includes(order.orderid) ? "Hide Details" : "View Details"}
                  </button>
                  <button
                    className="add-again-btn"
                    onClick={() => handleOrderAgain(order.orderid)}
                  >
                    Add ${order.totalamount?.toFixed(2) || "0.00"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      
      {/* ✨ RECOMMENDATIONS SECTION - ADDED HERE ✨ */}
      {/* This appears first so users see personalized suggestions immediately */}
      <section className="recommendations-container">
        <RecommendationsSection limit={6} showTitle={true} />
      </section>

      {/* Popular Stalls Section */}
      <section className="stalls">
        <div className="section-header">
          <h2>Popular Stalls Near You</h2>
          <Link to="/stalls" className="see-all">
            See all &gt;
          </Link>
        </div>

        {stallsLoading && <p>Loading stalls...</p>}
        {stallsError && <p style={{ color: "red" }}>Error: {stallsError}</p>}

        <div className="card-grid">
          {!stallsLoading &&
            !stallsError &&
            stalls.map((stall) => (
              <Link
                to={`/stalls/${stall.stallid}`}
                className="card-link"
                key={stall.stallid}
              >
                <div className="card">
                  <img
                    src={
                      stall.stall_image ||
                      "https://res.cloudinary.com/dv9rwydip/image/upload/v1761451673/samples/cup-on-a-table.jpg"
                    }
                    alt={stall.stallname}
                    onError={(e) => {
                      e.target.src =
                        "https://res.cloudinary.com/dv9rwydip/image/upload/v1761451673/samples/cup-on-a-table.jpg";
                    }}
                  />
                  <h3>{stall.stallname}</h3>
                  <p>{stall.description}</p>
                </div>
              </Link>
            ))}
        </div>
      </section>

      {/* Hawker Centres Section */}
      <section className="hawker">
        <div className="section-header">
          <h2>Hawker Centres Near You</h2>
          <Link to="/hawker-centres" className="see-all">
            See all &gt;
          </Link>
        </div>

        {hawkersLoading && <p>Loading hawker centres...</p>}
        {hawkersError && <p style={{ color: "red" }}>Error: {hawkersError}</p>}

        <div className="card-grid">
          {!hawkersLoading &&
            !hawkersError &&
            hawkerCentres.map((hawker) => (
              <Link
                to={`/hawker-centres/${hawker.id}`}
                className="card-link"
                key={hawker.id}
              >
                <div className="card">
                  <img
                    src={
                      hawker.photo_url ||
                      "https://res.cloudinary.com/dv9rwydip/image/upload/v1763507632/Screenshot_2025-11-19_071248_gejxjk.png"
                    }
                    alt={hawker.name}
                    onError={(e) => {
                      e.target.src =
                        "https://res.cloudinary.com/dv9rwydip/image/upload/v1763507632/Screenshot_2025-11-19_071248_gejxjk.png";
                    }}
                  />
                  <h3>{hawker.name}</h3>
                  <p>{hawker.address}</p>
                </div>
              </Link>
            ))}
        </div>
      </section>
    </div>
  );
}

export default Home;
