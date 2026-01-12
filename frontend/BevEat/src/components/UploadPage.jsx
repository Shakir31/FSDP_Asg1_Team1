import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Star, ArrowLeft, Check, Camera } from "lucide-react";
import { toast } from "react-toastify";
import "../UploadPage.css";

export default function UploadPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const urlStallId = searchParams.get("stallId");
  const urlMenuItemId = searchParams.get("menuItemId");
  const isFromOrder = urlStallId && urlMenuItemId;

  const [currentStep, setCurrentStep] = useState(1);

  const [stalls, setStalls] = useState([]);
  const [selectedStallId, setSelectedStallId] = useState(urlStallId || "");
  const [menuItems, setMenuItems] = useState([]);
  const [selectedMenuItemId, setSelectedMenuItemId] = useState(
    urlMenuItemId || ""
  );

  const [selectedStall, setSelectedStall] = useState(null);
  const [selectedMenuItem, setSelectedMenuItem] = useState(null);

  const [files, setFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");

  const [loading, setLoading] = useState(false);
  const [uploadedImageId, setUploadedImageId] = useState(null);

  // Webcam states
  const [showWebcam, setShowWebcam] = useState(false);
  const [stream, setStream] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);

  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");

  useEffect(() => {
    async function fetchStalls() {
      try {
        const res = await fetch("http://localhost:3000/stalls", {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        });
        if (!res.ok) throw new Error("Failed to fetch stalls");
        const data = await res.json();
        setStalls(data);

        if (isFromOrder && urlStallId) {
          const stall = data.find((s) => s.stallid === parseInt(urlStallId));
          setSelectedStall(stall);
        }
      } catch (err) {
        toast.error("Error loading stalls: " + err.message);
      }
    }
    fetchStalls();
  }, [token, isFromOrder, urlStallId]);

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

        if (isFromOrder && urlMenuItemId) {
          const item = data.find(
            (m) => m.menuitemid === parseInt(urlMenuItemId)
          );
          setSelectedMenuItem(item);
        }
      } catch (err) {
        toast.error("Error loading menu items: " + err.message);
      }
    }
    fetchMenuItems();
  }, [selectedStallId, token, isFromOrder, urlMenuItemId]);

  function handleConfirmItem() {
    if (!selectedStallId || !selectedMenuItemId) {
      toast.warning("Please select a stall and menu item");
      return;
    }
    setCurrentStep(2);
  }

  function onFileChange(e) {
    const f = Array.from(e.target.files || []);
    setFiles(f);
    setPreviewUrls(f.map((file) => URL.createObjectURL(file)));
  }

  // Handle camera capture
  async function handleCameraCapture() {
    // Check if on mobile
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

    if (isMobile) {
      // Mobile: Use native camera
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.capture = "environment";
      input.onchange = (e) => {
        const f = Array.from(e.target.files || []);
        setFiles(f);
        setPreviewUrls(f.map((file) => URL.createObjectURL(file)));
      };
      input.click();
    } else {
      // Desktop: Open webcam modal
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
        });
        setStream(mediaStream);
        setShowWebcam(true);
      } catch (err) {
        toast.error("Could not access camera: " + err.message);
      }
    }
  }

  // Capture photo from webcam
  function captureFromWebcam() {
    const video = document.getElementById("webcam-video");
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        const file = new File([blob], "webcam-photo.jpg", {
          type: "image/jpeg",
        });
        const url = URL.createObjectURL(blob);
        setCapturedPhoto(url);
        setFiles([file]);
        setPreviewUrls([url]);
      },
      "image/jpeg",
      0.95
    );
  }

  // Use captured photo
  function useWebcamPhoto() {
    closeWebcam();
  }

  // Retake photo
  function retakeWebcamPhoto() {
    setCapturedPhoto(null);
  }

  // Close webcam
  function closeWebcam() {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setShowWebcam(false);
    setCapturedPhoto(null);
  }

  async function handleImageUpload() {
    if (!files.length) {
      toast.warning("Please choose at least one photo");
      return;
    }

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
      toast.success("Image verified successfully! Now write your review.");
      setCurrentStep(3);
    } catch (err) {
      toast.error("Upload error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitReview() {
    if (!review.trim()) {
      toast.warning("Please write a review");
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

      toast.success("Review submitted successfully!");
      navigate("/profile");
    } catch (err) {
      toast.error("Review submission error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

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
      {isFromOrder && (
        <button className="back-button" onClick={() => navigate("/profile")}>
          <ArrowLeft size={20} />
          <span>Back to Orders</span>
        </button>
      )}

      <h2 className="title">
        {isFromOrder ? "Review Your Order" : "Upload Photos & Review"}
      </h2>

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
        {currentStep === 1 && (
          <div className="step-content">
            {isFromOrder ? (
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

        {currentStep === 2 && (
          <div className="step-content">
            <h3>Upload a photo of your food</h3>

            <div className="upload-options">
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

              <div className="upload-divider">
                <span>OR</span>
              </div>

              <button className="btn-camera" onClick={handleCameraCapture}>
                <Camera size={24} />
                <span>Take Photo</span>
              </button>
            </div>

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

      {/* Webcam Modal */}
      {showWebcam && (
        <div className="webcam-modal-overlay" onClick={closeWebcam}>
          <div className="webcam-modal" onClick={(e) => e.stopPropagation()}>
            <div className="webcam-header">
              <h3>{capturedPhoto ? "Photo Preview" : "Take Photo"}</h3>
              <button className="webcam-close" onClick={closeWebcam}>
                ×
              </button>
            </div>

            <div className="webcam-content">
              {!capturedPhoto ? (
                <video
                  id="webcam-video"
                  autoPlay
                  playsInline
                  ref={(video) => {
                    if (video && stream) {
                      video.srcObject = stream;
                    }
                  }}
                  className="webcam-video"
                />
              ) : (
                <img
                  src={capturedPhoto}
                  alt="Captured"
                  className="webcam-preview"
                />
              )}
            </div>

            <div className="webcam-actions">
              {!capturedPhoto ? (
                <button className="btn btn-orange" onClick={captureFromWebcam}>
                  📸 Capture Photo
                </button>
              ) : (
                <>
                  <button className="btn btn-ghost" onClick={retakeWebcamPhoto}>
                    Retake
                  </button>
                  <button className="btn btn-orange" onClick={useWebcamPhoto}>
                    Use Photo
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
