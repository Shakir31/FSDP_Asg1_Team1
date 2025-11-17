import React, { createContext, useEffect, useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../Cart.css";

export const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("cart") || "[]");
    } catch {
      return [];
    }
  });

  // voucher & coins state
  const [appliedVoucher, setAppliedVoucher] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("appliedVoucher") || "null");
    } catch {
      return null;
    }
  });
  const [userCoins, setUserCoins] = useState(null);
  const [availableVouchers, setAvailableVouchers] = useState([]);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("appliedVoucher", JSON.stringify(appliedVoucher));
  }, [appliedVoucher]);

  // load coins & vouchers on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    async function load() {
      try {
        // coins balance
        const bRes = await fetch("http://localhost:3000/coins/balance", {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        });
        if (bRes.ok) {
          const bData = await bRes.json();
          setUserCoins(bData.balance ?? bData.coins ?? null);
        }

        // available vouchers
        const vRes = await fetch("http://localhost:3000/vouchers/available");
        if (vRes.ok) {
          const vData = await vRes.json();
          setAvailableVouchers(Array.isArray(vData) ? vData : vData.vouchers || []);
        }
      } catch (err) {
        console.warn("load coins/vouchers failed:", err);
      }
    }
    load();
  }, []);

  const addItem = (item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, qty: i.qty + (item.qty || 1) } : i
        );
      }
      return [...prev, { ...item, qty: item.qty || 1 }];
    });
  };

  const updateQty = (id, qty) =>
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, qty: Math.max(1, qty) } : i))
        .filter((i) => i.qty > 0)
    );

  const removeItem = (id) => setCart((prev) => prev.filter((i) => i.id !== id));

  const clear = () => {
    setCart([]);
    setAppliedVoucher(null);
  };

  const subtotal = cart.reduce((s, i) => s + (i.price || 0) * i.qty, 0);

  // compute discount based on voucher shape: supports {type: 'percent', value: 10} or {type:'amount', value:5}
  const discount = (() => {
    if (!appliedVoucher) return 0;
    if (appliedVoucher.type === "percent") {
      return Math.round((subtotal * (appliedVoucher.value || 0)) / 100 * 100) / 100;
    }
    return Math.min(subtotal, appliedVoucher.value || 0);
  })();

  const total = Math.max(0, subtotal - discount);

  // apply voucher locally (doesn't verify/fetch)
  const applyVoucher = (voucher) => {
    setAppliedVoucher(voucher);
  };

  const removeVoucher = () => setAppliedVoucher(null);

  // redeem voucher: call backend to spend coins and generate voucher object
  const redeemVoucher = async (voucherId) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:3000/vouchers/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ voucherId }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Redeem failed ${res.status}`);
      }
      const data = await res.json();
      // backend should return the voucher object and updated coin balance
      if (data.voucher) {
        setAppliedVoucher(data.voucher);
        localStorage.setItem("appliedVoucher", JSON.stringify(data.voucher));
      }
      if (data.coins != null) setUserCoins(data.coins);
      return { ok: true, data };
    } catch (err) {
      console.error("redeemVoucher error:", err);
      return { ok: false, error: err.message || err };
    }
  };

  // refresh coin balance (call backend)
  const refreshCoins = async () => {
    const token = localStorage.getItem("token");
    try {
      const bRes = await fetch("http://localhost:3000/coins/balance", {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      if (bRes.ok) {
        const bData = await bRes.json();
        setUserCoins(bData.balance ?? bData.coins ?? null);
      }
    } catch (err) {
      console.warn("refreshCoins failed:", err);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addItem,
        updateQty,
        removeItem,
        clear,
        subtotal,
        discount,
        total,
        appliedVoucher,
        applyVoucher,
        removeVoucher,
        redeemVoucher,
        availableVouchers,
        userCoins,
        refreshCoins,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

/* --- Small UI components bundled here to avoid extra files --- */

export function CartItem({ item }) {
  const { updateQty, removeItem } = useContext(CartContext);

  return (
    <div className="cart-item">
      <div className="cart-item-left">
        <div className="cart-item-title">{item.name}</div>
        <div className="cart-item-desc">{item.description || ""}</div>
      </div>

      <div className="cart-item-price">S${(item.price || 0).toFixed(2)}</div>

      <div className="qty-controls">
        <button className="qty-btn" onClick={() => updateQty(item.id, item.qty - 1)}>-</button>
        <div className="qty-count">{item.qty}</div>
        <button className="qty-btn" onClick={() => updateQty(item.id, item.qty + 1)}>+</button>
      </div>

      <div>
        <button className="btn-remove" onClick={() => removeItem(item.id)}>Remove</button>
      </div>
    </div>
  );
}

export function CartPage() {
  const { cart, total, subtotal, discount, appliedVoucher, removeVoucher } = useContext(CartContext);
  const navigate = useNavigate();

  return (
    <div className="cart-container">
      <h2 className="cart-title">Your Cart</h2>
      {cart.length === 0 ? (
        <div className="cart-empty">Your cart is empty.</div>
      ) : (
        <>
          <div className="cart-list">
            {cart.map((item) => (
              <CartItem key={item.id} item={item} />
            ))}
          </div>

          <div className="cart-summary" style={{ marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <div>Subtotal</div>
              <div>S${subtotal.toFixed(2)}</div>
            </div>

            {appliedVoucher ? (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff7ef", padding: 10, borderRadius: 8, border: "1px dashed #ffd8b4" }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{appliedVoucher.title || "Voucher applied"}</div>
                  <div style={{ fontSize: 13, color: "#6b6b6b" }}>{appliedVoucher.description || ""}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700 }}>- S${discount.toFixed(2)}</div>
                  <button className="btn-ghost" onClick={() => removeVoucher()}>Remove</button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                <div />
                <div>
                  <button className="btn btn-orange" onClick={() => navigate("/redeem")}>Redeem vouchers</button>
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, alignItems: "center" }}>
              <div className="cart-total">Total: <span>S${total.toFixed(2)}</span></div>
              <div>
                <button className="btn btn-orange" onClick={() => navigate("/checkout")}>Checkout</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function CheckoutPage() {
  const { cart, total, clear } = useContext(CartContext);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", address: "" });
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return alert("Cart empty");
    setLoading(true);
    // Simulate request
    await new Promise((r) => setTimeout(r, 700));
    const order = { id: Date.now(), items: cart, total, customer: form };
    clear();
    setLoading(false);
    navigate("/checkout/success", { state: { order } });
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Checkout</h2>
      <form onSubmit={submit} style={{ maxWidth: 600, display: "grid", gap: 8 }}>
        <input placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <textarea placeholder="Delivery address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
        <div style={{ fontWeight: 600 }}>Total: S${total.toFixed(2)}</div>
        <div>
          <button type="submit" disabled={loading}>{loading ? "Placing order..." : "Place order"}</button>
        </div>
      </form>
    </div>
  );
}

export function CheckoutSuccess() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const order = state?.order;

  return (
    <div style={{ padding: 20 }}>
      <h2>Order Confirmed</h2>
      {!order ? (
        <div>No order data. <button onClick={() => navigate("/")}>Go home</button></div>
      ) : (
        <>
          <div>Order ID: {order.id}</div>
          <div>Customer: {order.customer?.name}</div>
          <div>Total: S${order.total.toFixed(2)}</div>
          <div style={{ marginTop: 12 }}>
            <button onClick={() => navigate("/stalls/1")}>Back to stalls</button>
          </div>
        </>
      )}
    </div>
  );
}