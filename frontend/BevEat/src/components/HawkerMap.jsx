import React, { useEffect, useMemo, useState, useRef } from "react";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import "../HawkerMap.css";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { useNavigate } from "react-router-dom";

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

  const [googleDetails, setGoogleDetails] = useState(null);
  const [placesError, setPlacesError] = useState("");
  const [placesLoading, setPlacesLoading] = useState(false);

  const navigate = useNavigate();

// Cache by hawker id so repeated clicks don’t spam the API
  const placesCacheRef = useRef(new Map()); 

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
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
  const DetailsContent = ({ h, onBrowseStalls }) => (
    <div className="hawker-details">
      <div className="hawker-info-title">{h.name}</div>

      <button
      type="button"
      className="hawker-browse-stalls-btn"
      onClick={onBrowseStalls}
    >
      Browse stalls
    </button>

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

      {/* Google Places enrichment */}
        <div className="hawker-google">
          {(placesLoading || placesError) && (
            <div className={`hawker-google-banner ${placesError ? "is-error" : ""}`}>
              {placesLoading ? (
                <span className="hawker-google-spinner" aria-hidden="true" />
              ) : (
                <span className="hawker-google-dot is-error" aria-hidden="true" />
              )}
              <span className="hawker-google-banner-text">
                {placesLoading ? "Fetching Google details…" : placesError}
              </span>
            </div>
          )}

          {googleDetails && (
            <div className="hawker-google-card">
              <div className="hawker-google-header">
                <div className="hawker-google-title">Google details</div>

                {typeof googleDetails.rating === "number" && (
                  <div className="hawker-google-rating">
                    <span className="hawker-google-star" aria-hidden="true">★</span>
                    <span className="hawker-google-rating-value">{googleDetails.rating.toFixed(1)}</span>
                    <span className="hawker-google-rating-count">
                      ({googleDetails.user_ratings_total?.toLocaleString?.() ?? 0})
                    </span>
                  </div>
                )}
              </div>

              <div className="hawker-google-grid">
                {googleDetails.opening_hours?.weekday_text && (
                  <details className="hawker-google-details">
                    <summary className="hawker-google-summary">
                      <span className="hawker-google-icon" aria-hidden="true">⏰</span>
                      <span>Opening hours</span>
                      <span className="hawker-google-chevron" aria-hidden="true">▾</span>
                    </summary>
                    <div className="hawker-google-hours">
                      {googleDetails.opening_hours.weekday_text.map((line) => {
                        const idx = line.indexOf(":");
                        const day = idx >= 0 ? line.slice(0, idx) : line;
                        const time = idx >= 0 ? line.slice(idx + 1).trim() : "";
                        return (
                          <div key={line} className="hawker-google-hours-line">
                            <span className="hawker-google-hours-day">{day}</span>
                            <span className="hawker-google-hours-time">{time}</span>
                          </div>
                        );
                      })}
                    </div>
                  </details>
                )}

                {googleDetails.formatted_address && (
                  <div className="hawker-google-row">
                    <span className="hawker-google-icon" aria-hidden="true">📍</span>
                    <span className="hawker-google-text">{googleDetails.formatted_address}</span>
                  </div>
                )}

                {googleDetails.formatted_phone_number && (
                  <div className="hawker-google-row">
                    <span className="hawker-google-icon" aria-hidden="true">📞</span>
                    <a className="hawker-google-link" href={`tel:${googleDetails.formatted_phone_number}`}>
                      {googleDetails.formatted_phone_number}
                    </a>
                  </div>
                )}
              </div>

              {googleDetails.google_maps_url && (
                <a
                  className="hawker-google-cta"
                  href={googleDetails.google_maps_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="hawker-google-icon" aria-hidden="true">🗺️</span>
                  <span className="hawker-google-cta-label">View on Google Maps</span>
                  <span className="hawker-google-cta-arrow" aria-hidden="true">↗</span>
                </a>
              )}
            </div>
          )}
        </div>
      </div>
  );

  async function fetchGoogleDetailsForHawker(h) {
  setPlacesError("");

  // Must have map + places library loaded
  if (!mapRef.current || !window.google?.maps?.places) {
    setPlacesError("Places library not loaded yet.");
    return null;
  }

  // Cache
  if (placesCacheRef.current.has(h.id)) {
    return placesCacheRef.current.get(h.id);
  }

  setPlacesLoading(true);

  try {
    const service = new window.google.maps.places.PlacesService(mapRef.current);

    // Find Place (gets place_id)
    const placeId = await new Promise((resolve, reject) => {
      service.findPlaceFromQuery(
        {
          query: `${h.name} Singapore`,
          fields: ["place_id", "name", "geometry"],
          // Bias search near your hawker coordinates
          locationBias: new window.google.maps.Circle({
            center: { lat: h.latitude, lng: h.longitude },
            radius: 1500,
          }),
        },
        (results, status) => {
          if (status !== window.google.maps.places.PlacesServiceStatus.OK || !results?.[0]) {
            reject(new Error(`findPlaceFromQuery failed: ${status}`));
            return;
          }
          resolve(results[0].place_id);
        }
      );
    });

    // Get Details (rating, hours, address, etc.)
    const details = await new Promise((resolve, reject) => {
      service.getDetails(
        {
          placeId,
          fields: [
            "name",
            "rating",
            "user_ratings_total",
            "formatted_address",
            "opening_hours",
            "formatted_phone_number",
            "url",
          ],
        },
        (place, status) => {
          if (status !== window.google.maps.places.PlacesServiceStatus.OK || !place) {
            reject(new Error(`getDetails failed: ${status}`));
            return;
          }
          resolve(place);
        }
      );
    });

    const cleaned = {
      name: details.name,
      rating: details.rating,
      user_ratings_total: details.user_ratings_total,
      formatted_address: details.formatted_address,
      opening_hours: details.opening_hours,
      formatted_phone_number: details.formatted_phone_number,
      google_maps_url: details.url,
    };

    placesCacheRef.current.set(h.id, cleaned);
    return cleaned;
  } catch (e) {
    console.error(e);
    setPlacesError(e.message || "Failed to load Google place details.");
    return null;
  } finally {
    setPlacesLoading(false);
  }
}

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
                onClick={async () => {
                  setSelected(h);
                  setGoogleDetails(null);
                  mapRef.current?.panTo({ lat: h.latitude, lng: h.longitude });

                  const details = await fetchGoogleDetailsForHawker(h);
                  setGoogleDetails(details);
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
              <>
                <button
                  className="hawker-sidepanel-close"
                  onClick={() => { setSelected(null); setGoogleDetails(null); }}
                  aria-label="Close"
                >
                  ✕
                </button>

                <div className="hawker-sidepanel-content">
                  <DetailsContent h={selected} onBrowseStalls={() => navigate(`/hawker-centres/${selected.id}`)} />
                </div>
              </>
            )}
          </div>
        )}

        {/* Mobile: bottom sheet (keep your existing code) */}
        {selected && isMobile && (
          <div className="hawker-sheet-backdrop" onClick={() => setSelected(null)} role="button" tabIndex={-1}>
            <div className="hawker-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
              <button className="hawker-sheet-close" onClick={() => setSelected(null)}>✕</button>
              <DetailsContent h={selected} onBrowseStalls={() => navigate(`/hawker-centres/${selected.id}`)}/>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}