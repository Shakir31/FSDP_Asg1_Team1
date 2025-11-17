import React, { useContext, useEffect, useState } from "react";
import { CartContext } from "./Cartcontext";
import "../RedeemPage.css";
import { useNavigate } from "react-router-dom";

export default function RedeemPage() {
  // guard if context is not provided
  const ctx = useContext(CartContext) || {};
  const {
    availableVouchers = [],
    userCoins = 0,
    redeemVoucher = async () => ({ ok: false }),
    refreshCoins,
    applyVoucher,
  } = ctx;

  const [loadingId, setLoadingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // refresh coins when page mounts (if function available)
    if (typeof refreshCoins === "function") refreshCoins();
  }, [refreshCoins]);

  async function handleRedeem(v) {
    if (!window.confirm(`Redeem "${v.title}" for ${v.cost} coins?`)) return;
    setLoadingId(v.id);
    try {
      const res = await redeemVoucher(v.id);
      setLoadingId(null);
      if (res?.ok) {
        if (res.data?.voucher && typeof applyVoucher === "function") {
          applyVoucher(res.data.voucher);
          alert("Redeemed and applied!");
          navigate("/cart");
        } else {
          alert("Redeemed. Check your vouchers in profile.");
        }
      } else {
        alert("Redeem failed: " + (res?.error || "unknown"));
      }
    } catch (err) {
      setLoadingId(null);
      alert("Redeem error: " + (err?.message || err));
    }
  }

  return (
    <div className="redeem-container">
      <h2>Redeem Vouchers</h2>
      <div className="coins">Your coins: <strong>{userCoins ?? "-"}</strong></div>

      <div className="voucher-list">
        {(!availableVouchers || availableVouchers.length === 0) ? (
          <div className="no-vouchers">No vouchers available right now.</div>
        ) : (
          availableVouchers.map((v) => (
            <div key={v.id} className="voucher-card">
              <div>
                <div className="voucher-title">{v.title}</div>
                <div className="voucher-desc">{v.description}</div>
              </div>
              <div className="voucher-meta">
                <div className="voucher-cost">{v.cost} coins</div>
                <button
                  className="btn btn-orange"
                  disabled={loadingId === v.id || (userCoins != null && userCoins < v.cost)}
                  onClick={() => handleRedeem(v)}
                >
                  {loadingId === v.id ? "Redeeming…" : "Redeem"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}