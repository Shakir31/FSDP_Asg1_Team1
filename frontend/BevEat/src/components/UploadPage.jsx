import React, { useState } from "react";
import "../UploadPage.css";
import { CartContext } from "./Cartcontext";

export default function UploadPage() {
  const [files, setFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // obtain token from localStorage for authentication
  const token = localStorage.getItem("token");

  function onFileChange(e) {
    const f = Array.from(e.target.files || []);
    setFiles(f);
    setPreviewUrls(f.map((file) => URL.createObjectURL(file)));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!files.length) return alert("Please choose at least one photo");
    setLoading(true);

    try {
      const fd = new FormData();
      files.forEach((f) => fd.append("images", f));
      fd.append("review", review);
      fd.append("stallId", "stall-123"); // replace with actual stall id if available

      const uploadRes = await fetch("http://localhost:3000/images/upload", {
        method: "POST",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
        body: fd,
      });

      // attempt to parse JSON safely, fall back to text for diagnostics
      let uploadData = null;
      const contentType = uploadRes.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        try {
          uploadData = await uploadRes.json();
        } catch (err) {
          const txt = await uploadRes.text();
          throw new Error(`Invalid JSON response (status ${uploadRes.status}): ${txt || "<empty body>"}`);
        }
      } else {
        const txt = await uploadRes.text();
        if (!uploadRes.ok) throw new Error(`Upload failed (status ${uploadRes.status}): ${txt || "<empty body>"}`);
        // server returned non-json success body
        uploadData = { message: txt, uploadedCount: files.length };
      }

      if (!uploadRes.ok) {
        // uploadData may contain error message from server
        throw new Error(uploadData?.message || `Upload failed with status ${uploadRes.status}`);
      }

      // After successful upload, award coins
      let coinsResult = null;
      try {
        const coinRes = await fetch("/coins/award-photo", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify({
            imagesUploaded: uploadData.uploadedCount || files.length,
            stallId: uploadData.stallId || "stall-123",
          }),
        });

        const coinContentType = coinRes.headers.get("content-type") || "";
        if (coinContentType.includes("application/json")) {
          coinsResult = await coinRes.json();
        } else {
          const txt = await coinRes.text();
          coinsResult = { message: txt };
          if (!coinRes.ok) throw new Error(`Coin endpoint failed (status ${coinRes.status}): ${txt || "<empty body>"}`);
        }

        if (!coinRes.ok) throw new Error(coinsResult?.message || `Coin awarding failed with status ${coinRes.status}`);
      } catch {
        console.warn("Coin awarding failed");
      }

      setResult({
        upload: uploadData,
        coins: coinsResult,
      });

      alert(`Upload successful. Coins awarded: ${coinsResult?.coinsAwarded ?? "N/A"}`);
    } catch (err) {
      console.error("Upload error detail:", err);
      alert("Upload error: " + (err.message || err));
      // Suggest opening devtools network tab and server logs
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
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="upload-icon" aria-hidden>
              <path d="M12 3v12" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 7l4-4 4 4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="3" y="9" width="18" height="11" rx="2" stroke="#fff" strokeWidth="1.2" fill="none"/>
            </svg>
            <div className="file-drop-text">
              Drag & drop images here or click to select
              <div className="file-hint">{files.length ? `${files.length} file(s) selected` : "PNG, JPG, up to 10MB each"}</div>
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

        <textarea
          className="review"
          placeholder="Write a short review (required)"
          value={review}
          onChange={(e) => setReview(e.target.value)}
          required
        />

        <div className="actions">
          <button type="submit" className="btn btn-orange" disabled={loading}>
            {loading ? "Uploading…" : "Submit"}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setFiles([]);
              setPreviewUrls([]);
              setReview("");
              setResult(null);
            }}
          >
            Reset
          </button>
        </div>
      </form>

      {result && (
        <div className="result">
          <div><strong>Coins awarded:</strong> {result.coins?.coinsAwarded ?? "N/A"}</div>
          <div className="detections"><strong>Detections:</strong>
            <pre>{JSON.stringify(result.upload?.detections, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}