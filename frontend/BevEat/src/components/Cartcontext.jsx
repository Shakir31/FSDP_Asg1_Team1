import React, { createContext, useEffect, useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("cart") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

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

  const clear = () => setCart([]);

  const total = cart.reduce((s, i) => s + (i.price || 0) * i.qty, 0);

  return (
    <CartContext.Provider value={{ cart, addItem, updateQty, removeItem, clear, total }}>
      {children}
    </CartContext.Provider>
  );
}


export function CartItem({ item }) {
  const { updateQty, removeItem } = useContext(CartContext);

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center", padding: 8, borderBottom: "1px solid #eee" }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600 }}>{item.name}</div>
        <div style={{ color: "#666" }}>{item.description || ""}</div>
      </div>
      <div style={{ width: 120, textAlign: "right" }}>S${(item.price || 0).toFixed(2)}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <button onClick={() => updateQty(item.id, item.qty - 1)}>-</button>
        <div>{item.qty}</div>
        <button onClick={() => updateQty(item.id, item.qty + 1)}>+</button>
      </div>
      <div>
        <button onClick={() => removeItem(item.id)}>Remove</button>
      </div>
    </div>
  );
}

export function CartPage() {
  const { cart, total } = useContext(CartContext);
  const navigate = useNavigate();

  return (
    <div style={{ padding: 20 }}>
      <h2>Your Cart</h2>
      {cart.length === 0 ? (
        <div>Your cart is empty.</div>
      ) : (
        <>
          <div style={{ border: "1px solid #ddd", borderRadius: 6 }}>
            {cart.map((item) => (
              <CartItem key={item.id} item={item} />
            ))}
          </div>
          <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 18 }}>Total: S${total.toFixed(2)}</div>
            <div>
              <button onClick={() => navigate("/checkout")}>Checkout</button>
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