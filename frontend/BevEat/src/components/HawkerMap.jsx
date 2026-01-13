import React, { useEffect, useMemo, useState } from "react";
import { GoogleMap, Marker, InfoWindow, useLoadScript } from "@react-google-maps/api";
import "../HawkerMap.css";

const defaultCenter = { lat: 1.3521, lng: 103.8198 }; // Singapore

export default function HawkerMap() {
  const [hawkers, setHawkers] = useState([]);
  const [selected, setSelected] = useState(null);

  const [userLoc, setUserLoc] = useState(null);
  const [locError, setLocError] = useState("");

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  // Fetch ALL hawker centres from backend (which pulls from Supabase)
  useEffect(() => {
    async function fetchHawkers() {
      setLoading(true);
      setErrorMsg("");

      try {
        const res = await fetch(`${BACKEND_URL}/hawker-centres`);
        if (!res.ok) throw new Error("Failed to fetch hawker centres");

        const data = await res.json();

        const cleaned = (data ?? [])
          .filter((h) => h.latitude != null && h.longitude != null)
          .map((h) => ({
            ...h,
            latitude: Number(h.latitude),
            longitude: Number(h.longitude),
          }))
          .filter((h) => Number.isFinite(h.latitude) && Number.isFinite(h.longitude));

        setHawkers(cleaned);
      } catch (err) {
        console.error(err);
        setErrorMsg(err.message || "Error loading hawker centres");
      } finally {
        setLoading(false);
      }
    }

    fetchHawkers();
  }, [BACKEND_URL]);

  // Ask for user's location
  function requestUserLocation() {
    setLocError("");

    if (!navigator.geolocation) {
      setLocError("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLoc({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        setLocError(err.message || "Location permission denied.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

    useEffect(() => {
    requestUserLocation();
    }, []);

  // Map center priority: user → first hawker → SG
  const mapCenter = useMemo(() => {
    if (userLoc) return userLoc;
    if (hawkers.length > 0) {
      return { lat: hawkers[0].latitude, lng: hawkers[0].longitude };
    }
    return defaultCenter;
  }, [userLoc, hawkers]);

  if (loadError) return <div className="hawker-map-error">Google Maps failed to load.</div>;
  if (!isLoaded) return <div>Loading Google Maps…</div>;

  return (
    <div className="hawker-map-wrapper">
      <div className="hawker-map-card">

        {locError && <div className="hawker-map-error" style={{ marginTop: 10 }}>{locError}</div>}
        {errorMsg && <div className="hawker-map-error" style={{ marginTop: 10 }}>{errorMsg}</div>}

        {/* Map */}
        <GoogleMap
          mapContainerClassName="hawker-map-container"
          center={mapCenter}
          zoom={12}
          options={{ clickableIcons: false }}
        >
          {/* User marker */}
          {userLoc && (
            <Marker
              position={userLoc}
              icon={{ url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png" }}
            />
          )}

          {/* Hawker markers */}
          {hawkers.map((h) => (
            <Marker
              key={h.id}
              position={{ lat: h.latitude, lng: h.longitude }}
              title={h.name}
              onClick={() => setSelected(h)}
            />
          ))}

          {/* Info window */}
          {selected && (
            <InfoWindow
              position={{ lat: selected.latitude, lng: selected.longitude }}
              onCloseClick={() => setSelected(null)}
            >
              <div className="hawker-info-window">
                <div className="hawker-info-title">{selected.name}</div>

                {selected.photo_url ? (
                    <img
                    src={selected.photo_url}
                    alt={selected.name}
                    className="hawker-info-img"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                        // hides broken images instead of showing the broken icon
                        e.currentTarget.style.display = "none";
                    }}
                    />
                ) : (
                    <div className="hawker-info-noimg">No photo available</div>
                )}
                </div>
            </InfoWindow>
          )}
        </GoogleMap>

        {/* Footer */}
        <div className="hawker-hint" style={{ marginTop: 10 }}>
          {loading
            ? "Loading hawker centres…"
            : `Showing ${hawkers.length} hawker centres`}
        </div>
      </div>
    </div>
  );
}
