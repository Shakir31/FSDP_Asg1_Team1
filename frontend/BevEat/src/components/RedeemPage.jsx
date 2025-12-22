import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../RedeemPage.css";

export default function RedeemPage() {
  const [userCoins, setUserCoins] = useState(0);
  const [availableVouchers, setAvailableVouchers] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Get token helper
  const getToken = () => {
    return localStorage.getItem("token") || sessionStorage.getItem("token");
  };

  // Fetch user coins
  const fetchCoins = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch("http://localhost:3000/coins/balance", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUserCoins(data.coins || 0);
      }
    } catch (err) {
      console.error("Error fetching coins:", err);
    }
  };

  // Fetch available vouchers
  const fetchVouchers = async () => {
    try {
      const res = await fetch("http://localhost:3000/vouchers");
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map((v) => ({
          id: v.voucherid,
          title: v.name,
          description: v.description,
          cost: v.coincost,
          quantity: v.quantityavailable,
          expiry: v.expirydate,
        }));
        setAvailableVouchers(mapped);
      }
    } catch (err) {
      console.error("Error fetching vouchers:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchCoins();
    fetchVouchers();
  }, []);

  // Handle voucher redemption
  const handleRedeem = async (voucher) => {
    const token = getToken();
    if (!token) {
      alert("Please login to redeem vouchers.");
      navigate("/login");
      return;
    }

    if (userCoins < voucher.cost) {
      alert("Insufficient coins!");
      return;
    }

    if (
      !window.confirm(`Redeem "${voucher.title}" for ${voucher.cost} coins?`)
    ) {
      return;
    }

    setLoadingId(voucher.id);

    try {
      const res = await fetch("http://localhost:3000/vouchers/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ voucherId: voucher.id }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Voucher redeemed successfully!");
        // Refresh coins and vouchers after redemption
        await fetchCoins();
        await fetchVouchers();
      } else {
        alert(`Redemption failed: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Redemption error:", err);
      alert(`Error: ${err.message}`);
    } finally {
      setLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="redeem-container">
        <h2>Loading...</h2>
      </div>
    );
  }

  return (
    <div className="redeem-container">
      <h2>Redeem Vouchers</h2>
      <div className="coins">
        Your coins: <strong>{userCoins}</strong>
      </div>

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
                <button
                  className="btn btn-orange"
                  disabled={loadingId === v.id || userCoins < v.cost}
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
