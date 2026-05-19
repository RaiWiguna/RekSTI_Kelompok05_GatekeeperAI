"use client";

import React from "react";
import gatekeeperLogo from "./assets/gatekeeper.png";

export default function SplashScreen() {
  return (
    <div className="splash-container">
      <style jsx>{`
        .splash-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: #ffffff;
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
        }

        .logo-wrapper {
          animation: fadeInScale 0.6s ease-out forwards;
        }

        .logo {
          width: 300px;
          height: 300px;
          object-fit: contain;
          animation: pulse 2s infinite ease-in-out 0.6s;
        }

        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.5);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
      `}</style>
      
      <div className="logo-wrapper">
        <img 
          src={gatekeeperLogo.src}
          alt="Gatekeeper AI Logo" 
          className="logo"
        />
      </div>
    </div>
  );
}
