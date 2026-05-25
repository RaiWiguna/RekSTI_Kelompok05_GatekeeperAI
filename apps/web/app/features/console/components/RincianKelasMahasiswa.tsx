"use client";

import React from "react";
import gatekeeperLogo from "../../../assets/gatekeeper_logo_only.png";
import type { StudentClassSummary } from "./ClassesMahasiswa";

type RincianKelasMahasiswaProps = {
  onLogout: () => void;
  activeTab: string;
  onTabChange: (tab: "dashboard" | "kelas" | "profil" | "rincian-kelas") => void;
  user: { name: string; email: string };
  course: StudentClassSummary | null;
  onNavigateToNotifications: () => void;
};

export function RincianKelasMahasiswa({ onLogout, activeTab, onTabChange, user, course, onNavigateToNotifications }: RincianKelasMahasiswaProps) {
  const attendanceHistory = course?.attendance_history.map((item) => ({
    ...item,
    displayDate: formatDisplayDate(item.date),
    label: item.status === "attended" ? "Attended" : "Absent",
    color: item.status === "attended" ? "#4ADE80" : "#F87171",
  })) ?? [];

  return (
    <div className="dashboard-wrapper">
      <style jsx>{`
        .dashboard-wrapper {
          display: flex;
          min-height: 100vh;
          background-color: #f8fafc;
          font-family: 'Inter', sans-serif;
        }

        /* SIDEBAR */
        .sidebar {
          width: 280px;
          background-color: #112d4e;
          color: white;
          display: flex;
          flex-direction: column;
          padding: 40px 0;
          border-top-right-radius: 40px;
          border-bottom-right-radius: 40px;
          position: sticky;
          top: 0;
          height: 100vh;
        }

        .profile-section {
          padding: 0 30px;
          margin-bottom: 40px;
          position: relative;
        }

        .notification-btn-sidebar {
          background: transparent;
          color: white;
          border: none;
          padding: 0;
          cursor: pointer;
          position: absolute;
          top: 0;
          right: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          border: 3px solid #facc15;
          margin-bottom: 16px;
        }

        .profile-name {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 4px;
        }

        .profile-info {
          font-size: 12px;
          color: #cbd5e1;
          opacity: 0.8;
        }

        .nav-menu {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          padding: 16px 30px;
          gap: 16px;
          cursor: pointer;
          transition: background 0.2s;
          color: #fde4c8;
        }

        .nav-item.active {
          background: rgba(255, 255, 255, 0.2);
          border-left: 4px solid #fde4c8;
          color: #fff;
        }

        .nav-text {
          font-weight: 600;
          font-size: 16px;
        }

        /* MAIN CONTENT */
        .main-content {
          flex: 1;
          padding: 40px 60px;
          display: flex;
          flex-direction: column;
        }

        .header-top {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          margin-bottom: 40px;
          gap: 20px;
        }

        .brand-logo-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .brand-title {
          font-size: 32px;
          font-weight: bold;
          color: #112d4e;
          margin: 0;
        }

        .brand-subtitle {
          font-size: 14px;
          color: #112d4e;
          font-weight: 500;
          margin: 0;
        }

        .brand-highlight {
          color: #00a8e8;
        }

        .content-header {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 30px;
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
          width: 150px;
          height: 150px;
          object-fit: contain;
          margin-bottom: 20px;
        }

        .class-title {
          font-size: 24px;
          font-weight: 800;
          color: #112d4e;
          margin-bottom: 4px;
        }

        .class-lecturer {
          font-size: 16px;
          color: #112d4e;
          font-weight: 500;
          margin-bottom: 30px;
        }

        /* ATTENDANCE HISTORY */
        .history-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
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
          border-radius: 8px;
          font-size: 14px;
          font-weight: bold;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .history-list {
          width: 100%;
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
          font-weight: 600;
          color: #112d4e;
        }

        .history-status {
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 800;
          font-size: 14px;
          min-width: 100px;
        }

        .status-dot {
          width: 20px;
          height: 20px;
          border-radius: 50%;
        }

        @media (max-width: 1024px) {
          .sidebar { width: 80px; }
          .profile-name, .profile-info, .nav-text { display: none; }
          .profile-section { padding: 0; align-items: center; }
          .main-content { padding: 20px; }
        }
      `}</style>

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="profile-section">
          <button className="notification-btn-sidebar" onClick={onNavigateToNotifications}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          </button>
          <img 
            src={`https://ui-avatars.com/api/?name=${user.name}&background=F44336&color=fff&rounded=true&bold=true`} 
            alt="Avatar" 
            className="avatar" 
          />
          <h2 className="profile-name">Halo, {user.name.split(" ")[0]}</h2>
          <p className="profile-info">Sistem dan Teknologi Informasi - 2023</p>
        </div>

        <nav className="nav-menu">
          <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => onTabChange('dashboard')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <span className="nav-text">Dashboard</span>
          </div>
          <div className={`nav-item ${activeTab === 'kelas' || activeTab === 'rincian-kelas' ? 'active' : ''}`} onClick={() => onTabChange('kelas')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            <span className="nav-text">Kelas</span>
          </div>
          <div className="nav-item" onClick={onNavigateToNotifications}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            <span className="nav-text">Notifikasi</span>
          </div>
          <div className={`nav-item ${activeTab === 'profil' ? 'active' : ''}`} onClick={() => onTabChange('profil')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span className="nav-text">Profil</span>
          </div>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        <header className="header-top">
          <div className="brand-logo-section">
            <div style={{ textAlign: 'right' }}>
              <h1 className="brand-title">Gatekeeper<span className="brand-highlight">-AI</span></h1>
              <p className="brand-subtitle">Sistem Absensi Otomatis <span className="brand-highlight">Berbasis AI</span></p>
            </div>
            <img src={gatekeeperLogo.src} alt="Logo" style={{ width: 60, height: 60, objectFit: 'contain' }} />
          </div>
        </header>

        <div className="content-header">
          <button className="back-button" onClick={() => onTabChange('kelas')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <h2 className="main-title">Course Attendance Detail</h2>
          
          {/* I'll use a placeholder for the shield icon as I don't have the svg/image provided in the prompt aside from the logo */}
          <svg width="150" height="150" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="illustration">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <rect x="9" y="11" width="6" height="5" rx="1"/>
            <path d="M10 11V9a2 2 0 1 1 4 0v2"/>
          </svg>

          <div className="class-title">
            {course ? `${course.course.code} ${course.course.name}` : "Pilih kelas dari daftar kelas"}
          </div>
          <div className="class-lecturer">{course?.lecturer.full_name ?? "-"}</div>
        </div>

        <div className="history-section-header">
          <h3 className="history-title">Attendance History</h3>
          <div className="filter-dropdown">
            Month
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </div>
        </div>

        <div className="history-list">
          {attendanceHistory.length === 0 ? <p>Tidak ada riwayat presensi untuk kelas ini.</p> : null}
          {attendanceHistory.map((item) => (
            <div key={`${item.schedule_id}-${item.date}`} className="history-item">
              <span className="history-date">{item.displayDate}</span>
              <div className="history-status">
                <div className="status-dot" style={{ backgroundColor: item.color }}></div>
                {item.status}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function formatDisplayDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`).toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
