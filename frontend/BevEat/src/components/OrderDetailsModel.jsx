import React from "react";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../OrderDetailsModal.css";

function OrderDetailsModal({ order, orderDetails, loading, onClose }) {
  const navigate = useNavigate();

  if (!order) return null;

  const handleAddReview = (stallId, menuItemId) => {
    navigate(`/upload?stallId=${stallId}&menuItemId=${menuItemId}`);
    onClose();
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
                    <button
                      className="btn-add-review"
                      onClick={() =>
                        handleAddReview(item.stallid, item.menuitemid)
                      }
                    >
                      Add Review
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-message">No items found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderDetailsModal;
