"use client";

import React, { useState, FormEvent } from "react";

type RegisterScreenProps = {
  onRegister: (email: string, password: string, name: string) => Promise<void>;
  onNavigateToLogin: () => void;
  error?: string | null;
};

export function RegisterScreen({
  onRegister,
  onNavigateToLogin,
  error: externalError,
}: RegisterScreenProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!name || !email || !password || !confirmPassword) {
      setLocalError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setLocalError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    try {
      await onRegister(email, password, name);
    } catch (err) {
      setLocalError("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const displayError = localError || externalError;

  return (
    <div className="register-container">
      <style jsx>{`
        .register-container {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background: linear-gradient(rgba(17, 45, 78, 0.85), rgba(17, 45, 78, 0.85)), 
                      url('https://images.unsplash.com/photo-1541339907198-e08756ebafe3?q=80&w=2070&auto=format&fit=crop');
          background-size: cover;
          background-position: center;
          padding: 20px;
        }

        .register-card {
          background: white;
          width: 100%;
          max-width: 450px;
          border-radius: 12px;
          padding: 40px 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }

        .logo-section {
          text-align: center;
          margin-bottom: 24px;
        }

        .illustration {
          width: 80px;
          height: auto;
          margin-bottom: 8px;
        }

        .brand-text {
          font-size: 20px;
          font-weight: bold;
          color: #112D4E;
        }

        .brand-highlight {
          color: #00A8E8;
        }

        .welcome-text {
          font-size: 24px;
          font-weight: bold;
          color: #000;
          margin-bottom: 24px;
        }

        .form {
          width: 100%;
        }

        .input-group {
          margin-bottom: 16px;
          text-align: left;
        }

        .label {
          display: block;
          font-size: 14px;
          font-weight: bold;
          color: #112D4E;
          margin-bottom: 6px;
        }

        .input {
          width: 100%;
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 12px 16px;
          font-size: 14px;
          color: #333;
          outline: none;
        }

        .input:focus {
          border-color: #112D4E;
        }

        .button {
          width: 100%;
          background: #112D4E;
          color: white;
          padding: 14px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          border: none;
          cursor: pointer;
          margin-top: 8px;
          transition: background 0.2s;
        }

        .button:hover {
          background: #0d223c;
        }

        .button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .error-message {
          color: #dc2626;
          font-size: 13px;
          margin-bottom: 16px;
          text-align: center;
        }

        .footer {
          margin-top: 20px;
          font-size: 14px;
          color: #4b5563;
          text-align: center;
        }

        .link-text {
          color: #112D4E;
          font-weight: bold;
          cursor: pointer;
          text-decoration: underline;
          background: none;
          border: none;
          padding: 0;
          margin-left: 4px;
        }
      `}</style>

      <div className="register-card">
        <div className="logo-section">
          <img src="/students.png" alt="Logo" className="illustration" />
          <div className="brand-text">
            Gatekeeper<span className="brand-highlight">-AI</span>
          </div>
        </div>

        <h2 className="welcome-text">Create Account</h2>

        <form className="form" onSubmit={handleSubmit}>
          {displayError && <div className="error-message">{displayError}</div>}

          <div className="input-group">
            <label className="label">Full Name</label>
            <input
              className="input"
              placeholder="Write here..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="input-group">
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              placeholder="Write here..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="input-group">
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              placeholder="Write here..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="input-group">
            <label className="label">Confirm Password</label>
            <input
              className="input"
              type="password"
              placeholder="Write here..."
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <button className="button" type="submit" disabled={isLoading}>
            {isLoading ? "Signing up..." : "Sign Up"}
          </button>
        </form>

        <div className="footer">
          Already have an account? 
          <button className="link-text" onClick={onNavigateToLogin}>
            Login
          </button>
        </div>
      </div>
    </div>
  );
}
