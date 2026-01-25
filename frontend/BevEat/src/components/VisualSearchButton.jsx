import React, { useState, useRef } from "react";
import { toast } from "react-toastify";
import { FaCamera } from "react-icons/fa"; // Make sure to npm install react-icons
import { useNavigate } from "react-router-dom";
import commonConfigs from "../config"; //

export default function VisualSearchButton() {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large. Max 5MB.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch(`${commonConfigs.apiUrl}/api/search/visual`, {
        method: "POST",
        body: formData, // No Content-Type header needed for FormData
      });

      if (!res.ok) throw new Error("Search failed");

      const results = await res.json();

      if (results.length === 0) {
        toast.info("No similar food found.");
      } else {
        // Navigate to a results page with the data
        navigate("/search-results", { state: { results, image: URL.createObjectURL(file) } });
      }
    } catch (err) {
      console.error(err);
      toast.error("Visual search failed. Try again.");
    } finally {
      setLoading(false);
      // Reset input so same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        style={{ display: "none" }}
      />
      
      <button 
        className="btn-visual-search"
        onClick={() => fileInputRef.current.click()}
        disabled={loading}
        title="Search by Photo"
        style={{ 
          background: "none", 
          border: "none", 
          cursor: "pointer", 
          color: "#ff6b6b",
          fontSize: "1.5rem",
          padding: "0 15px",
          display: "flex",
          alignItems: "center"
        }}
      >
        {loading ? (
          <span className="spinner-small">⌛</span> 
        ) : (
          <FaCamera />
        )}
      </button>
    </>
  );
}