import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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

  // store past orders so Profile can show them
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem("orders");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("orders", JSON.stringify(orders));
  }, [orders]);

  // fetch orders from backend on load (use /orders/history, not /orders)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { res } = await tryFetchVariants("GET", "/orders/history");
        const data = await res.json();
        if (mounted && Array.isArray(data)) {
          setOrders(data);
        }
      } catch (err) {
        // keep local orders if backend unavailable — log for debugging
        console.debug("Could not fetch orders from backend:", err?.message || err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

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
        orders,
        setOrders,
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
    setItems,
    setOrders,
    updateQty,
    vouchers,
    appliedVoucherId,
    setAppliedVoucherId,
    paymentMethod,
    setPaymentMethod,
  } = useCart();

  const [placing, setPlacing] = useState(false);

  const subtotal = calcSubtotal(items);
  const appliedVoucher = vouchers.find((v) => v.id === appliedVoucherId) || null;
  const discount = appliedVoucher ? appliedVoucher.amountOff || 0 : 0;
  const total = Math.max(0, subtotal - discount);

  // POST order to backend and navigate depending on payment method
  const handleCheckout = async () => {
    if (items.length === 0) return;
    if (!paymentMethod) {
      alert("Please select a payment method.");
      return;
    }

    const payload = {
      items: items.map((it) => ({
        id: it.id,
        name: it.name,
        qty: Number(it.qty || 0),
        price: Number(Number(it.price || 0).toFixed(2)),
      })),
      paymentMethod,
      voucherId: appliedVoucherId,
      subtotal: Number(Number(subtotal || 0).toFixed(2)),
      subtotalAmount: Number(Number(subtotal || 0).toFixed(2)),
      discount: Number(Number(discount || 0).toFixed(2)),
      total: Number(Number(total || 0).toFixed(2)),
      totalAmount: Number(Number(total || 0).toFixed(2)),
      placedAt: new Date().toISOString(),
    };

    // try backend variants (/orders, /api/orders, relative proxy). falls back to local-only if none succeed.
    setPlacing(true);
    try {
      const { res, url } = await tryFetchVariants("POST", "/orders", payload);
      console.log("Order POST succeeded at:", url);
      const data = await res.json();

      // save order into app state so Profile can display it
      setOrders((prev) => [data, ...prev]);

      // Clear cart and voucher
      setItems([]);
      setAppliedVoucherId(null);

      // Navigate to payment flow based on method
      if (paymentMethod === "nets") {
        // send to NETS QR flow with order and amount
        navigate("/nets-qr", { state: { totalAmount: total, order: data } });
      } else {
        // cash: show checkout/order placed page (pay on delivery)
        navigate("/checkout", { state: { order: data } });
      }
      return;
    } catch (err) {
      console.error("checkout error:", err);

      // Fallback: persist a local order so Profile can show it
      const localOrder = {
        id: `local-${Date.now()}`,
        ...payload,
        status: "placed",
        note:
          err?.message === "BACKEND_NOT_FOUND"
            ? "Saved locally because backend /orders was not found (404)."
            : "Saved locally (network/backend error).",
      };

      setOrders((prev) => [localOrder, ...prev]);
      setItems([]);
      setAppliedVoucherId(null);
      // Navigate to the appropriate page even when saved locally
      if (paymentMethod === "nets") {
        navigate("/nets-qr", { state: { totalAmount: total, order: localOrder, offline: true } });
      } else {
        navigate("/checkout", { state: { order: localOrder, offline: true } });
      }

      alert(
        "Order saved locally. Backend unreachable. Please check your network connection."
      );
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
                        {it.desc && <div className="cart-item-desc">{it.desc}</div>}
                      </div>

                      <div className="qty-controls" role="group" aria-label="quantity">
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

                      <div className="cart-item-price">SGD {(it.price * it.qty).toFixed(2)}</div>
                    </div>
                  );
                })}
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
  const location = useLocation();
  const order = location?.state?.order || null;

  // If an order exists in state show order placed / pay on delivery message
  if (order) {
    return (
      <div style={{ padding: 24 }}>
        <h2 style={{ color: "var(--orange)" }}>Order Placed</h2>
        <p>Your order (ID: {order.id || "—"}) has been placed. Please pay when you receive the food.</p>
        <p style={{ color: "var(--muted)" }}>We will notify you when the order is being prepared.</p>
      </div>
    );
  }

  // Fallback placeholder if navigated directly
  return (
    <div style={{ padding: 24, maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ color: "var(--orange)" }}>Checkout Confirmation</h2>
      
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3>Order Summary</h3>
        {items.map(item => (
            <div key={item.id} style={{display:'flex', justifyContent:'space-between', marginBottom:'8px'}}>
                <span>{item.qty}x {item.name}</span>
                <span>${(item.price * item.qty).toFixed(2)}</span>
            </div>
        ))}
        
        {discount > 0 && (
             <div style={{display:'flex', justifyContent:'space-between', marginBottom:'8px', color: '#666'}}>
                <span>Discount ({appliedVoucher?.code}):</span>
                <span>-${discount.toFixed(2)}</span>
            </div>
        )}

        <hr style={{borderColor: '#eee', margin:'10px 0'}}/>
        <div style={{display:'flex', justifyContent:'space-between', fontWeight:'bold', fontSize:'1.2em'}}>
            <span>Total:</span>
            <span>${totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <p>Payment Method: Cash (Pay at counter)</p>
      
      <button 
        className="btn btn-orange" 
        style={{ width: "100%", fontSize: '1.1em' }}
        onClick={handleConfirmPayment}
        disabled={loading || items.length === 0}
      >
        {loading ? "Processing..." : "Confirm & Place Order"}
      </button>
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

// helper: resolve API base and try multiple endpoint variants (/orders and /api/orders)
const resolveApiBase = () => {
  const viteApi = import.meta?.env?.VITE_API_BASE || "";
  const savedApi = localStorage.getItem("API_BASE") || "";
  const fallback = "http://localhost:3000";
  return (viteApi || savedApi || fallback).replace(/\/$/, "");
};

async function tryFetchVariants(method, endpoint, body) {
  const base = resolveApiBase();
  const variants = [
    `${base}${endpoint}`,
    `${base}/api${endpoint}`,
    endpoint,
    `/api${endpoint}`,
  ].filter(Boolean);

  let lastError = null;
  for (const url of variants) {
    try {
      const opts = {
        method,
        headers: { "Content-Type": "application/json" },
      };
      // attach bearer token if available (backend endpoints are protected)
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      if (token) {
        opts.headers.Authorization = `Bearer ${token}`;
      }
      if (body) {
        opts.body = JSON.stringify(body);
      }
      const res = await fetch(url, opts);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      return { res, url };
    } catch (err) {
      lastError = err;
      console.warn(`Fetch error (tried ${url}):`, err);
    }
  }
  throw lastError;
}