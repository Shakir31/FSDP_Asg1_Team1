import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "../RedeemPage.css";

export default function RedeemPage() {
  const [userCoins, setUserCoins] = useState(0);
  const [availableVouchers, setAvailableVouchers] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [missions, setMissions] = useState([]);
  const [missionsLoading, setMissionsLoading] = useState(true);
  const [claimingMissionId, setClaimingMissionId] = useState(null);
  const [claimedIds, setClaimedIds] = useState(new Set());
  const [countdown, setCountdown] = useState("");
  const timerRef = useRef(null);
  const currentDateRef = useRef(new Date().toISOString().slice(0, 10));

  const navigate = useNavigate();

  const CLAIMS_KEY = "dailyMissionsClaims";

  const getToken = () => {
    return localStorage.getItem("token") || sessionStorage.getItem("token");
  };

  const loadLocalClaims = () => {
    try {
      const raw = localStorage.getItem(CLAIMS_KEY);
      if (!raw) return { date: null, ids: [] };
      const parsed = JSON.parse(raw);
      return parsed || { date: null, ids: [] };
    } catch {
      return { date: null, ids: [] };
    }
  };

  const saveLocalClaims = (idsSet) => {
    const ids = Array.from(idsSet);
    const payload = { date: new Date().toISOString().slice(0, 10), ids };
    localStorage.setItem(CLAIMS_KEY, JSON.stringify(payload));
  };

  const clearLocalClaims = () => {
    localStorage.removeItem(CLAIMS_KEY);
  };

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
      toast.error("Failed to load vouchers");
    } finally {
      setLoading(false);
    }
  };

  // Fetch available daily missions from backend (expects an endpoint like /missions/daily)
  const fetchMissions = async () => {
    setMissionsLoading(true);
    try {
      const res = await fetch("http://localhost:3000/missions/daily");
      if (res.ok) {
        const data = await res.json();
        // expected shape: [{ id, title, description, rewardCoins, completed }]
        setMissions(data || []);
        // combine server-completed and local claims for today
        const serverCompleted = new Set((data || []).filter((m) => m.completed).map((m) => m.id));
        const local = loadLocalClaims();
        const today = new Date().toISOString().slice(0, 10);
        let initialClaimed = new Set();
        if (local.date === today) {
          initialClaimed = new Set(local.ids);
        }
        // union
        const union = new Set([...serverCompleted, ...initialClaimed]);
        setClaimedIds(union);
      } else {
        // no missions endpoint or none available
        setMissions([]);
      }
    } catch (err) {
      console.error("Error fetching missions:", err);
      setMissions([]);
    } finally {
      setMissionsLoading(false);
    }
  };

  // Claim mission (POST to /missions/claim or similar)
  const handleClaimMission = async (mission) => {
    const token = getToken();
    if (!token) {
      toast.warning("Please login to claim missions.");
      navigate("/login");
      return;
    }

    if (claimedIds.has(mission.id)) {
      toast.info("Already claimed.");
      return;
    }

    setClaimingMissionId(mission.id);

    try {
      const res = await fetch("http://localhost:3000/missions/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ missionId: mission.id }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`+${mission.rewardCoins} coins`);
        // update UI: mark claimed and refresh coins
        setClaimedIds((prev) => {
          const next = new Set(prev);
          next.add(mission.id);
          saveLocalClaims(next);
          return next;
        });
        await fetchCoins();
      } else {
        toast.error(data.error || "Failed to claim mission");
      }
    } catch (err) {
      console.error("Claim error:", err);
      toast.error("Error claiming mission");
    } finally {
      setClaimingMissionId(null);
    }
  };

  // Countdown to next local midnight and reset daily claims once day flips
  const updateCountdown = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const diff = tomorrow - now;
    if (diff <= 0) {
      setCountdown("00:00:00");
    } else {
      const hrs = String(Math.floor(diff / 3600000)).padStart(2, "0");
      const mins = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
      const secs = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
      setCountdown(`${hrs}:${mins}:${secs}`);
    }

    // detect date change and reset local claims once
    const today = new Date().toISOString().slice(0, 10);
    if (currentDateRef.current !== today) {
      currentDateRef.current = today;
      clearLocalClaims();
      setClaimedIds(new Set());
      // refresh missions and coins for new day
      fetchMissions();
      fetchCoins();
    }
  };

  useEffect(() => {
    // initialize claimed ids from local storage if same day
    const local = loadLocalClaims();
    const today = new Date().toISOString().slice(0, 10);
    if (local.date === today && Array.isArray(local.ids)) {
      setClaimedIds(new Set(local.ids));
    } else {
      clearLocalClaims();
    }

    fetchCoins();
    fetchVouchers();
    fetchMissions();
    updateCountdown();
    timerRef.current = setInterval(updateCountdown, 1000);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRedeem = async (voucher) => {
    const token = getToken();
    if (!token) {
      toast.warning("Please login to redeem vouchers.");
      navigate("/login");
      return;
    }

    if (userCoins < voucher.cost) {
      toast.error("Insufficient coins!");
      return;
    }

    if (!window.confirm(`Redeem "${voucher.title}" for ${voucher.cost} coins?`)) {
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
        toast.success("Voucher redeemed successfully!");
        await fetchCoins();
        await fetchVouchers();
      } else {
        toast.error(`Redemption failed: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Redemption error:", err);
      toast.error(`Error: ${err.message}`);
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
      <h2 className="redeem-header">Redeem Vouchers</h2>

      <div className="coins-card">
        <div className="coins-left">
          <div className="coins-label">Your coins</div>
          <div className="coins-value">{userCoins}</div>
        </div>
        <div className="coins-actions">
          <button className="btn btn-primary" onClick={() => { fetchCoins(); fetchMissions(); }}>
            Refresh
          </button>
        </div>
      </div>

      <div className="voucher-list">
        {availableVouchers.length === 0 ? (
          <div className="no-vouchers">No vouchers available right now.</div>
        ) : (
          availableVouchers.map((v) => (
            <div key={v.id} className="voucher-card">
              <div className="voucher-left">
                <div className="voucher-title">{v.title}</div>
                <div className="voucher-desc">{v.description}</div>
                <div className="voucher-expiry">Expires: {v.expiry}</div>
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

      <hr className="section-divider" />

      <div className="missions-section">
        <div className="missions-header">
          <h3>Daily Missions</h3>
          <div className="missions-reset">Resets in: <strong>{countdown}</strong></div>
        </div>

        {missionsLoading ? (
          <div>Loading missions…</div>
        ) : missions.length === 0 ? (
          <div className="no-missions">No daily missions available.</div>
        ) : (
          missions.map((m) => {
            const claimed = claimedIds.has(m.id);
            return (
              <div key={m.id} className={`mission-card ${claimed ? "mission-claimed" : ""}`}>
                <div className="mission-info">
                  <div className="mission-title">{m.title}</div>
                  <div className="mission-desc">{m.description}</div>
                </div>
                <div className="mission-meta">
                  <div className="mission-reward">+{m.rewardCoins} coins</div>
                  <button
                    className={`btn ${claimed ? "btn-disabled" : "btn-orange"}`}
                    disabled={claimed || claimingMissionId === m.id}
                    onClick={() => handleClaimMission(m)}
                  >
                    {claimed ? "Claimed" : claimingMissionId === m.id ? "Claiming…" : "Claim"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
