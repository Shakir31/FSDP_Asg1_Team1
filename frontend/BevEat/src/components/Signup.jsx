import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../Signup.css";

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [retypePassword, setRetypePassword] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== retypePassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role: "customer" }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess("Registration successful! You can now login.");
        setName("");
        setEmail("");
        setPassword("");
        setRetypePassword("");
      } else {
        setError(data.error || "Registration failed");
      }
    } catch (err) {
      setError("Server error: " + err.message);
    }
  }

  return (
    <div className="signup-page">
      <div className="signup-container">
        <h2>Sign Up</h2>
        <form onSubmit={handleSubmit} className="signup-form">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="input-field"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input-field"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="input-field"
          />
          <input
            type="password"
            placeholder="Retype Password"
            value={retypePassword}
            onChange={(e) => setRetypePassword(e.target.value)}
            required
            className="input-field"
          />
          {error && <p className="error-msg">{error}</p>}
          {success && <p className="success-msg">{success}</p>}
          <button type="submit" className="signup-button">
            Sign Up
          </button>
          <p className="signup-text">
            Already have an account?{" "}
            <Link to="/login" className="btn">
              LOG IN
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Signup;
