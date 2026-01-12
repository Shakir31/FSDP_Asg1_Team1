import React, { useState } from "react";
import { X, Package, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "../OrderDetailsModal.css";

function OrderDetailsModal({
  order,
  orderDetails,
  loading,
  onClose,
  onOrderUpdated,
}) {
  const navigate = useNavigate();
  const [markingAsCollected, setMarkingAsCollected] = useState(false);

  if (!order) return null;

  const handleAddReview = (stallId, menuItemId) => {
    navigate(`/upload?stallId=${stallId}&menuItemId=${menuItemId}`);
    onClose();
  };

  const handleMarkAsCollected = async () => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");

    setMarkingAsCollected(true);

    try {
      // Update order status to Completed
      const statusResponse = await fetch(
        `http://localhost:3000/orders/${order.orderid}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            orderStatus: "Completed",
          }),
        }
      );

      if (!statusResponse.ok) {
        throw new Error("Failed to update order status");
      }

      // Update payment status to Paid
      const paymentResponse = await fetch(
        `http://localhost:3000/orders/payment`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            orderId: order.orderid,
            paymentStatus: "Paid",
          }),
        }
      );

      if (!paymentResponse.ok) {
        throw new Error("Failed to update payment status");
      }

      toast.success("Order marked as collected!");

      // Call parent to refresh order list
      if (onOrderUpdated) {
        onOrderUpdated();
      }

      onClose();
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to mark order as collected");
    } finally {
      setMarkingAsCollected(false);
    }
  };

  const getStatusClass = (status) => {
    if (status === "Completed") return "status-completed";
    if (status === "Pending") return "status-pending";
    return "status-default";
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Order #{order.orderid}</h2>
            <p className="modal-subtitle">
              {new Date(order.orderdate).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          {/* Order Summary */}
          <div className="order-summary-section">
            <div className="order-summary-row">
              <span className="summary-label">Status:</span>
              <span
                className={`status-badge ${getStatusClass(order.orderstatus)}`}
              >
                {order.orderstatus === "Completed" && (
                  <CheckCircle
                    size={16}
                    style={{ marginRight: 4, display: "inline" }}
                  />
                )}
                {order.orderstatus === "Pending" && (
                  <Package
                    size={16}
                    style={{ marginRight: 4, display: "inline" }}
                  />
                )}
                {order.orderstatus}
              </span>
            </div>
            <div className="order-summary-row">
              <span className="summary-label">Payment:</span>
              <span className="payment-badge">{order.paymentstatus}</span>
            </div>
            <div className="order-summary-row order-total-row">
              <span className="summary-label">Total:</span>
              <span className="total-amount">
                ${order.totalamount.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="section-divider"></div>

          {/* Order Items */}
          <div className="order-items-section">
            <h3 className="section-title">Order Items</h3>

            {loading ? (
              <div className="loading-container">
                <p className="loading-text">Loading items...</p>
              </div>
            ) : orderDetails?.items && orderDetails.items.length > 0 ? (
              <div className="items-list">
                {orderDetails.items.map((item) => (
                  <div key={item.orderitemid} className="item-card">
                    <div className="item-card-content">
                      {item.mainimageurl && (
                        <img
                          src={item.mainimageurl}
                          alt={item.name}
                          className="item-image"
                        />
                      )}
                      <div className="item-info">
                        <div className="item-main-info">
                          <h4 className="item-name">{item.name}</h4>
                          <p className="item-stall">{item.stallname}</p>
                        </div>
                        <div className="item-pricing">
                          <span className="item-quantity">
                            {item.quantity} × ${item.price.toFixed(2)}
                          </span>
                          <span className="item-subtotal">
                            ${item.subtotal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                    {order.orderstatus === "Completed" && (
                      <button
                        className="btn-add-review"
                        onClick={() =>
                          handleAddReview(item.stallid, item.menuitemid)
                        }
                      >
                        Add Review
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-message">No items found</p>
            )}
          </div>

          {/* Mark as Collected Button - Only show for Pending orders */}
          {order.orderstatus === "Pending" && (
            <div className="modal-actions">
              <button
                className="btn-mark-collected"
                onClick={handleMarkAsCollected}
                disabled={markingAsCollected}
              >
                {markingAsCollected ? "Updating..." : "Mark as Collected"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OrderDetailsModal;
