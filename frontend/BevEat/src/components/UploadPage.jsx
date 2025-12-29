import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Star, ArrowLeft, Check } from "lucide-react";
import "../UploadPage.css";

export default function UploadPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const urlStallId = searchParams.get("stallId");
  const urlMenuItemId = searchParams.get("menuItemId");
  const isFromOrder = urlStallId && urlMenuItemId;

  // Step management: 1 = Confirm Item, 2 = Upload Image, 3 = Write Review
  const [currentStep, setCurrentStep] = useState(1);

  const [stalls, setStalls] = useState([]);
  const [selectedStallId, setSelectedStallId] = useState(urlStallId || "");
  const [menuItems, setMenuItems] = useState([]);
  const [selectedMenuItemId, setSelectedMenuItemId] = useState(
    urlMenuItemId || ""
  );

  // Item details for display
  const [selectedStall, setSelectedStall] = useState(null);
  const [selectedMenuItem, setSelectedMenuItem] = useState(null);

  const [files, setFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");

  const [loading, setLoading] = useState(false);
  const [uploadedImageId, setUploadedImageId] = useState(null);

  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");

  // Fetch stalls on mount
  useEffect(() => {
    async function fetchStalls() {
      try {
        const res = await fetch("http://localhost:3000/stalls", {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        });
        if (!res.ok) throw new Error("Failed to fetch stalls");
        const data = await res.json();
        setStalls(data);

        // If from order, find the stall details
        if (isFromOrder && urlStallId) {
          const stall = data.find((s) => s.stallid === parseInt(urlStallId));
          setSelectedStall(stall);
        }
      } catch (err) {
        alert("Error loading stalls: " + err.message);
      }
    }
    fetchStalls();
  }, [token, isFromOrder, urlStallId]);

  // Fetch menu items when stall is selected
  useEffect(() => {
    async function fetchMenuItems() {
      if (!selectedStallId) {
        setMenuItems([]);
        setSelectedMenuItemId("");
        return;
      }
      try {
        const res = await fetch(
          `http://localhost:3000/stalls/${selectedStallId}/menu`,
          { headers: { Authorization: token ? `Bearer ${token}` : "" } }
        );
        if (!res.ok) throw new Error("Failed to fetch menu items");
        const data = await res.json();
        setMenuItems(data);

        // If from order, find the menu item details
        if (isFromOrder && urlMenuItemId) {
          const item = data.find(
            (m) => m.menuitemid === parseInt(urlMenuItemId)
          );
          setSelectedMenuItem(item);
        }
      } catch (err) {
        alert("Error loading menu items: " + err.message);
      }
    }
    fetchMenuItems();
  }, [selectedStallId, token, isFromOrder, urlMenuItemId]);

  // Step 1: Confirm item selection
  function handleConfirmItem() {
    if (!selectedStallId || !selectedMenuItemId) {
      alert("Please select a stall and menu item");
      return;
    }
    setCurrentStep(2);
  }

  // Step 2: Handle file selection
  function onFileChange(e) {
    const f = Array.from(e.target.files || []);
    setFiles(f);
    setPreviewUrls(f.map((file) => URL.createObjectURL(file)));
  }

  // Step 2: Upload and verify image
  async function handleImageUpload() {
    if (!files.length) return alert("Please choose at least one photo");

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("imageFile", files[0]);
      fd.append("menuItemId", selectedMenuItemId);

      const res = await fetch("http://localhost:3000/images/upload", {
        method: "POST",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
        body: fd,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `Upload failed with status ${res.status}`);
      }

      const data = await res.json();
      setUploadedImageId(data.image.imageid);
      alert("Image verified successfully! Now write your review.");
      setCurrentStep(3);
    } catch (err) {
      alert("Upload error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  // Step 3: Submit review
  async function handleSubmitReview() {
    if (!review.trim()) {
      alert("Please write a review");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          menuItemId: Number(selectedMenuItemId),
          rating: rating,
          reviewText: review,
          imageId: uploadedImageId,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Review submission failed");
      }

      alert("Review submitted successfully!");

      // Navigate back to profile
      navigate("/profile");
    } catch (err) {
      alert("Review submission error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  // Reset all state
  function handleReset() {
    setFiles([]);
    setPreviewUrls([]);
    setReview("");
    setRating(5);
    setUploadedImageId(null);
    setCurrentStep(1);

    if (!isFromOrder) {
      setSelectedStallId("");
      setMenuItems([]);
      setSelectedMenuItemId("");
      setSelectedStall(null);
      setSelectedMenuItem(null);
    }
  }

  const steps = [
    { number: 1, label: "Confirm Item" },
    { number: 2, label: "Upload Photo" },
    { number: 3, label: "Write Review" },
  ];

  return (
    <div className="upload-container">
      {/* Back button if from order */}
      {isFromOrder && (
        <button className="back-button" onClick={() => navigate("/profile")}>
          <ArrowLeft size={20} />
          <span>Back to Orders</span>
        </button>
      )}

      <h2 className="title">
        {isFromOrder ? "Review Your Order" : "Upload Photos & Review"}
      </h2>

      {/* Progress Bar */}
      <div className="progress-container">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <div className="progress-step">
              <div
                className={`progress-circle ${
                  currentStep > step.number
                    ? "completed"
                    : currentStep === step.number
                    ? "active"
                    : ""
                }`}
              >
                {currentStep > step.number ? (
                  <Check size={16} />
                ) : (
                  <span>{step.number}</span>
                )}
              </div>
              <span className="progress-label">{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`progress-line ${
                  currentStep > step.number ? "completed" : ""
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="upload-form">
        {/* STEP 1: Confirm Item */}
        {currentStep === 1 && (
          <div className="step-content">
            {isFromOrder ? (
              // Show item details if from order
              <div className="item-confirmation">
                <h3>You are reviewing:</h3>
                {selectedMenuItem && selectedStall && (
                  <div className="confirmation-card">
                    {selectedMenuItem.mainimageurl && (
                      <img
                        src={selectedMenuItem.mainimageurl}
                        alt={selectedMenuItem.name}
                        className="confirmation-image"
                      />
                    )}
                    <div className="confirmation-details">
                      <h4 className="confirmation-item-name">
                        {selectedMenuItem.name}
                      </h4>
                      <p className="confirmation-stall-name">
                        {selectedStall.stallname}
                      </p>
                      {selectedMenuItem.description && (
                        <p className="confirmation-description">
                          {selectedMenuItem.description}
                        </p>
                      )}
                      <p className="confirmation-price">
                        ${selectedMenuItem.price?.toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}
                <button
                  className="btn btn-orange"
                  onClick={handleConfirmItem}
                  disabled={!selectedMenuItem || !selectedStall}
                >
                  Confirm & Continue
                </button>
              </div>
            ) : (
              // Show dropdowns if not from order
              <div className="item-selection">
                <label htmlFor="stallSelect">Select Stall:</label>
                <select
                  id="stallSelect"
                  value={selectedStallId}
                  onChange={(e) => {
                    const stallId = e.target.value;
                    setSelectedStallId(stallId);
                    const stall = stalls.find(
                      (s) => s.stallid === parseInt(stallId)
                    );
                    setSelectedStall(stall);
                  }}
                  required
                >
                  <option value="">-- Select a stall --</option>
                  {stalls.map((stall) => (
                    <option key={stall.stallid} value={stall.stallid}>
                      {stall.stallname}
                    </option>
                  ))}
                </select>

                <label htmlFor="menuItemSelect">Select Menu Item:</label>
                <select
                  id="menuItemSelect"
                  value={selectedMenuItemId}
                  onChange={(e) => {
                    const itemId = e.target.value;
                    setSelectedMenuItemId(itemId);
                    const item = menuItems.find(
                      (m) => m.menuitemid === parseInt(itemId)
                    );
                    setSelectedMenuItem(item);
                  }}
                  required
                  disabled={!menuItems.length}
                >
                  <option value="">-- Select a menu item --</option>
                  {menuItems.map((item) => (
                    <option key={item.menuitemid} value={item.menuitemid}>
                      {item.name}
                    </option>
                  ))}
                </select>

                <button
                  className="btn btn-orange"
                  onClick={handleConfirmItem}
                  disabled={!selectedStallId || !selectedMenuItemId}
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Upload Image */}
        {currentStep === 2 && (
          <div className="step-content">
            <h3>Upload a photo of your food</h3>

            <label className="file-drop" htmlFor="fileInput">
              <input
                id="fileInput"
                type="file"
                accept="image/*"
                onChange={onFileChange}
                className="file-input"
                aria-label="Upload images"
              />
              <div className="file-drop-content">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="upload-icon"
                  aria-hidden
                >
                  <path
                    d="M12 3v12"
                    stroke="#fff"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8 7l4-4 4 4"
                    stroke="#fff"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <rect
                    x="3"
                    y="9"
                    width="18"
                    height="11"
                    rx="2"
                    stroke="#fff"
                    strokeWidth="1.2"
                    fill="none"
                  />
                </svg>
                <div className="file-drop-text">
                  Drag & drop an image here or click to select
                  <div className="file-hint">
                    {files.length
                      ? `${files.length} file(s) selected`
                      : "PNG, JPG, up to 10MB"}
                  </div>
                </div>
              </div>
            </label>

            <div className="preview-grid" aria-live="polite">
              {previewUrls.map((url, i) => (
                <div key={i} className="preview-item">
                  <img src={url} alt={`preview-${i}`} className="preview-img" />
                </div>
              ))}
            </div>

            <div className="step-actions">
              <button
                className="btn btn-ghost"
                onClick={() => setCurrentStep(1)}
                disabled={loading}
              >
                Back
              </button>
              <button
                className="btn btn-orange"
                onClick={handleImageUpload}
                disabled={loading || !files.length}
              >
                {loading ? "Verifying…" : "Upload & Verify"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Write Review */}
        {currentStep === 3 && (
          <div className="step-content">
            <h3>How was your experience?</h3>

            <div className="review-preview">
              {previewUrls[0] && (
                <img
                  src={previewUrls[0]}
                  alt="Your photo"
                  className="review-preview-image"
                />
              )}
            </div>

            <div className="rating-container">
              <label className="rating-label">Rating:</label>
              <div className="stars-wrapper">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={32}
                    className="star-icon"
                    fill={star <= rating ? "#ff7622" : "none"}
                    stroke={star <= rating ? "#ff7622" : "#ccc"}
                    onClick={() => setRating(star)}
                  />
                ))}
              </div>
            </div>

            <textarea
              className="review"
              placeholder="Write your review here... (required)"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              required
              rows={6}
            />

            <div className="step-actions">
              <button
                className="btn btn-ghost"
                onClick={() => setCurrentStep(2)}
                disabled={loading}
              >
                Back
              </button>
              <button
                className="btn btn-orange"
                onClick={handleSubmitReview}
                disabled={loading || !review.trim()}
              >
                {loading ? "Submitting…" : "Submit Review"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
