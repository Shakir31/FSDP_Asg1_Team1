import React from "react";
import { useNavigate } from "react-router-dom";
import { ShieldX, Home, ArrowLeft, Lock } from "lucide-react";
import "../ForbiddenPage.css";

export default function ForbiddenPage() {
  const navigate = useNavigate();

  const handleGoHome = () => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const role = payload.role;

        if (role === "stall_owner") {
          navigate("/dashboard");
        } else if (role === "admin") {
          navigate("/admin");
        } else {
          navigate("/home");
        }
      } catch (error) {
        navigate("/");
      }
    } else {
      navigate("/");
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="forbidden-page">
      <div className="forbidden-container">
        <div className="forbidden-icon-wrapper">
          <div className="forbidden-icon-bg">
            <ShieldX size={80} className="forbidden-icon" />
          </div>
          <div className="lock-badge">
            <Lock size={24} />
          </div>
        </div>

        <h1 className="forbidden-title">Access Denied</h1>
        <p className="forbidden-subtitle">Error 403 - Forbidden</p>

        <p className="forbidden-message">
          Oops! You don't have permission to access this page. This area is
          restricted to specific user roles or requires authentication.
        </p>

        <div className="forbidden-reasons">
          <h3 className="reasons-title">This could be because:</h3>
          <ul className="reasons-list">
            <li>You're not logged in</li>
            <li>Your account doesn't have the required permissions</li>
            <li>This page is only accessible to stall owners or admins</li>
            <li>Your session may have expired</li>
          </ul>
        </div>

        <div className="forbidden-actions">
          <button className="btn btn-primary" onClick={handleGoHome}>
            <Home size={20} />
            <span>Go to Home</span>
          </button>
          <button className="btn btn-secondary" onClick={handleGoBack}>
            <ArrowLeft size={20} />
            <span>Go Back</span>
          </button>
        </div>

        <div className="forbidden-help">
          <p>Need help? Contact support or try logging in again.</p>
          <button className="link-button" onClick={() => navigate("/login")}>
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
