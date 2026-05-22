"use client";

import React from "react";
import gatekeeperLogo from "../../../assets/gatekeeper_logo_only.png";

const CLASSES = [
  { code: "II3230", name: "Keamanan Informasi", className: "Kelas 01", attendance: "90.76 %" },
  { code: "II3230", name: "Keamanan Informasi", className: "Kelas 02", attendance: "50.81 %" },
  { code: "II3230", name: "Keamanan Informasi", className: "Kelas 03", attendance: "66.66 %" },
  { code: "II3240", name: "Rekayasa Sistem TI", className: "Kelas 01", attendance: "87.77 %" },
  { code: "II3240", name: "Rekayasa Sistem TI", className: "Kelas 02", attendance: "76.34 %" },
  { code: "II3240", name: "Rekayasa Sistem TI", className: "Kelas 03", attendance: "80 %" },
  { code: "II4021", name: "Kriptografi", className: "Kelas 01", attendance: "87.77 %" },
  { code: "II4021", name: "Kriptografi", className: "Kelas 02", attendance: "76.34 %" },
];

type ClassesDosenProps = {
  onLogout: () => void;
  activeTab: string;
  onTabChange: (tab: any) => void;
  user: { name: string; email: string };
  onNavigateToNotifications: () => void;
};

export function ClassesDosen({ onLogout, activeTab, onTabChange, user, onNavigateToNotifications }: ClassesDosenProps) {
  return (
    <div className="dashboard-wrapper">
      <style jsx>{`
        .dashboard-wrapper {
          display: flex;
          min-height: 100vh;
          background-color: #f8fafc;
          font-family: 'Inter', sans-serif;
        }

        .dashboard-wrapper :global(*) {
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
          display: flex;
          flex-direction: column;
          align-items: flex-start;
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
          color: #fff;
          text-decoration: none;
        }

        .nav-item.active {
          background-color: #93c5fd;
          color: #112d4e;
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

        /* CLASSES LIST */
        .classes-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .class-card {
          background: white;
          border-radius: 12px;
          padding: 24px 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }

        .class-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .class-name {
          font-size: 18px;
          font-weight: 800;
          color: #112d4e;
        }

        .class-subtext {
          font-size: 14px;
          color: #64748b;
          font-weight: 500;
        }

        .class-action {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 12px;
        }

        .attendance-badge {
          background-color: #fde4c8;
          color: #112d4e;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 900;
        }

        .detail-button {
          background-color: #112d4e;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          border: none;
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
            src={`https://ui-avatars.com/api/?name=${user.name}&background=112d4e&color=fff&rounded=true&bold=true`} 
            alt="Avatar" 
            className="avatar" 
          />
          <h2 className="profile-name">Halo, {user.name}</h2>
          <p className="profile-info">Sekolah Teknik Elektro dan Informatika</p>
        </div>

        <nav className="nav-menu">
          <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => onTabChange('dashboard')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <span className="nav-text">Dashboard</span>
          </div>
          <div className={`nav-item ${activeTab === 'kelas' ? 'active' : ''}`} onClick={() => onTabChange('kelas')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            <span className="nav-text">Kelas</span>
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

        <div className="classes-list">
          {CLASSES.map((item, index) => (
            <div key={index} className="class-card">
              <div className="class-info">
                <div className="class-name">{item.code} {item.name}</div>
                <div className="class-subtext">{item.className}</div>
              </div>
              <div className="class-action">
                <div className="attendance-badge">{item.attendance}</div>
                <button className="detail-button" onClick={() => onTabChange('rincian-kelas-dosen')}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
