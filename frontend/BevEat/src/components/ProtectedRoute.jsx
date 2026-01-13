import React from "react";
import { Navigate } from "react-router-dom";

// ProtectedRoute: Requires authentication
export function ProtectedRoute({ children }) {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");

  if (!token) {
    return <Navigate to="/forbidden" replace />;
  }

  return children;
}

// RoleProtectedRoute: Requires specific role(s)
export function RoleProtectedRoute({ children, allowedRoles }) {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");

  if (!token) {
    return <Navigate to="/forbidden" replace />;
  }

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const userRole = payload.role;

    if (!allowedRoles.includes(userRole)) {
      return <Navigate to="/forbidden" replace />;
    }

    return children;
  } catch (error) {
    console.error("Token decode error:", error);
    return <Navigate to="/forbidden" replace />;
  }
}
