import React, { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Cart.css";
import { useEffect } from "react";

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
  const [paymentMethod, setPaymentMethod] = useState("cash"); // can be 'cash'|'nets'|null

  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(items));
  }, [items]);

  const addItem = (item) => {
    setItems((prev) => {
      // Check if item already exists
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        // If exists, increment quantity
        return prev.map((i) =>
          i.id === item.id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      // Else add new item with qty 1
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

  const removeItem = (id) => setItems((prev) => prev.filter((it) => it.id !== id));

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
    updateQty,
    vouchers,
    appliedVoucherId,
    setAppliedVoucherId,
    paymentMethod,
    setPaymentMethod,
  } = useCart();

  const subtotal = calcSubtotal(items);
  const appliedVoucher = vouchers.find((v) => v.id === appliedVoucherId) || null;
  const discount = appliedVoucher ? appliedVoucher.amountOff || 0 : 0;
  const total = Math.max(0, subtotal - discount);

  const handleCheckout = () => {
    if (items.length === 0) return;
    if (paymentMethod === "nets") {
      navigate("/nets-qr", { state: { totalAmount: total } });
    } else {
      navigate("/checkout"), { state: { totalAmount: total } };
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
              ) : (
                items.map((it) => (
                  <div key={it.id} className="cart-item">
                    <div className="cart-item-left">
                      <div className="cart-item-title">{it.name}</div>
                      {it.desc && <div className="cart-item-desc">{it.desc}</div>}
                    </div>

                    <div className="qty-controls" role="group" aria-label="quantity">
                      <button
                        className="qty-btn"
                        onClick={() => updateQty(it.id, it.qty - 1)}
                        aria-label="decrease"
                        type="button"
                      >
                        −
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

                    <div className="cart-item-price">SGD {(it.price * it.qty).toFixed(2)}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Payment and vouchers */}
        <aside className="cart-right">
          <div className="card payment-card">
            <h3 style={{ marginTop: 0, color: "var(--orange)" }}>Payment Method</h3>

            <div style={{ marginTop: 8 }}>
              {/* Use checkboxes-like toggle so selection can be cleared */}
              <label className="pay-row">
                <input
                  type="checkbox"
                  checked={paymentMethod === "cash"}
                  onChange={() => setPaymentMethod(paymentMethod === "cash" ? null : "cash")}
                />
                <span style={{ fontWeight: 700 }}>Cash</span>
              </label>

              <label className="pay-row">
                <input
                  type="checkbox"
                  checked={paymentMethod === "nets"}
                  onChange={() => setPaymentMethod(paymentMethod === "nets" ? null : "nets")}
                />
                <span style={{ fontWeight: 700 }}>NETS</span>
              </label>
            </div>

            <div className="payment-divider" />

            <div className="cart-footer" style={{ marginTop: 12, flexDirection: "column", alignItems: "stretch", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 16 }}>Subtotal</div>
                <div style={{ fontWeight: 700 }}>SGD {subtotal.toFixed(2)}</div>
              </div>

              {appliedVoucher && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "var(--muted)" }}>
                  <div>Voucher ({appliedVoucher.code})</div>
                  <div>-SGD {discount.toFixed(2)}</div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 18 }}>
                <div style={{ fontWeight: 700 }}>Total</div>
                <div style={{ fontWeight: 900 }}>SGD {total.toFixed(2)}</div>
              </div>

              <button className="btn btn-orange" onClick={handleCheckout} style={{ width: "100%" }}>
                Checkout
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
                      onChange={() => setAppliedVoucherId(appliedVoucherId === v.id ? null : v.id)}
                    />
                    <div>
                      <div style={{ fontWeight: 700 }}>{v.code}</div>
                      <div style={{ fontSize: 13, color: "var(--muted)" }}>{v.description}</div>
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
  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ color: "var(--orange)" }}>Checkout</h2>
      <p>Proceed with cash checkout flow (placeholder).</p>
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