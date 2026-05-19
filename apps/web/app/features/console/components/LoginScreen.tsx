"use client";

import React, { FormEvent } from "react";
import studentsImg from "../../../assets/students.png";

type LoginViewProps = {
  apiBaseUrl: string;
  error: string | null;
  message: string | null;
  submitting: boolean;
  loginValues: {
    email: string;
    password: string;
  };
  onChange: (field: "email" | "password", value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function LoginView({
  error,
  message,
  submitting,
  onSubmit,
}: LoginViewProps) {
  return (
    <div className="login-container">
      <style jsx>{`
        .login-container {
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

        .login-card {
          background: white;
          width: 100%;
          max-width: 450px;
          border-radius: 12px;
          padding: 48px 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          text-align: center;
        }

        .illustration {
          width: 220px;
          height: auto;
          margin-bottom: 32px;
        }

        .title {
          font-size: 24px;
          font-weight: 900;
          color: #112d4e;
          margin-bottom: 12px;
          line-height: 1.3;
        }

        .title-highlight {
          color: #00a8e8;
          display: block;
        }

        .description {
          font-size: 14px;
          color: #4b5563;
          line-height: 1.6;
          margin-bottom: 32px;
          max-width: 300px;
        }

        .login-button {
          width: 100%;
          background: #112d4e;
          color: white;
          padding: 14px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          border: none;
          cursor: pointer;
          transition: background 0.2s;
        }

        .login-button:hover {
          background: #0d223c;
        }

        .login-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .message-box {
          margin-top: 16px;
          font-size: 14px;
        }

        .error { color: #dc2626; }
        .success { color: #059669; }
      `}</style>

      <div className="login-card">
        <img 
          src={studentsImg.src}
          alt="Illustration" 
          className="illustration" 
        />

        <h1 className="title">
          Sistem Absensi Otomatis
          <span className="title-highlight">Berbasis AI</span>
        </h1>

        <p className="description">
          GATEKEEPER-AI adalah solusi komprehensif yang menjamin pengelolaan kelas yang lebih cerdas, aman, dan disiplin
        </p>

        <form onSubmit={onSubmit} style={{ width: '100%' }}>
          {error && <div className="message-box error">{error}</div>}
          {message && <div className="message-box success">{message}</div>}
          
          <button className="login-button" disabled={submitting} type="submit">
            {submitting ? "Processing..." : "Login with SSO"}
          </button>
        </form>
      </div>
    </div>
  );
}
