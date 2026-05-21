"use client";

import React from "react";
import gatekeeperLogo from "../../../assets/gatekeeper_logo_only.png";

type ProfileDosenProps = {
  onLogout: () => void;
  activeTab: string;
  onTabChange: (tab: "dashboard" | "kelas" | "profil" | "rincian") => void;
  user: { name: string; email: string };
};

export function ProfileDosen({ onLogout, activeTab, onTabChange, user }: ProfileDosenProps) {
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
        }

        .avatar-small {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          border: 3px solid #facc15;
          margin-bottom: 16px;
        }

        .profile-name-small {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 4px;
        }

        .profile-info-small {
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
          text-decoration: none;
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

        /* PROFILE CONTENT */
        .profile-display {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding-bottom: 100px;
        }

        .avatar-large-container {
          width: 200px;
          height: 200px;
          border-radius: 50%;
          background-color: #bbdefb;
          display: flex;
          justify-content: center;
          align-items: flex-end;
          overflow: hidden;
          margin-bottom: 30px;
        }

        .avatar-large {
          width: 160px;
          height: 160px;
          object-fit: contain;
        }

        .user-full-name {
          font-size: 32px;
          font-weight: 800;
          color: #112d4e;
          margin-bottom: 8px;
        }

        .user-email {
          font-size: 18px;
          color: #64748b;
          margin-bottom: 12px;
        }

        .user-role {
          font-size: 20px;
          font-weight: bold;
          color: #112d4e;
          margin-bottom: 40px;
        }

        .logout-button {
          background-color: #112d4e;
          color: white;
          padding: 12px 80px;
          border-radius: 8px;
          font-weight: bold;
          font-size: 16px;
          border: none;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .logout-button:hover {
          background-color: #0d223c;
        }

        @media (max-width: 1024px) {
          .sidebar { width: 80px; }
          .profile-name-small, .profile-info-small, .nav-text { display: none; }
          .profile-section { padding: 0; align-items: center; }
          .main-content { padding: 20px; }
        }
      `}</style>

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="profile-section">
          <img 
            src={`https://ui-avatars.com/api/?name=${user.name}&background=112d4e&color=fff&rounded=true&bold=true`} 
            alt="Avatar" 
            className="avatar-small" 
          />
          <h2 className="profile-name-small">Halo, {user.name}</h2>
          <p className="profile-info-small">Sekolah Teknik Elektro dan Informatika</p>
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

        <div className="profile-display">
          <div className="avatar-large-container">
            <img 
              src={`https://ui-avatars.com/api/?name=${user.name}&background=bbdefb&color=112d4e&rounded=true&bold=true`} 
              alt="Profile" 
              className="avatar-large"
            />
          </div>
          <h2 className="user-full-name">{user.name}</h2>
          <p className="user-email">{user.email}</p>
          <p className="user-role">Dosen</p>

          <button className="logout-button" onClick={onLogout}>
            Logout
          </button>
        </div>
      </main>
    </div>
  );
}
