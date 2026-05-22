"use client";

import React from "react";
import gatekeeperLogo from "../../../assets/gatekeeper_logo_only.png";

const ATTENDANCE_HISTORY = [
  { date: "Senin, 9 Februari 2026" },
  { date: "Rabu, 11 Februari 2026" },
  { date: "Senin, 16 Februari 2026" },
  { date: "Rabu, 18 Februari 2026" },
  { date: "Senin, 23 Februari 2026" },
  { date: "Rabu, 25 Februari 2026" },
];

type RincianKelasDosenProps = {
  onLogout: () => void;
  activeTab: string;
  onTabChange: (tab: any) => void;
  user: { name: string; email: string };
  onNavigateToNotifications: () => void;
};

export function RincianKelasDosen({ onLogout, activeTab, onTabChange, user, onNavigateToNotifications }: RincianKelasDosenProps) {
  return (
    <div className="dashboard-wrapper">
      <style jsx>{`
        .dashboard-wrapper {
          display: flex;
          min-height: 100vh;
          background-color: #f8fafc;
          font-family: 'Inter', sans-serif;
        }

        /* MAIN CONTENT */
        .main-content {
          flex: 1;
          padding: 40px 60px;
          display: flex;
          flex-direction: column;
        }

        .content-header {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 40px;
        }

        .back-button {
          position: absolute;
          left: 0;
          top: 0;
          width: 32px;
          height: 32px;
          background-color: #112d4e;
          color: white;
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          border: none;
        }

        .main-title {
          font-size: 20px;
          font-weight: 800;
          color: #000;
          margin-bottom: 20px;
        }

        .illustration {
          width: 200px;
          height: auto;
          margin-bottom: 24px;
        }

        .class-title {
          font-size: 28px;
          font-weight: 800;
          color: #112d4e;
          margin-bottom: 4px;
        }

        .class-subtitle {
          font-size: 16px;
          color: #112d4e;
          font-weight: 500;
          margin-bottom: 40px;
        }

        /* ATTENDANCE HISTORY SECTION */
        .history-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          max-width: 800px;
          margin: 0 auto 20px auto;
        }

        .history-title {
          font-size: 18px;
          font-weight: 800;
          color: #000;
        }

        .filter-dropdown {
          background-color: #112d4e;
          color: white;
          padding: 6px 16px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }

        .history-list {
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
        }

        .history-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 0;
          border-bottom: 1px solid #112d4e;
        }

        .history-date {
          font-size: 14px;
          font-weight: 700;
          color: #112d4e;
          cursor: pointer;
        }

        .download-button {
          background: transparent;
          border: none;
          color: #112d4e;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        @media (max-width: 1024px) {
          .main-content { padding: 20px; }
        }
      `}</style>

      {/* MAIN CONTENT */}
      <main className="main-content">
        <div className="content-header">
          <button className="back-button" onClick={() => onTabChange('kelas')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <h2 className="main-title">Course Attendance Detail</h2>
          
          <img src={gatekeeperLogo.src} alt="Shield Icon" className="illustration" />

          <div className="class-title">II3230 Keamanan Informasi</div>
          <div className="class-subtitle">Kelas 01</div>
        </div>

        <div className="history-section-header">
          <h3 className="history-title">Attendance History</h3>
          <div className="filter-dropdown">
            Month
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="10" y1="18" x2="14" y2="18"/></svg>
          </div>
        </div>

        <div className="history-list">
          {ATTENDANCE_HISTORY.map((item, index) => (
            <div key={index} className="history-item">
              <span className="history-date" onClick={() => onTabChange('rincian')}>{item.date}</span>
              <button className="download-button" title="Download Recap">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
