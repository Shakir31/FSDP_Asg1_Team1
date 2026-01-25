import React, { useEffect, useState, useRef } from "react";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import "../HawkerMap.css";

const libraries = ["places"];
const defaultCenter = { lat: 1.3521, lng: 103.8198 }; // Singapore

export default function HawkerMap() {
  const mapRef = useRef(null);
  
  // -- State --
  const [hawkers, setHawkers] = useState([]);
  const [selected, setSelected] = useState(null);
  
  // Google Places State
  const [googleDetails, setGoogleDetails] = useState(null);
  const [placesError, setPlacesError] = useState("");
  const [placesLoading, setPlacesLoading] = useState(false);
  
  const placesCacheRef = useRef(new Map()); 

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  // -- Effects --
  useEffect(() => {
    async function fetchHawkers() {
      try {
        const res = await fetch(`${BACKEND_URL}/hawker-centres`);
        if (!res.ok) throw new Error("Failed to fetch hawkers");
        const data = await res.json();
        const validHawkers = data.filter(h => h.latitude && h.longitude);
        setHawkers(validHawkers);
      } catch (err) {
        console.error(err);
      }
    }
    fetchHawkers();
  }, [BACKEND_URL]);

  // -- Google Places Logic --
  async function fetchGoogleDetailsForHawker(h) {
    setPlacesError("");

    if (!mapRef.current || !window.google?.maps?.places) {
      setPlacesError("Places library not loaded yet.");
      return null;
    }

    if (placesCacheRef.current.has(h.stallid || h.id)) {
      return placesCacheRef.current.get(h.stallid || h.id);
    }

    setPlacesLoading(true);

    try {
      const service = new window.google.maps.places.PlacesService(mapRef.current);

      const placeId = await new Promise((resolve, reject) => {
        service.findPlaceFromQuery(
          {
            query: `${h.name} Singapore`,
            fields: ["place_id", "name", "geometry"],
            locationBias: new window.google.maps.Circle({
              center: { lat: parseFloat(h.latitude), lng: parseFloat(h.longitude) },
              radius: 500,
            }),
          },
          (results, status) => {
            if (status !== window.google.maps.places.PlacesServiceStatus.OK || !results?.[0]) {
              resolve(null);
              return;
            }
            resolve(results[0].place_id);
          }
        );
      });

      if (!placeId) {
        throw new Error("Place not found on Google Maps");
      }

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

      placesCacheRef.current.set(h.stallid || h.id, cleaned);
      return cleaned;
    } catch (e) {
      console.error(e);
      setPlacesError(e.message || "Failed to load Google place details.");
      return null;
    } finally {
      setPlacesLoading(false);
    }
  }

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading Maps...</div>;

  return (
    <div className="hawker-map-wrapper">
      <div className="hawker-map-card hawker-layout">
        
        <div className="hawker-map-container">
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            zoom={12}
            center={defaultCenter}
            onLoad={(map) => (mapRef.current = map)}
            onClick={() => {
              setSelected(null);
              setGoogleDetails(null);
            }}
          >
            {hawkers.map((h) => (
              <Marker
                key={h.stallid || h.id}
                position={{ lat: parseFloat(h.latitude), lng: parseFloat(h.longitude) }}
                onClick={async () => {
                  setSelected(h);
                  setGoogleDetails(null);
                  mapRef.current?.panTo({ lat: parseFloat(h.latitude), lng: parseFloat(h.longitude) });
                  
                  const details = await fetchGoogleDetailsForHawker(h);
                  if (details) setGoogleDetails(details);
                }}
              />
            ))}
          </GoogleMap>
        </div>

        {selected && (
          <div className="hawker-sidepanel">
             <button
                className="hawker-sidepanel-close"
                onClick={() => { setSelected(null); setGoogleDetails(null); }}
                aria-label="Close"
              >
              </button>

              <div className="hawker-sidepanel-content">
                <h3 className="hawker-info-title">{selected.name}</h3>
                {selected.photo_url ? (
                  <img src={selected.photo_url} alt={selected.name} className="hawker-info-img" />
                ) : (
                   <div className="hawker-info-noimg">No photo available</div>
                )}
                
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

                <p style={{marginTop: "20px"}}>
                   {selected.address_myenv || selected.address}
                </p>
              </div>
          </div>
        )}
      </div>
    </div>
  );
}