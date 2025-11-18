import React, { useState, useEffect } from "react";
import "../UploadPage.css";

export default function UploadPage() {
  const [stalls, setStalls] = useState([]);
  const [selectedStallId, setSelectedStallId] = useState("");
  const [menuItems, setMenuItems] = useState([]);
  const [selectedMenuItemId, setSelectedMenuItemId] = useState("");

  const [files, setFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [review, setReview] = useState("");

  const [loading, setLoading] = useState(false);
  const [uploadedImageId, setUploadedImageId] = useState(null);
  const [result, setResult] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    async function fetchStalls() {
      try {
        const res = await fetch("http://localhost:3000/stalls", {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        });
        if (!res.ok) throw new Error("Failed to fetch stalls");
        const data = await res.json();
        setStalls(data);
      } catch (err) {
        alert("Error loading stalls: " + err.message);
      }
    }
    fetchStalls();
  }, [token]);

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
        setSelectedMenuItemId(""); // reset selected menu item on stall change
      } catch (err) {
        alert("Error loading menu items: " + err.message);
      }
    }
    fetchMenuItems();
  }, [selectedStallId, token]);

  function onFileChange(e) {
    const f = Array.from(e.target.files || []);
    setFiles(f);
    setPreviewUrls(f.map((file) => URL.createObjectURL(file)));
    setUploadedImageId(null);
  }

  async function handleImageUpload() {
    if (!selectedMenuItemId) {
      alert("Please select a menu item first");
      return;
    }
    if (!files.length) return alert("Please choose at least one photo");

    setLoading(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("imageFile", files[0]);

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
      setUploadedImageId(data.image.ImageID);
      setResult({ upload: data });
      alert(
        "Image uploaded and verified successfully. You can now submit the review."
      );
    } catch (err) {
      alert("Upload error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!selectedMenuItemId) {
      alert("Please select a menu item first");
      return;
    }
    if (!uploadedImageId) {
      alert("Please upload an image first");
      return;
    }
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
          rating: 5,
          reviewText: review,
          imageId: uploadedImageId,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Review submission failed");
      }

      const data = await res.json();
      setResult((prev) => ({ ...prev, review: data }));
      alert("Review submitted successfully");

      // reset all
      setFiles([]);
      setPreviewUrls([]);
      setReview("");
      setUploadedImageId(null);
      setSelectedStallId("");
      setMenuItems([]);
      setSelectedMenuItemId("");
    } catch (err) {
      alert("Review submission error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="upload-container">
      <h2 className="title">Upload Photos & Review</h2>

      <form className="upload-form" onSubmit={handleSubmit}>
        <label htmlFor="stallSelect">Select Stall:</label>
        <select
          id="stallSelect"
          value={selectedStallId}
          onChange={(e) => setSelectedStallId(e.target.value)}
          required
        >
          <option value="">-- Select a stall --</option>
          {stalls.map((stall) => (
            <option key={stall.StallID} value={stall.StallID}>
              {stall.StallName}
            </option>
          ))}
        </select>

        <label htmlFor="menuItemSelect">Select Menu Item:</label>
        <select
          id="menuItemSelect"
          value={selectedMenuItemId}
          onChange={(e) => setSelectedMenuItemId(e.target.value)}
          required
          disabled={!menuItems.length}
        >
          <option value="">-- Select a menu item --</option>
          {menuItems.map((item) => (
            <option key={item.MenuItemID} value={item.MenuItemID}>
              {item.Name}
            </option>
          ))}
        </select>

        <label className="file-drop" htmlFor="fileInput">
          <input
            id="fileInput"
            type="file"
            accept="image/*"
            multiple
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
              Drag & drop images here or click to select
              <div className="file-hint">
                {files.length
                  ? `${files.length} file(s) selected`
                  : "PNG, JPG, up to 10MB each"}
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

        {!uploadedImageId && (
          <button
            type="button"
            className="btn btn-orange"
            onClick={handleImageUpload}
            disabled={loading}
          >
            {loading ? "Uploading…" : "Upload Image"}
          </button>
        )}

        {uploadedImageId && (
          <>
            <textarea
              className="review"
              placeholder="Write a short review (required)"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              required
            />

            <div className="actions">
              <button
                type="submit"
                className="btn btn-orange"
                disabled={loading}
              >
                {loading ? "Submitting…" : "Submit Review"}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setFiles([]);
                  setPreviewUrls([]);
                  setReview("");
                  setUploadedImageId(null);
                  setSelectedStallId("");
                  setMenuItems([]);
                  setSelectedMenuItemId("");
                  setResult(null);
                }}
              >
                Reset
              </button>
            </div>
          </>
        )}
      </form>

      {result && (
        <div className="result">
          <div>
            <strong>Upload response:</strong>{" "}
            {JSON.stringify(result.upload, null, 2)}
          </div>
          {result.review && (
            <div>
              <strong>Review response:</strong>{" "}
              {JSON.stringify(result.review, null, 2)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
