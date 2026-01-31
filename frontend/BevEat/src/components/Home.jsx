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
  const [userLoc, setUserLoc] = useState(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [nearestHawkerCentre, setNearestHawkerCentre] = useState(null);

  async function fetchStalls() {
      try {
        const response = await fetch("http://localhost:3000/stalls");
        if (!response.ok) {
          throw new Error("Failed to fetch stalls");
        }
        const data = await response.json();
        // If we don't have nearest hawker centre yet, don't show stalls yet
        if (!nearestHawkerCentre) {
          setStalls([]);
          return;
        }

        // IMPORTANT: pick the correct FK column from your stalls API
        // Common ones: hawkercentreid, hawker_centre_id, hawkerCentreId
        const hcId = nearestHawkerCentre.id;

        const filtered = Array.isArray(data)
          ? data.filter((s) =>
              String(s.hawkercentreid ?? s.hawker_centre_id ?? s.hawkerCentreId) === String(hcId)
            )
          : [];

        // Show up to 4 stalls from the nearest hawker centre
        setStalls(filtered.slice(0, 4));
      } catch (err) {
        console.error(err);
        setStallsError(err.message);
      } finally {
        setStallsLoading(false);
      }
    }

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLoc({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        console.warn("Geolocation denied/unavailable:", err);
        setLocationDenied(true);
        setUserLoc(null);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    

    async function fetchHawkerCentres() {
      setHawkersLoading(true);

      try {
        const response = await fetch("http://localhost:3000/hawker-centres");
        if (!response.ok) throw new Error("Failed to fetch hawker centres");

        const data = await response.json();

        // Sort by nearest if we have coords
        if (userLoc && Array.isArray(data)) {
          // NOTE: your API might use latitude/longitude as strings -> convert
          const withCoords = data
            .map((h) => ({
              ...h,
              latitude: h.latitude != null ? Number(h.latitude) : null,
              longitude: h.longitude != null ? Number(h.longitude) : null,
            }))
            .filter((h) => Number.isFinite(h.latitude) && Number.isFinite(h.longitude));

          if (withCoords.length > 0) {
            const toRad = (v) => (v * Math.PI) / 180;
            const haversineKm = (a, b) => {
              const R = 6371;
              const dLat = toRad(b.lat - a.lat);
              const dLng = toRad(b.lng - a.lng);
              const lat1 = toRad(a.lat);
              const lat2 = toRad(b.lat);
              const x =
                Math.sin(dLat / 2) ** 2 +
                Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
              return 2 * R * Math.asin(Math.sqrt(x));
            };

            const sorted = withCoords
              .map((h) => ({
                ...h,
                _distanceKm: haversineKm(userLoc, { lat: h.latitude, lng: h.longitude }),
              }))
              .sort((a, b) => a._distanceKm - b._distanceKm);

              const top4 = sorted.slice(0, 4);
              setHawkerCentres(top4);

              // store the nearest one for stalls filtering
              setNearestHawkerCentre(top4[0] || null);
              return;
          }
        }

      // Fallback ONLY if we already have user location
      if (!userLoc) {
        setHawkerCentres([]);
        setNearestHawkerCentre(null);
        return;
      }
      // Fallback: first 4
        setHawkerCentres(data.slice(0, 4));
        setNearestHawkerCentre(data?.[0] || null);
      } catch (err) {
        console.error(err);
        setHawkersError(err.message);
      } finally {
        setHawkersLoading(false);
      }
    }

    async function fetchRecentOrders() {
      const token = sessionStorage.getItem("token");      
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
    fetchHawkerCentres();
    fetchRecentOrders();
  }, [userLoc, locationDenied]);

  useEffect(() => {
  if (nearestHawkerCentre) {
    setStallsLoading(true);
    fetchStalls();
  }
}, [nearestHawkerCentre]);

  const nearYouLoading = hawkersLoading || (!userLoc && !locationDenied);

  const handleOrderAgain = async (orderId) => {
    const token = sessionStorage.getItem("token");
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

      {stallsLoading ? (
        <div className="near-you-loading">
          <div className="spinner" />
          <p>Loading stalls near you…</p>
        </div>
      ) : locationDenied ? (
        <p style={{ opacity: 0.7 }}>
          Enable location to see stalls near you.
        </p>
      ) : stallsError ? (
        <p style={{ color: "red" }}>Error: {stallsError}</p>
      ) : (
        <div className="card-grid">
          {stalls.map((stall) => (
            <Link
              to={`/stalls/${stall.stallid}`}
              className="card-link"
              key={stall.stallid}
            >
              <div className="card stall-card">
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

                {nearestHawkerCentre?.name && (
                  <div className="stall-footer">
                    <span className="stall-meta">
                      {nearestHawkerCentre.name}
                      {typeof nearestHawkerCentre._distanceKm === "number" && (
                        <>
                          <span className="stall-dot">•</span>
                          <span className="stall-distance-inline">
                            {nearestHawkerCentre._distanceKm.toFixed(1)} km
                          </span>
                        </>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
      </section>

      {/* Hawker Centres Section */}
      <section className="hawker">
        <div className="section-header">
          <h2>Hawker Centres Near You</h2>
          <Link to="/hawker-centres" className="see-all">
            See all &gt;
          </Link>
        </div>

        {hawkersError && <p style={{ color: "red" }}>Error: {hawkersError}</p>}

        {nearYouLoading ? (
          <div className="near-you-loading">
            <div className="spinner" />
            <p>Loading hawkers near you…</p>
          </div>
        ) : locationDenied ? (
          <p style={{ opacity: 0.7 }}>
            Enable location to see hawkers near you.
          </p>
        ) : (
          <div className="card-grid">
            {!hawkersError &&
              hawkerCentres.map((hawker) => (
                <Link
                  to={`/hawker-centres/${hawker.id}`}
                  className="card-link"
                  key={hawker.id}
                >
                  <div className="card hawker-card">
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

                    <div className="hawker-card-body">
                      <h3>{hawker.name}</h3>
                      <p>{hawker.address}</p>
                    </div>

                    {typeof hawker._distanceKm === "number" && (
                      <span className="hawker-distance">{hawker._distanceKm.toFixed(1)} km</span>
                    )}
                  </div>
                </Link>
              ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Home;
