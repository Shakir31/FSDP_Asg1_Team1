import React, { useContext, useEffect, useState } from "react";
import { CartContext } from "./Cartcontext";
import "../RedeemPage.css";
import { useNavigate } from "react-router-dom";

export default function RedeemPage() {
  const { availableVouchers, userCoins, redeemVoucher, refreshCoins, applyVoucher } = useContext(CartContext);
  const [loadingId, setLoadingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // refresh coins when page mounts
    refreshCoins && refreshCoins();
  }, []);

  async function handleRedeem(v) {
    if (!confirm(`Redeem "${v.title}" for ${v.cost} coins?`)) return;
    setLoadingId(v.id);
    const res = await redeemVoucher(v.id);
    setLoadingId(null);
    if (res.ok) {
      // backend should return voucher object; apply it locally
      if (res.data?.voucher) {
        applyVoucher(res.data.voucher);
        alert("Redeemed and applied!");
        navigate("/cart");
      } else {
        alert("Redeemed. Check your vouchers in profile.");
      }
    } else {
      alert("Redeem failed: " + (res.error || "unknown"));
    }
  }

  return (
    <div className="redeem-container">
      <h2>Redeem Vouchers</h2>
      <div className="coins">Your coins: <strong>{userCoins ?? "-"}</strong></div>

      <div className="voucher-list">
        {availableVouchers.length === 0 ? (
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
                <button className="btn btn-orange" disabled={loadingId === v.id || (userCoins != null && userCoins < v.cost)} onClick={() => handleRedeem(v)}>
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