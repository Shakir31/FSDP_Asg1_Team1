import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Upload } from "lucide-react";
import { toast } from "react-toastify";
import "../AddStallPage.css";

export default function AddStallPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);

  // Form data
  const [stallData, setStallData] = useState({
    stallname: "",
    category: "",
    description: "",
    hawker_centre_id: "",
    owner_id: "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  // Step 1: Basic Info
  function handleBasicInfoContinue() {
    if (!stallData.stallname.trim()) {
      toast.warning("Stall name is required");
      return;
    }
    if (!stallData.category.trim()) {
      toast.warning("Category is required");
      return;
    }
    setCurrentStep(2);
  }

  // Step 2: Image Upload
  function onFileChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  }

  function handleImageContinue() {
    if (!imageFile) {
      toast.warning("Please upload a stall image");
      return;
    }
    setCurrentStep(3);
  }

  // Step 3: Additional Details & Submit
  async function handleSubmitStall() {
    setLoading(true);
    try {
      let stallImageUrl = "";

      // Upload image first
      if (imageFile) {
        const formData = new FormData();
        formData.append("stallImage", imageFile);

        const uploadResponse = await fetch(
          "http://localhost:3000/stalls/upload-image",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          }
        );

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload image");
        }

        const uploadData = await uploadResponse.json();
        stallImageUrl = uploadData.imageUrl;
      }

      // Create stall
      const stallPayload = {
        stallname: stallData.stallname,
        category: stallData.category,
        description: stallData.description || null,
        stall_image: stallImageUrl || null,
        hawker_centre_id: stallData.hawker_centre_id || null,
        owner_id: stallData.owner_id ? parseInt(stallData.owner_id, 10) : null,
      };

      const response = await fetch("http://localhost:3000/stalls", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(stallPayload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create stall");
      }

      toast.success("Stall created successfully!");
      navigate("/admin");
    } catch (error) {
      console.error("Error creating stall:", error);
      toast.error("Failed to create stall: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  const steps = [
    { number: 1, label: "Basic Info" },
    { number: 2, label: "Upload Image" },
    { number: 3, label: "Additional Details" },
  ];

  return (
    <div className="add-stall-container">
      <button className="back-button" onClick={() => navigate("/admin")}>
        <ArrowLeft size={20} />
        <span>Back to Dashboard</span>
      </button>

      <h2 className="title">Add New Stall</h2>

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

      <div className="add-stall-form">
        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <div className="step-content">
            <h3>Enter Basic Information</h3>

            <div className="form-group">
              <label htmlFor="stallname">
                Stall Name <span className="required">*</span>
              </label>
              <input
                id="stallname"
                type="text"
                className="form-input"
                placeholder="e.g., Ah Seng Chicken Rice"
                value={stallData.stallname}
                onChange={(e) =>
                  setStallData({ ...stallData, stallname: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">
                Category <span className="required">*</span>
              </label>
              <input
                id="category"
                type="text"
                className="form-input"
                placeholder="e.g., Chinese, Malay, Indian, Western"
                value={stallData.category}
                onChange={(e) =>
                  setStallData({ ...stallData, category: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                className="form-textarea"
                placeholder="Describe your stall (optional)"
                rows={4}
                value={stallData.description}
                onChange={(e) =>
                  setStallData({ ...stallData, description: e.target.value })
                }
              />
            </div>

            <div className="step-actions">
              <button
                className="btn btn-orange"
                onClick={handleBasicInfoContinue}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Image Upload */}
        {currentStep === 2 && (
          <div className="step-content">
            <h3>Upload Stall Image</h3>

            <label className="file-drop" htmlFor="fileInput">
              <input
                id="fileInput"
                type="file"
                accept="image/*"
                onChange={onFileChange}
                className="file-input"
              />
              <div className="file-drop-content">
                <Upload size={48} className="upload-icon" />
                <div className="file-drop-text">
                  Drag & drop an image here or click to select
                  <div className="file-hint">
                    {imageFile ? imageFile.name : "PNG, JPG, up to 10MB"}
                  </div>
                </div>
              </div>
            </label>

            {previewUrl && (
              <div className="preview-container">
                <img
                  src={previewUrl}
                  alt="Stall preview"
                  className="preview-image"
                />
              </div>
            )}

            <div className="step-actions">
              <button
                className="btn btn-ghost"
                onClick={() => setCurrentStep(1)}
              >
                Back
              </button>
              <button
                className="btn btn-orange"
                onClick={handleImageContinue}
                disabled={!imageFile}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Additional Details */}
        {currentStep === 3 && (
          <div className="step-content">
            <h3>Additional Details (Optional)</h3>

            <div className="form-group">
              <label htmlFor="hawker_centre_id">Hawker Centre ID</label>
              <input
                id="hawker_centre_id"
                type="text"
                className="form-input"
                placeholder="Enter hawker centre ID (optional)"
                value={stallData.hawker_centre_id}
                onChange={(e) =>
                  setStallData({
                    ...stallData,
                    hawker_centre_id: e.target.value,
                  })
                }
              />
            </div>

            <div className="form-group">
              <label htmlFor="owner_id">Owner ID</label>
              <input
                id="owner_id"
                type="number"
                className="form-input"
                placeholder="Enter owner user ID (optional)"
                value={stallData.owner_id}
                onChange={(e) =>
                  setStallData({ ...stallData, owner_id: e.target.value })
                }
              />
              <p className="form-hint">Assign this stall to a user account</p>
            </div>

            <div className="summary-card">
              <h4>Review Your Stall</h4>
              <div className="summary-content">
                {previewUrl && (
                  <img src={previewUrl} alt="Stall" className="summary-image" />
                )}
                <div className="summary-details">
                  <p>
                    <strong>Name:</strong> {stallData.stallname}
                  </p>
                  <p>
                    <strong>Category:</strong> {stallData.category}
                  </p>
                  {stallData.description && (
                    <p>
                      <strong>Description:</strong> {stallData.description}
                    </p>
                  )}
                  {stallData.hawker_centre_id && (
                    <p>
                      <strong>Hawker Centre ID:</strong>{" "}
                      {stallData.hawker_centre_id}
                    </p>
                  )}
                  {stallData.owner_id && (
                    <p>
                      <strong>Owner ID:</strong> {stallData.owner_id}
                    </p>
                  )}
                </div>
              </div>
            </div>

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
                onClick={handleSubmitStall}
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Stall"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
