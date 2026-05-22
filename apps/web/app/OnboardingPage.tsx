"use client";

import { useState, useEffect } from "react";
import AdminConsole from "./admin-console";
import SplashScreen from "./SplashScreen";
import { LoginScreen, Session } from "./features/console/components/LoginScreen";
import studentsImg from "./assets/students.png";
import bgOnboard from "./assets/BG_Onboard.png";

type Step = "splash" | "onboarding" | "login" | "console";

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>("splash");

  useEffect(() => {
    const timer = setTimeout(() => {
      setStep("onboarding");
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Fungsi ini dipanggil saat login di layar onboarding berhasil
  const handleLoginSuccess = (newSession: Session) => {
    // Simpan token ke localStorage agar AdminConsole bisa membacanya
    localStorage.setItem("gatekeeper_auth", JSON.stringify({
      accessToken: newSession.accessToken,
      refreshToken: newSession.refreshToken
    }));
    setStep("console");
  };

  if (step === "splash") {
    return <SplashScreen />;
  }

  if (step === "login") {
    return (
      <LoginScreen 
        onLoginSuccess={handleLoginSuccess} 
        onNavigateToRegister={() => alert("Registration not implemented yet")}
      />
    );
  }

  if (step === "console") {
    return <AdminConsole />;
  }

  return (
    <div className="onboarding-container">
      <style jsx>{`
        .onboarding-container {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background-image: url(${bgOnboard.src});
          background-size: cover;
          background-position: center;
          font-family: 'Inter', sans-serif;
        }

        .onboarding-container :global(*) {
          font-family: 'Inter', sans-serif;
        }

        .card {
          background-color: #FFFFFF;
          width: 90%;
          max-width: 400px;
          padding: 40px 30px;
          border-radius: 4px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .image {
          width: 180px;
          height: auto;
          margin-bottom: 24px;
        }

        .title {
          font-size: 22px;
          font-weight: 800;
          color: #112D4E;
          margin-bottom: 16px;
          line-height: 1.2;
        }

        .title-highlight {
          color: #00A8E8;
        }

        .description {
          font-size: 12px;
          color: #333333;
          line-height: 1.5;
          margin-bottom: 32px;
          font-weight: 500;
        }

        .button {
          width: 100%;
          background-color: #112D4E;
          color: #FFFFFF;
          padding: 14px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 14px;
          border: none;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .button:hover {
          background-color: #0d223c;
        }
      `}</style>

      <div className="card">
        <img
          src={studentsImg.src}
          alt="Illustration"
          className="image"
        />

        <h1 className="title">
          Sistem Absensi Otomatis<br />
          <span className="title-highlight">Berbasis AI</span>
        </h1>

        <p className="description">
          GATEKEEPER-AI adalah solusi komprehensif yang menjamin pengelolaan kelas yang lebih cerdas, aman, dan disiplin
        </p>

        <button className="button" onClick={() => setStep("login")}>
          Login with SSO
        </button>
      </div>
    </div>
  );
}
