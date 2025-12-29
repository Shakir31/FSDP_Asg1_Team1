import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../Cart.css";

export const CartContext = createContext(null);

export function CartProvider({ children }) {
  // Initialize items from localStorage
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem("cartItems");
    return saved ? JSON.parse(saved) : [];
  });

  const [vouchers, setVouchers] = useState([
    { id: "v1", code: "DISC1", description: "Save $1.00", amountOff: 1.0 },
  ]);

  const [appliedVoucherId, setAppliedVoucherId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");

  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(items));
  }, [items]);

  const [userCoins, setUserCoins] = useState(0);
  const [availableVouchers, setAvailableVouchers] = useState([]);

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
        availableVouchers,
        refreshCoins,
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
  } = useCart();

  const [placing, setPlacing] = useState(false);

  const subtotal = calcSubtotal(items);
  const appliedVoucher =
    vouchers.find((v) => v.id === appliedVoucherId) || null;
  const discount = appliedVoucher ? appliedVoucher.amountOff || 0 : 0;
  const total = Math.max(0, subtotal - discount);

  const handleCheckout = async () => {
    if (items.length === 0) return;
    if (!paymentMethod) {
      alert("Please select a payment method.");
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

      // Clear cart
      setItems([]);
      setAppliedVoucherId(null);

      // Navigate based on payment method
      if (paymentMethod === "nets") {
        navigate("/nets-qr", { state: { totalAmount: total, order: data } });
      } else {
        navigate("/checkout", { state: { order: data } });
      }
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Failed to place order. Please try again.");
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
                    color: "var(--muted)",
                  }}
                >
                  <div>Voucher ({appliedVoucher.code})</div>
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

            {vouchers.length === 0 ? (
              <div className="cart-empty">You have no vouchers.</div>
            ) : (
              <div style={{ marginTop: 8 }}>
                {vouchers.map((v) => (
                  <label key={v.id} className="voucher-row">
                    <input
                      type="checkbox"
                      checked={appliedVoucherId === v.id}
                      onChange={() =>
                        setAppliedVoucherId(
                          appliedVoucherId === v.id ? null : v.id
                        )
                      }
                    />
                    <div>
                      <div style={{ fontWeight: 700 }}>{v.code}</div>
                      <div style={{ fontSize: 13, color: "var(--muted)" }}>
                        {v.description}
                      </div>
                    </div>
                  </label>
                ))}

                <div style={{ marginTop: 10 }}>
                  <button
                    className="btn btn-orange"
                    onClick={() => {
                      if (!appliedVoucherId) return;
                      alert("Voucher applied");
                    }}
                    style={{ width: "100%" }}
                  >
                    Redeem Selected
                  </button>
                </div>
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
  const order = location?.state?.order || null;

  if (order) {
    return (
      <div style={{ padding: 24 }}>
        <h2 style={{ color: "var(--orange)" }}>Order Placed</h2>
        <p>
          Your order (ID: {order.orderId || "—"}) has been placed. Please pay
          when you receive the food.
        </p>
        <p style={{ color: "var(--muted)" }}>
          We will notify you when the order is being prepared.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ color: "var(--orange)" }}>Checkout</h2>
      <p>No order information available.</p>
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
