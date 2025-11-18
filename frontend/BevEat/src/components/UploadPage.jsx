import React, { useState } from "react";
import "../UploadPage.css";

export default function UploadPage() {
  const [files, setFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadedImageId, setUploadedImageId] = useState(null);
  const [result, setResult] = useState(null);

  // obtain token from localStorage for authentication
  const token = localStorage.getItem("token");

  function onFileChange(e) {
    const f = Array.from(e.target.files || []);
    setFiles(f);
    setPreviewUrls(f.map((file) => URL.createObjectURL(file)));
    setUploadedImageId(null); // reset previously uploaded image ID when new files selected
  }

  // Uploads first image from the selected files (adjust if you want multiple upload)
  async function handleImageUpload() {
    if (!files.length) return alert("Please choose at least one photo");
    setLoading(true);
    setResult(null);

    try {
      const fd = new FormData();
      fd.append("imageFile", files[0]); // your backend expects imageFile as field name
      // Optionally add menuItemId or stallId if needed by your backend
      // fd.append('stallId', 'stall-123');

      const uploadRes = await fetch("http://localhost:3000/images/upload", {
        method: "POST",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
        body: fd,
      });

      if (!uploadRes.ok) {
        const errorText = await uploadRes.text();
        throw new Error(
          errorText || `Upload failed with status ${uploadRes.status}`
        );
      }

      const uploadData = await uploadRes.json();
      setUploadedImageId(uploadData.image.ImageID); // save uploaded image ID for linking to review
      setResult({ upload: uploadData });
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
      const reviewRes = await fetch("http://localhost:3000/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          menuItemId: 9, // replace with actual menu item ID in context
          rating: 5, // you can add rating input UI accordingly
          reviewText: review,
          imageId: uploadedImageId,
        }),
      });

      if (!reviewRes.ok) {
        const errorText = await reviewRes.text();
        throw new Error(errorText || "Review submission failed");
      }

      const reviewData = await reviewRes.json();
      setResult((prev) => ({ ...prev, review: reviewData }));
      alert("Review submitted successfully");
      setFiles([]);
      setPreviewUrls([]);
      setReview("");
      setUploadedImageId(null);
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
          {previewUrls.map((u, i) => (
            <div key={i} className="preview-item">
              <img src={u} alt={`preview-${i}`} className="preview-img" />
            </div>
          ))}
        </div>

        {/* Button to upload first image from selection */}
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

        {/* Review text area shown only after image is uploaded */}
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
