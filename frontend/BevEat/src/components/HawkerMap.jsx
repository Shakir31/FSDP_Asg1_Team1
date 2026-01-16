import React, { useEffect, useMemo, useState, useRef } from "react";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import "../HawkerMap.css";
import { MarkerClusterer } from "@googlemaps/markerclusterer";

const defaultCenter = { lat: 1.3521, lng: 103.8198 }; // Singapore

export default function HawkerMap() {
  const mapRef = useRef(null);
  const clustererRef = useRef(null);
  const markerRefs = useRef([]);

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

  // Detect mobile (and update on resize)
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 768px)").matches : false
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 768px)");
    const handler = (e) => setIsMobile(e.matches);

    // support older browsers
    if (mq.addEventListener) mq.addEventListener("change", handler);
    else mq.addListener(handler);

    setIsMobile(mq.matches);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handler);
      else mq.removeListener(handler);
    };
  }, []);

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
      { enableHighAccuracy: true }
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

  // shared content (used by both desktop & mobile UI)
  const DetailsContent = ({ h }) => (
    <div className="hawker-details">
      <div className="hawker-info-title">{h.name}</div>

      {h.photo_url ? (
        <div className="hawker-img-frame">
          <img
            src={h.photo_url}
            alt={h.name}
            className="hawker-info-img"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
      ) : (
        <div className="hawker-info-noimg">No photo available</div>
      )}

      {/* Directions */}
      <div className="hawker-details-actions">
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            `${h.latitude},${h.longitude}`
          )}`}
          target="_blank"
          rel="noreferrer"
        >
          Directions
        </a>
      </div>
    </div>
  );

  return (
    <div className="hawker-map-wrapper">
      <div className="hawker-map-card hawker-layout">
        {/* LEFT: MAP */}
        <div className="hawker-map-area">
          {/* map */}
          <GoogleMap
              mapContainerClassName="hawker-map-container"
              center={mapCenter}
              zoom={12}
              onLoad={(map) => {
                mapRef.current = map;
                map.setOptions({ clickableIcons: false });
                // Create clusterer once
                clustererRef.current = new MarkerClusterer({ map });
              }}
              onUnmount={() => {
                // Cleanup
                if (clustererRef.current) clustererRef.current.setMap(null);
                clustererRef.current = null;
                markerRefs.current = [];
              }}
          >
            {/* user marker */}
            {userLoc && (
              <Marker
                position={userLoc}
                icon={{ url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png" }}
              />
            )}

            {/* hawker markers */}
            {hawkers.map((h) => {
            const isSelected = selected?.id === h.id;

            return (
              <Marker
                key={h.id}
                position={{ lat: h.latitude, lng: h.longitude }}
                title={h.name}
                icon={{
                  url: isSelected
                    ? "http://maps.google.com/mapfiles/ms/icons/orange-dot.png"
                    : "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                }}
                onLoad={(marker) => {
                markerRefs.current.push(marker);
                clustererRef.current?.addMarker(marker);
                }}
                onUnmount={(marker) => {
                  clustererRef.current?.removeMarker(marker);
                  markerRefs.current = markerRefs.current.filter((m) => m !== marker);
                }}
                onClick={() => {
                  setSelected(h);
                  mapRef.current?.panTo({ lat: h.latitude, lng: h.longitude });
                }}
              />
            );
          })}
            </GoogleMap>

          {/* Footer */}
          <div className="hawker-hint" style={{ marginTop: 10 }}>
            {loading ? "Loading hawker centres…" : `Showing ${hawkers.length} hawker centres`}
          </div>
        </div>

        {/* RIGHT: SIDE PANEL (Desktop) */}
        {!isMobile && (
          <div className={`hawker-sidepanel ${selected ? "open" : ""}`}>
            {!selected ? (
              <div className="hawker-sidepanel-empty">
                <h3>Select a hawker</h3>
                <p>Click a marker to view details here.</p>
              </div>
            ) : (
              <div className="hawker-sidepanel-content">
                <button className="hawker-sidepanel-close" onClick={() => setSelected(null)}>
                  ✕
                </button>
                <DetailsContent h={selected} />
              </div>
            )}
          </div>
        )}

        {/* Mobile: bottom sheet (keep your existing code) */}
        {selected && isMobile && (
          <div className="hawker-sheet-backdrop" onClick={() => setSelected(null)} role="button" tabIndex={-1}>
            <div className="hawker-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
              <button className="hawker-sheet-close" onClick={() => setSelected(null)}>✕</button>
              <DetailsContent h={selected} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}