import React, { useState } from "react";
import { X, RefreshCw } from "lucide-react";
import "../PhotoCustomizer.css";

const FILTER_PRESETS = {
  original: {
    name: "Original",
    css: "none",
    cloudinary: "",
  },
  vibrant: {
    name: "Vibrant",
    css: "brightness(1.1) contrast(1.15) saturate(1.3)",
    cloudinary: "e_brightness:10/e_contrast:15/e_saturation:30",
  },
  warm: {
    name: "Warm",
    css: "brightness(1.05) saturate(1.2) sepia(0.1)",
    cloudinary: "e_brightness:5/e_saturation:20/e_sepia:10",
  },
  fresh: {
    name: "Fresh",
    css: "brightness(1.08) contrast(1.1) saturate(0.95)",
    cloudinary: "e_brightness:8/e_contrast:10/e_saturation:-5",
  },
  dramatic: {
    name: "Dramatic",
    css: "contrast(1.25) saturate(1.1) brightness(0.95)",
    cloudinary: "e_contrast:25/e_saturation:10/e_brightness:-5",
  },
};

export default function PhotoCustomizer({ imageUrl, onApply, onCancel }) {
  const [selectedFilter, setSelectedFilter] = useState("original");
  const [showComparison, setShowComparison] = useState(false);

  const currentFilter = FILTER_PRESETS[selectedFilter];

  function handleApply() {
    onApply(currentFilter.cloudinary);
  }

  return (
    <div className="photo-customizer-overlay" onClick={onCancel}>
      <div
        className="photo-customizer-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="customizer-header">
          <h3>Customize Your Photo</h3>
          <button className="customizer-close" onClick={onCancel}>
            <X size={24} />
          </button>
        </div>

        <div className="customizer-content">
          {/* Preview Section */}
          <div className="preview-section">
            {showComparison ? (
              <div className="comparison-container">
                <div className="comparison-side">
                  <img
                    src={imageUrl}
                    alt="Original"
                    className="customizer-preview"
                  />
                  <span className="comparison-label">Before</span>
                </div>
                <div className="comparison-side">
                  <img
                    src={imageUrl}
                    alt="Filtered"
                    className="customizer-preview"
                    style={{ filter: currentFilter.css }}
                  />
                  <span className="comparison-label">After</span>
                </div>
              </div>
            ) : (
              <img
                src={imageUrl}
                alt="Preview"
                className="customizer-preview"
                style={{ filter: currentFilter.css }}
              />
            )}
          </div>

          {/* Comparison Toggle */}
          <button
            className="comparison-toggle"
            onClick={() => setShowComparison(!showComparison)}
          >
            <RefreshCw size={16} />
            {showComparison ? "Hide Comparison" : "Show Before/After"}
          </button>

          {/* Filter Presets */}
          <div className="filter-presets">
            {Object.entries(FILTER_PRESETS).map(([key, filter]) => (
              <button
                key={key}
                className={`filter-button ${
                  selectedFilter === key ? "active" : ""
                }`}
                onClick={() => setSelectedFilter(key)}
              >
                <div className="filter-preview-thumb">
                  <img
                    src={imageUrl}
                    alt={filter.name}
                    style={{ filter: filter.css }}
                  />
                </div>
                <span className="filter-name">{filter.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="customizer-actions">
          <button className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="btn btn-orange"
            onClick={handleApply}
            disabled={selectedFilter === "original"}
          >
            Apply Filter
          </button>
        </div>
      </div>
    </div>
  );
}
