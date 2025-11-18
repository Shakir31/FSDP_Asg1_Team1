import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      const response = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        //save token to localStorage or sessionStorage
        if (rememberMe) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("role", data.role);
        } else {
          localStorage.setItem("token", data.token);
          localStorage.setItem("role", data.role);
          sessionStorage.setItem("token", data.token);
          sessionStorage.setItem("role", data.role);
        }
        alert("Login successful! Role: " + data.role);
        //redirect or update UI accordingly
        if (data.role === "admin" || data.role === "Admin") {
          window.location.href = "/admin";
        }
        navigate("/home");
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("Server error");
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <form className="login-left" onSubmit={handleSubmit}>
          <h2>Login</h2>
          <input
            type="email"
            placeholder="Email"
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="options">
            <label className="remember-me">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Remember me
            </label>
            <a href="#" className="forgot-password">
              Forgot password?
            </a>
          </div>
          {error && <p style={{ color: "red" }}>{error}</p>}
          <button className="login-button" type="submit">
            Login
          </button>
          <p className="signup-text">
            Don’t have an account?{" "}
            <Link to="/register" className="btn">
              SIGN UP
            </Link>
          </p>
        </form>
        <div className="divider">
          <span>OR</span>
        </div>
        <div className="login-right">
          <button className="google-button">Continue with Google</button>
          <button className="facebook-button">Continue with Facebook</button>
        </div>
      </div>
    </div>
  );
}

export default Login;
