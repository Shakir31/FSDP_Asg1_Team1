import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import RecommendationsSection from "./RecommendationsSection";
import "../Cart.css";
import { Banknote, Home } from "lucide-react";

export const CartContext = createContext(null);

export function CartProvider({ children }) {
  // Initialize items from localStorage
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem("cartItems");
    return saved ? JSON.parse(saved) : [];
  });

  const [vouchers, setVouchers] = useState([]);
  const [appliedVoucherId, setAppliedVoucherId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [userCoins, setUserCoins] = useState(0);

  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(items));
  }, [items]);

  // Get user role from storage
  const getUserRole = () => {
    return localStorage.getItem("role") || sessionStorage.getItem("role");
  };

  // Fetch user vouchers (only for customers)
  const fetchVouchers = async () => {
    const role = getUserRole();

    // Only fetch vouchers if user is a customer
    if (role !== "customer") {
      setVouchers([]);
      return;
    }

    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      setVouchers([]);
      return;
    }

    setLoadingVouchers(true);
    try {
      const response = await fetch("http://localhost:3000/vouchers/user", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setVouchers(data);
      } else {
        setVouchers([]);
      }
    } catch (error) {
      console.error("Error fetching vouchers:", error);
      setVouchers([]);
    } finally {
      setLoadingVouchers(false);
    }
  };

  // Fetch vouchers when token changes or component mounts (only for customers)
  useEffect(() => {
    const role = getUserRole();
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");

    if (token && role === "customer") {
      fetchVouchers();
    }
  }, []);

  // ADDED: Also fetch vouchers whenever the window gains focus (only for customers)
  useEffect(() => {
    const handleFocus = () => {
      const role = getUserRole();
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");

      if (token && role === "customer") {
        fetchVouchers();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const refreshCoins = async () => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch("http://localhost:3000/coins/balance", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUserCoins(data.coins);
      }
    } catch (err) {
      console.error("Error fetching coin balance:", err);
    }
  };

  const addItem = (item) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const updateQty = (id, qty) => {
    if (qty <= 0) {
      setItems((prev) => prev.filter((it) => it.id !== id));
      return;
    }
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, qty } : it)));
  };

  const removeItem = (id) =>
    setItems((prev) => prev.filter((it) => it.id !== id));

  return (
    <CartContext.Provider
      value={{
        items,
        setItems,
        addItem,
        updateQty,
        removeItem,
        vouchers,
        appliedVoucherId,
        setAppliedVoucherId,
        paymentMethod,
        setPaymentMethod,
        userCoins,
        refreshCoins,
        loadingVouchers,
        fetchVouchers,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}

function calcSubtotal(items) {
  return items.reduce((s, it) => s + (it.price || 0) * (it.qty || 0), 0);
}

export function CartPage() {
  const navigate = useNavigate();
  const {
    items,
    setItems,
    updateQty,
    vouchers,
    appliedVoucherId,
    setAppliedVoucherId,
    paymentMethod,
    setPaymentMethod,
    loadingVouchers,
    fetchVouchers,
  } = useCart();

  const [placing, setPlacing] = useState(false);

  // ADDED: Fetch vouchers when CartPage mounts to ensure fresh data
  useEffect(() => {
    fetchVouchers();
  }, []);

  const subtotal = calcSubtotal(items);
  const appliedVoucher =
    vouchers.find((v) => v.uservoucherid === appliedVoucherId) || null;

  // Calculate discount based on voucher type
  const discount = appliedVoucher
    ? appliedVoucher.discounttype === "percentage"
      ? subtotal * (appliedVoucher.discountamount / 100)
      : appliedVoucher.discountamount
    : 0;

  const total = Math.max(0, subtotal - discount);

  const handleCheckout = async () => {
    if (items.length === 0) return;
    if (!paymentMethod) {
      toast.warning("Please select a payment method.");
      return;
    }

    const payload = {
      items: items.map((it) => ({
        menuItemId: it.id,
        name: it.name,
        quantity: Number(it.qty || 0),
        price: Number(Number(it.price || 0).toFixed(2)),
      })),
      totalAmount: Number(Number(total || 0).toFixed(2)),
      userVoucherId: appliedVoucherId || null,
    };

    setPlacing(true);
    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");

      const response = await fetch("http://localhost:3000/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Clear cart and voucher selection
      setItems([]);
      setAppliedVoucherId(null);

      // Refresh vouchers list (voucher will be removed from list)
      await fetchVouchers();

      toast.success("Order placed successfully!");

      // Navigate based on payment method
      if (paymentMethod === "nets") {
        navigate("/nets-qr", { state: { totalAmount: total, order: data } });
      } else {
        navigate("/checkout", { state: { order: data } });
      }
    } catch (err) {
      console.error("Checkout error:", err);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="cart-container">
      <h2 className="cart-title">Your Cart</h2>

      <div className="cart-grid">
        {/* LEFT: Items */}
        <div className="cart-left">
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Items</h3>
            <div className="cart-list" style={{ marginTop: 8 }}>
              {items.length === 0 ? (
                <div className="cart-empty">Your cart is empty.</div>
              ) : null}

              {items.length > 0 &&
                items.map((it) => {
                  return (
                    <div key={it.id} className="cart-item">
                      <div className="cart-item-left">
                        <div className="cart-item-title">{it.name}</div>
                        {it.desc && (
                          <div className="cart-item-desc">{it.desc}</div>
                        )}
                      </div>

                      <div
                        className="qty-controls"
                        role="group"
                        aria-label="quantity"
                      >
                        <button
                          className="qty-btn"
                          onClick={() => updateQty(it.id, it.qty - 1)}
                          aria-label="decrease"
                          type="button"
                        >
                          -
                        </button>
                        <div className="qty-count">{it.qty}</div>
                        <button
                          className="qty-btn"
                          onClick={() => updateQty(it.id, it.qty + 1)}
                          aria-label="increase"
                          type="button"
                        >
                          +
                        </button>
                      </div>

                      <div className="cart-item-price">
                        SGD {(it.price * it.qty).toFixed(2)}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* ✨ RECOMMENDATIONS SECTION - ADDED HERE ✨ */}
          {items.length > 0 && (
            <div className="cart-recommendations">
              <h3 className="recommendations-header">Add More to Your Order</h3>
              <p className="recommendations-subheader">
                Customers who ordered these items also enjoyed
              </p>
              <RecommendationsSection limit={3} showTitle={false} />
            </div>
          )}
        </div>

        {/* RIGHT: Payment and vouchers */}
        <aside className="cart-right">
          <div className="card payment-card">
            <h3 style={{ marginTop: 0, color: "var(--orange)" }}>
              Payment Method
            </h3>

            <div style={{ marginTop: 8 }}>
              <label className="pay-row">
                <input
                  type="checkbox"
                  checked={paymentMethod === "cash"}
                  onChange={() =>
                    setPaymentMethod(paymentMethod === "cash" ? null : "cash")
                  }
                />
                <span style={{ fontWeight: 700 }}>Cash</span>
              </label>

              <label className="pay-row">
                <input
                  type="checkbox"
                  checked={paymentMethod === "nets"}
                  onChange={() =>
                    setPaymentMethod(paymentMethod === "nets" ? null : "nets")
                  }
                />
                <span style={{ fontWeight: 700 }}>NETS</span>
              </label>
            </div>

            <div className="payment-divider" />

            <div
              className="cart-footer"
              style={{
                marginTop: 12,
                flexDirection: "column",
                alignItems: "stretch",
                gap: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ fontSize: 16 }}>Subtotal</div>
                <div style={{ fontWeight: 700 }}>SGD {subtotal.toFixed(2)}</div>
              </div>

              {appliedVoucher && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    color: "#22c55e",
                    fontWeight: 600,
                  }}
                >
                  <div>Voucher ({appliedVoucher.name})</div>
                  <div>-SGD {discount.toFixed(2)}</div>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: 18,
                }}
              >
                <div style={{ fontWeight: 700 }}>Total</div>
                <div style={{ fontWeight: 900 }}>SGD {total.toFixed(2)}</div>
              </div>

              <button
                className="btn btn-orange"
                onClick={handleCheckout}
                style={{ width: "100%" }}
                disabled={!paymentMethod || items.length === 0 || placing}
              >
                {placing ? "Placing order..." : "Checkout"}
              </button>
            </div>
          </div>

          <div className="card voucher-card" style={{ marginTop: 12 }}>
            <h3 style={{ marginTop: 0, color: "var(--orange)" }}>Vouchers</h3>

            {loadingVouchers ? (
              <div className="cart-empty">Loading vouchers...</div>
            ) : vouchers.length === 0 ? (
              <div className="cart-empty">
                No vouchers available. Redeem some on the Redeem page!
              </div>
            ) : (
              <div style={{ marginTop: 8 }}>
                {vouchers.map((v) => (
                  <label key={v.uservoucherid} className="voucher-row">
                    <input
                      type="checkbox"
                      checked={appliedVoucherId === v.uservoucherid}
                      onChange={() =>
                        setAppliedVoucherId(
                          appliedVoucherId === v.uservoucherid
                            ? null
                            : v.uservoucherid
                        )
                      }
                    />
                    <div>
                      <div style={{ fontWeight: 700 }}>{v.name}</div>
                      <div style={{ fontSize: 13, color: "var(--muted)" }}>
                        {v.description} - Save{" "}
                        {v.discounttype === "percentage"
                          ? `${v.discountamount}%`
                          : `$${v.discountamount.toFixed(2)}`}
                      </div>
                      <div
                        style={{ fontSize: 12, color: "#999", marginTop: 4 }}
                      >
                        Expires: {new Date(v.expirydate).toLocaleDateString()}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

export function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const order = location?.state?.order || null;

  if (!order) {
    return (
      <div className="checkout-container">
        <div className="receipt-card">
          <div className="receipt-body">
            <h2>No Order Found</h2>
            <button onClick={() => navigate("/home")} className="btn-home">
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <div className="receipt-card">
        
        {/* Header Section */}
        <div className="receipt-header">
          <div className="receipt-icon">
            <Banknote size={36} color="white" />
          </div>
          <h2>Order Placed!</h2>
          <p>Please pay cash at the counter</p>
        </div>

        {/* Body Section */}
        <div className="receipt-body">
          
          {/* Queue Number Box */}
          <div className="queue-box">
            <div className="queue-label">Queue Number</div>
            <div className="queue-number">{order.queueNumber || "00"}</div>
            <div className="order-id">Order ID: #{order.orderId}</div>
          </div>

          <p style={{ color: "#6b7280", marginBottom: "30px", lineHeight: "1.5" }}>
            Show this screen to the stall owner when making payment. We will notify you when your food is ready!
          </p>

          <button onClick={() => navigate("/home")} className="btn-home">
            <Home size={20} />
            Back to Home
          </button>
        </div>

      </div>
    </div>
  );
}

export function CheckoutSuccess() {
  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ color: "var(--orange)" }}>Payment Successful</h2>
      <p>Thank you for your purchase.</p>
    </div>
  );
}
