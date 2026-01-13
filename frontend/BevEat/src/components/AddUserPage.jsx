import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  User,
  ShoppingBag,
  Store,
  Shield,
} from "lucide-react";
import { toast } from "react-toastify";
import "../AddUserPage.css";

export default function AddUserPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [stalls, setStalls] = useState([]);

  // Form data
  const [userData, setUserData] = useState({
    role: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    coins: 0,
    stallId: "",
  });

  const [loading, setLoading] = useState(false);

  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  // Fetch stalls for stall owner assignment
  useEffect(() => {
    if (userData.role === "stall_owner") {
      fetchStalls();
    }
  }, [userData.role]);

  const fetchStalls = async () => {
    try {
      const response = await fetch("http://localhost:3000/admin/stalls", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch stalls");
      const data = await response.json();
      // Filter stalls without owners
      const availableStalls = data.filter((stall) => !stall.owner_id);
      setStalls(availableStalls);
    } catch (error) {
      console.error("Error fetching stalls:", error);
      toast.error("Failed to load stalls");
    }
  };

  // Step 1: Select Role
  const handleRoleSelect = (role) => {
    setUserData({ ...userData, role });
    setCurrentStep(2);
  };

  // Step 2: Basic Info
  const handleBasicInfoContinue = () => {
    if (!userData.name.trim()) {
      toast.warning("Name is required");
      return;
    }
    if (!userData.email.trim()) {
      toast.warning("Email is required");
      return;
    }
    if (!userData.password) {
      toast.warning("Password is required");
      return;
    }
    if (userData.password.length < 6) {
      toast.warning("Password must be at least 6 characters");
      return;
    }
    if (userData.password !== userData.confirmPassword) {
      toast.warning("Passwords do not match");
      return;
    }
    setCurrentStep(3);
  };

  // Step 3: Submit
  const handleSubmitUser = async () => {
    setLoading(true);
    try {
      // Create user
      const userPayload = {
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role,
      };

      const response = await fetch("http://localhost:3000/register", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(userPayload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create user");
      }

      const result = await response.json();
      const newUserId = result.user.userid;

      // If coins are specified, update them
      if (userData.coins > 0) {
        await fetch(`http://localhost:3000/admin/users/${newUserId}`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({ coins: userData.coins }),
        });
      }

      // If stall owner and stall is selected, assign stall
      if (userData.role === "stall_owner" && userData.stallId) {
        await fetch(`http://localhost:3000/admin/stalls/${userData.stallId}`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({ owner_id: newUserId }),
        });
      }

      toast.success("User created successfully!");
      navigate("/admin");
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error("Failed to create user: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, label: "Select Role" },
    { number: 2, label: "User Details" },
    { number: 3, label: "Review & Create" },
  ];

  const roleOptions = [
    {
      value: "customer",
      label: "Customer",
      icon: <ShoppingBag size={48} />,
      description: "Regular user who can order food and write reviews",
      color: "customer",
    },
    {
      value: "stall_owner",
      label: "Stall Owner",
      icon: <Store size={48} />,
      description: "Can manage their stall and menu items",
      color: "stall-owner",
    },
    {
      value: "admin",
      label: "Administrator",
      icon: <Shield size={48} />,
      description: "Full system access and management capabilities",
      color: "admin",
    },
  ];

  return (
    <div className="add-user-container">
      <button className="back-button" onClick={() => navigate("/admin")}>
        <ArrowLeft size={20} />
        <span>Back to Dashboard</span>
      </button>

      <h2 className="title">Add New User</h2>

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

      <div className="add-user-form">
        {/* Step 1: Select Role */}
        {currentStep === 1 && (
          <div className="step-content">
            <h3>Select User Role</h3>
            <div className="role-grid">
              {roleOptions.map((role) => (
                <div
                  key={role.value}
                  className={`role-card role-${role.color} ${
                    userData.role === role.value ? "selected" : ""
                  }`}
                  onClick={() => handleRoleSelect(role.value)}
                >
                  <div className="role-icon">{role.icon}</div>
                  <h4 className="role-title">{role.label}</h4>
                  <p className="role-description">{role.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: User Details */}
        {currentStep === 2 && (
          <div className="step-content">
            <h3>Enter User Details</h3>

            <div className="form-group">
              <label htmlFor="name">
                Full Name <span className="required">*</span>
              </label>
              <input
                id="name"
                type="text"
                className="form-input"
                placeholder="Enter full name"
                value={userData.name}
                onChange={(e) =>
                  setUserData({ ...userData, name: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">
                Email Address <span className="required">*</span>
              </label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="user@example.com"
                value={userData.email}
                onChange={(e) =>
                  setUserData({ ...userData, email: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">
                Password <span className="required">*</span>
              </label>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="Minimum 6 characters"
                value={userData.password}
                onChange={(e) =>
                  setUserData({ ...userData, password: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">
                Confirm Password <span className="required">*</span>
              </label>
              <input
                id="confirmPassword"
                type="password"
                className="form-input"
                placeholder="Re-enter password"
                value={userData.confirmPassword}
                onChange={(e) =>
                  setUserData({ ...userData, confirmPassword: e.target.value })
                }
              />
            </div>

            <div className="step-actions">
              <button
                className="btn btn-ghost"
                onClick={() => setCurrentStep(1)}
              >
                Back
              </button>
              <button
                className="btn btn-orange"
                onClick={handleBasicInfoContinue}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Optional Settings & Review */}
        {currentStep === 3 && (
          <div className="step-content">
            <h3>Optional Settings</h3>

            <div className="form-group">
              <label htmlFor="coins">Initial Coins</label>
              <input
                id="coins"
                type="number"
                className="form-input"
                placeholder="0"
                min="0"
                value={userData.coins}
                onChange={(e) =>
                  setUserData({
                    ...userData,
                    coins: parseInt(e.target.value) || 0,
                  })
                }
              />
              <p className="form-hint">Default is 0 coins</p>
            </div>

            {userData.role === "stall_owner" && (
              <div className="form-group">
                <label htmlFor="stallId">Assign Stall (Optional)</label>
                <select
                  id="stallId"
                  className="form-input"
                  value={userData.stallId}
                  onChange={(e) =>
                    setUserData({ ...userData, stallId: e.target.value })
                  }
                >
                  <option value="">No stall assigned</option>
                  {stalls.map((stall) => (
                    <option key={stall.stallid} value={stall.stallid}>
                      {stall.stallname} ({stall.category})
                    </option>
                  ))}
                </select>
                <p className="form-hint">
                  {stalls.length === 0
                    ? "No available stalls without owners"
                    : "Assign this user to a stall"}
                </p>
              </div>
            )}

            <div className="summary-card">
              <h4>Review New User</h4>
              <div className="summary-content">
                <div className="summary-details">
                  <p>
                    <strong>Role:</strong> {userData.role}
                  </p>
                  <p>
                    <strong>Name:</strong> {userData.name}
                  </p>
                  <p>
                    <strong>Email:</strong> {userData.email}
                  </p>
                  <p>
                    <strong>Initial Coins:</strong> {userData.coins}
                  </p>
                  {userData.role === "stall_owner" && userData.stallId && (
                    <p>
                      <strong>Assigned Stall:</strong>{" "}
                      {stalls.find(
                        (s) => s.stallid.toString() === userData.stallId
                      )?.stallname || "None"}
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
                onClick={handleSubmitUser}
                disabled={loading}
              >
                {loading ? "Creating..." : "Create User"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
