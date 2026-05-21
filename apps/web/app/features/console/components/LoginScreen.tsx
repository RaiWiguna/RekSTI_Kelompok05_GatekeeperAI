"use client";

import React, { useState, FormEvent } from "react";
import studentsImg from "../../../assets/students.png";

export type Session = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    role: string;
  };
};

type LoginScreenProps = {
  onLoginSuccess: (session: Session) => void;
  onNavigateToRegister?: () => void;
};

export function LoginScreen({
  onLoginSuccess,
  onNavigateToRegister,
}: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<"mahasiswa" | "dosen" | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please fill in all fields");
      return;
    }

    if (!selectedRole) {
      alert("Please select your role");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    
    // Simulasi delay jaringan
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Penting: Gunakan prefix "mock-" dan sertakan role (student/lecturer) dalam token
    const roleKey = selectedRole === "mahasiswa" ? "student" : "lecturer";
    const mockSession: Session = {
      accessToken: `mock-${roleKey}-token-${Math.random().toString(36).substring(2, 9)}`,
      refreshToken: "mock-refresh-token",
      user: {
        id: "user_" + Math.random().toString(36).substring(2, 9),
        name: email.split("@")[0] || "User",
        role: selectedRole,
      },
    };
    
    onLoginSuccess(mockSession);
    setIsLoading(false);
  };

  return (
    <div className="login-container">
      <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: #FFFFFF;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          padding: 20px;
        }

        .login-card {
          width: 100%;
          max-width: 400px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .logo-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 40px;
        }

        .logo {
          width: 100px;
          height: 100px;
          object-fit: contain;
        }

        .brand-text {
          font-size: 24px;
          font-weight: bold;
          color: #112D4E;
          margin-top: 10px;
        }

        .brand-highlight {
          color: #00A8E8;
        }

        .welcome-text {
          font-size: 28px;
          font-weight: bold;
          color: #000;
          text-align: center;
          margin-bottom: 30px;
        }

        .form {
          width: 100%;
        }

        .input-group {
          margin-bottom: 20px;
          display: flex;
          flex-direction: column;
        }

        .label {
          font-size: 16px;
          font-weight: bold;
          color: #112D4E;
          margin-bottom: 8px;
          text-align: left;
        }

        .input {
          background-color: #D9D9D9;
          border-radius: 8px;
          padding: 12px 15px;
          font-size: 14px;
          color: #333;
          border: none;
          outline: none;
          width: 100%;
          box-sizing: border-box;
        }

        .role-buttons-container {
          display: flex;
          gap: 12px;
        }

        .role-button {
          flex: 1;
          border: 2px solid #D9D9D9;
          border-radius: 8px;
          padding: 12px;
          background-color: #F9F9F9;
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 14px;
          font-weight: 600;
          color: #666;
          transition: all 0.2s;
        }

        .role-button.active {
          border-color: #112D4E;
          background-color: #E8F0F8;
          color: #112D4E;
        }

        .login-button {
          width: 100%;
          background-color: #112D4E;
          color: white;
          padding: 15px;
          border-radius: 8px;
          font-weight: bold;
          font-size: 16px;
          border: none;
          cursor: pointer;
          margin-top: 20px;
          opacity: ${isLoading ? 0.6 : 1};
        }

        .footer {
          display: flex;
          justify-content: center;
          margin-top: 20px;
          font-size: 14px;
        }

        .footer-text {
          color: #A9A9A9;
        }

        .link-text {
          color: #112D4E;
          font-weight: bold;
          text-decoration: underline;
          cursor: pointer;
          margin-left: 4px;
        }
      `}</style>

      <div className="login-card">
        <div className="logo-container">
          <img 
            src={studentsImg.src}
            alt="Logo" 
            className="logo" 
          />
          <div className="brand-text">
            Gatekeeper<span className="brand-highlight">-AI</span>
          </div>
        </div>

        <h1 className="welcome-text">Welcome Back</h1>

        <form onSubmit={handleLogin} className="form">
          <div className="input-group">
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              placeholder="Write here..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div className="input-group">
            <label className="label">Password</label>
            <input
              type="password"
              className="input"
              placeholder="Write here..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div className="input-group">
            <label className="label">Pilih Role</label>
            <div className="role-buttons-container">
              <button
                type="button"
                className={`role-button ${selectedRole === "mahasiswa" ? "active" : ""}`}
                onClick={() => setSelectedRole("mahasiswa")}
                disabled={isLoading}
              >
                👨‍🎓 Mahasiswa
              </button>
              <button
                type="button"
                className={`role-button ${selectedRole === "dosen" ? "active" : ""}`}
                onClick={() => setSelectedRole("dosen")}
                disabled={isLoading}
              >
                👨‍🏫 Dosen
              </button>
            </div>
          </div>

          <button className="login-button" disabled={isLoading} type="submit">
            {isLoading ? "Processing..." : "Log In"}
          </button>

          <div className="footer">
            <span className="footer-text">Don't have an account? </span>
            <span className="link-text" onClick={onNavigateToRegister}>Register</span>
          </div>
        </form>
      </div>
    </div>
  );
}
