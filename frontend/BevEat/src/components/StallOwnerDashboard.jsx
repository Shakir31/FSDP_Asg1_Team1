import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import "../StallOwnerDashboard.css";

function StallOwnerDashboard() {
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("pending");
  const [processingId, setProcessingId] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchNotifications();
    fetchStats();
  }, []);

  async function fetchNotifications() {
    try {
      const response = await fetch("http://localhost:3000/notifications", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }

      const data = await response.json();
      setNotifications(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }

  async function fetchStats() {
    try {
      const response = await fetch(
        "http://localhost:3000/notifications/stats",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch stats");
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleApprove(notificationId) {
    if (!window.confirm("Replace menu item image with this photo?")) {
      return;
    }

    setProcessingId(notificationId);
    try {
      const response = await fetch(
        `http://localhost:3000/notifications/${notificationId}/approve`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to approve notification");
      }

      toast.success("Image updated successfully!");
      await fetchNotifications();
      await fetchStats();
    } catch (err) {
      console.error(err);
      toast.error("Error: " + err.message);
    } finally {
      setProcessingId(null);
    }
  }

  async function handleDismiss(notificationId) {
    if (!window.confirm("Dismiss this suggestion?")) {
      return;
    }

    setProcessingId(notificationId);
    try {
      const response = await fetch(
        `http://localhost:3000/notifications/${notificationId}/dismiss`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to dismiss notification");
      }

      toast.success("Notification dismissed");
      await fetchNotifications();
      await fetchStats();
    } catch (err) {
      console.error(err);
      toast.error("Error: " + err.message);
    } finally {
      setProcessingId(null);
    }
  }

  async function handleRevert(notificationId) {
    if (
      !window.confirm(
        "Revert to the original image? This will restore the previous menu item photo."
      )
    ) {
      return;
    }

    setProcessingId(notificationId);
    try {
      const response = await fetch(
        `http://localhost:3000/notifications/${notificationId}/revert`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to revert notification");
      }

      toast.success("Image reverted to original successfully!");
      await fetchNotifications();
      await fetchStats();
    } catch (err) {
      console.error(err);
      toast.error("Error: " + err.message);
    } finally {
      setProcessingId(null);
    }
  }

  const filteredNotifications = notifications.filter(
    (notif) => filter === "all" || notif.status === filter
  );

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Stall Owner Dashboard</h1>
        <p>Manage your stalls and photo suggestions</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{stats.pending}</div>
            <div className="stat-label">Pending Suggestions</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.approved}</div>
            <div className="stat-label">Approved</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.dismissed}</div>
            <div className="stat-label">Dismissed</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total Suggestions</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters">
        <button
          onClick={() => setFilter("pending")}
          style={{
            backgroundColor: filter === "pending" ? "#ff7622" : "#f0f0f0",
            color: filter === "pending" ? "white" : "#333",
          }}
        >
          Pending ({stats?.pending || 0})
        </button>
        <button
          onClick={() => setFilter("approved")}
          style={{
            backgroundColor: filter === "approved" ? "#ff7622" : "#f0f0f0",
            color: filter === "approved" ? "white" : "#333",
          }}
        >
          Approved ({stats?.approved || 0})
        </button>
        <button
          onClick={() => setFilter("dismissed")}
          style={{
            backgroundColor: filter === "dismissed" ? "#ff7622" : "#f0f0f0",
            color: filter === "dismissed" ? "white" : "#333",
          }}
        >
          Dismissed ({stats?.dismissed || 0})
        </button>
        <button
          onClick={() => setFilter("all")}
          style={{
            backgroundColor: filter === "all" ? "#ff7622" : "#f0f0f0",
            color: filter === "all" ? "white" : "#333",
          }}
        >
          All ({stats?.total || 0})
        </button>
      </div>

      {/* Notifications List */}
      {loading && <p>Loading notifications...</p>}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {!loading && !error && filteredNotifications.length === 0 && (
        <div className="empty-state">
          <p>No {filter !== "all" ? filter : ""} notifications found.</p>
          {filter === "pending" && (
            <p style={{ fontSize: "0.9rem", color: "#666" }}>
              Photo suggestions will appear here when customers upload highly
              upvoted photos.
            </p>
          )}
        </div>
      )}

      <div className="notifications-list">
        {!loading &&
          !error &&
          filteredNotifications.map((notif) => (
            <div
              key={notif.notificationid}
              className={`notification-card ${notif.status}`}
            >
              <div className="notification-header">
                <div>
                  <h3>{notif.menuitems.name}</h3>
                  <p className="stall-name">{notif.stalls.stallname}</p>
                </div>
                <span className={`status-badge ${notif.status}`}>
                  {notif.status}
                </span>
              </div>

              <div className="notification-body">
                <div className="image-comparison">
                  {/* Current Image */}
                  <div className="image-section">
                    <div className="image-label">Current Image</div>
                    <img
                      src={
                        notif.current_image_url ||
                        "https://via.placeholder.com/300x200?text=No+Image"
                      }
                      alt="Current"
                      onError={(e) => {
                        e.target.src =
                          "https://via.placeholder.com/300x200?text=No+Image";
                      }}
                    />
                  </div>

                  {/* Arrow */}
                  <div className="arrow-section">
                    <span className="arrow">→</span>
                    <div className="votes-info">
                      {notif.suggested_image_votes} upvotes
                    </div>
                  </div>

                  {/* Suggested Image */}
                  <div className="image-section suggested">
                    <div className="image-label">Suggested Image ⭐</div>
                    <img
                      src={notif.images.imageurl}
                      alt="Suggested"
                      onError={(e) => {
                        e.target.src =
                          "https://via.placeholder.com/300x200?text=Error";
                      }}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                {notif.status === "pending" && (
                  <div className="notification-actions">
                    <button
                      className="btn-approve"
                      onClick={() => handleApprove(notif.notificationid)}
                      disabled={processingId === notif.notificationid}
                    >
                      {processingId === notif.notificationid
                        ? "Processing..."
                        : "Approve & Replace"}
                    </button>
                    <button
                      className="btn-dismiss"
                      onClick={() => handleDismiss(notif.notificationid)}
                      disabled={processingId === notif.notificationid}
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {notif.status !== "pending" && (
                  <div className="notification-footer">
                    <p
                      style={{
                        fontSize: "0.9rem",
                        color: "#666",
                        marginBottom:
                          notif.status === "approved" ? "12px" : "0",
                      }}
                    >
                      {notif.status === "approved"
                        ? "✓ Image has been replaced"
                        : "✗ Suggestion was dismissed"}
                    </p>

                    {/* Revert button for approved notifications */}
                    {notif.status === "approved" && (
                      <button
                        className="btn-revert"
                        onClick={() => handleRevert(notif.notificationid)}
                        disabled={processingId === notif.notificationid}
                      >
                        {processingId === notif.notificationid
                          ? "Processing..."
                          : "↩ Revert to Original"}
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="notification-meta">
                <span>
                  {new Date(notif.createdat).toLocaleDateString("en-SG", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

export default StallOwnerDashboard;
