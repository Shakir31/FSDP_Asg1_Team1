import React, { useEffect, useState } from "react";
import { useGroupOrder } from "./GroupOrderContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "../Cart.css";

// Helper function to get token from either storage
function getToken() {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}

// Helper function to get userId from either storage
function getUserId() {
  return localStorage.getItem("userId") || sessionStorage.getItem("userId");
}

function GroupOrderLobby() {
  const { session, setSession } = useGroupOrder();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const navigate = useNavigate();

  // Poll for updates
  useEffect(() => {
    if (!session) return;
    fetchGroupCart();
    const interval = setInterval(fetchGroupCart, 3000);
    return () => clearInterval(interval);
  }, [session]);

  const fetchGroupCart = async () => {
    const token = getToken();

    if (!token) {
      toast.error("Please log in to continue");
      navigate("/login");
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:3000/group-order/${session.sessionid}/cart`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (res.status === 404) {
        toast.error("Host has finalized the group order. Redirecting...");
        setSession(null);
        localStorage.removeItem("activeSession"); // Clean up storage
        navigate("/");
        return;
      }

      if (res.status === 403 || res.status === 401) {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        toast.error("Session expired. Please log in again.");
        navigate("/login");
        return;
      }

      const data = await res.json();
      if (res.ok) setItems(data.items);
    } catch (err) {
      console.error(err);
    }
  };

  const subtotal = items.reduce(
    (sum, item) => sum + item.menuitems.price * item.quantity,
    0,
  );

  const currentUserId = getUserId();
  const isHost = session?.host_userid == currentUserId;

  const handleCheckout = async () => {
    if (items.length === 0) return;

    const token = getToken();

    if (!token) {
      toast.error("Please log in to continue");
      navigate("/login");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:3000/group-order/finalize",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            sessionId: session.sessionid,
            totalAmount: subtotal,
          }),
        },
      );

      if (response.status === 403 || response.status === 401) {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        toast.error("Session expired. Please log in again.");
        navigate("/login");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Checkout failed");
      }

      toast.success("Group Order Finalized!");

      // Clear local session state since it's closed now
      setSession(null);
      localStorage.removeItem("activeSession");

      // Navigate based on payment method
      if (paymentMethod === "nets") {
        navigate("/nets-qr", { state: { totalAmount: subtotal, order: data } });
      } else {
        navigate("/checkout", { state: { order: data } });
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!session) return <div className="cart-empty">No active session</div>;

  return (
    <div className="cart-container">
      <div
        style={{
          background: "#fff3cd",
          padding: "15px",
          borderRadius: "8px",
          marginBottom: "20px",
          textAlign: "center",
          border: "1px solid #ffeeba",
        }}
      >
        <h2 style={{ margin: 0, color: "#856404" }}>
          Group Code:{" "}
          <span style={{ fontSize: "1.5em", fontWeight: "bold" }}>
            {session.join_code}
          </span>
        </h2>
        <p style={{ margin: "5px 0 0 0" }}>
          Share this code with your friends!
        </p>
      </div>

      <div className="cart-grid">
        {/* Left: Items List */}
        <div className="cart-left">
          <div className="card">
            <h3>Group Cart Items</h3>
            <div className="cart-list">
              {items.length === 0 ? (
                <div className="cart-empty">Waiting for items...</div>
              ) : (
                items.map((it, idx) => (
                  <div key={idx} className="cart-item">
                    <img
                      src={
                        it.menuitems.mainimageurl || "https://placehold.co/100"
                      }
                      alt={it.menuitems.name}
                      style={{
                        width: 60,
                        height: 60,
                        objectFit: "cover",
                        borderRadius: 8,
                      }}
                    />
                    <div className="cart-item-left" style={{ marginLeft: 15 }}>
                      <div className="cart-item-title">{it.menuitems.name}</div>
                      <div
                        style={{ fontSize: "0.85em", color: "var(--muted)" }}
                      >
                        Added by:{" "}
                        <strong>{it.users?.name || "User " + it.userid}</strong>
                      </div>
                      <div style={{ fontWeight: "bold", marginTop: 4 }}>
                        x {it.quantity}
                      </div>
                    </div>
                    <div className="cart-item-price">
                      SGD {(it.menuitems.price * it.quantity).toFixed(2)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: Payment & Checkout */}
        <aside className="cart-right">
          <div className="card payment-card">
            <h3 style={{ color: "var(--orange)", marginTop: 0 }}>
              Payment Method
            </h3>

            {/* Payment Selection (Only Host can select, but visible to all) */}
            <div style={{ marginBottom: 15 }}>
              <label className="pay-row">
                <input
                  type="checkbox"
                  checked={paymentMethod === "cash"}
                  disabled={!isHost}
                  onChange={() => setPaymentMethod("cash")}
                />
                <span style={{ fontWeight: 700 }}>Cash</span>
              </label>

              <label className="pay-row">
                <input
                  type="checkbox"
                  checked={paymentMethod === "nets"}
                  disabled={!isHost}
                  onChange={() => setPaymentMethod("nets")}
                />
                <span style={{ fontWeight: 700 }}>NETS</span>
              </label>
            </div>

            <div className="payment-divider" />

            <div
              className="cart-footer"
              style={{
                marginTop: 12,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: 18,
                }}
              >
                <div style={{ fontWeight: 700 }}>Total</div>
                <div style={{ fontWeight: 900 }}>SGD {subtotal.toFixed(2)}</div>
              </div>

              {isHost ? (
                <button
                  className="btn btn-orange"
                  onClick={handleCheckout}
                  disabled={items.length === 0 || loading}
                  style={{ width: "100%" }}
                >
                  {loading ? "Processing..." : "Finalize & Pay"}
                </button>
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    padding: "10px",
                    background: "#f8f9fa",
                    borderRadius: "4px",
                    color: "#666",
                    fontSize: "0.9em",
                  }}
                >
                  Waiting for Host to checkout...
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default GroupOrderLobby;
