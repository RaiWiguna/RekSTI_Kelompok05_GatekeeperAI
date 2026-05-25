"use client";

import React from "react";
import gatekeeperLogo from "../../../assets/gatekeeper_logo_only.png";
import type { 
  LecturerClassRoster, 
  LecturerManagedClass, 
  LecturerTodayClass 
} from "../types";

type HomeScreenDosenProps = {
  user: { name: string; email: string };
  onLogout: () => void;
  activeTab: string;
  onTabChange: (tab: "dashboard" | "kelas" | "profil" | "rincian") => void;
  lecturerTodayClasses: LecturerTodayClass[];
  lecturerManagedClasses: LecturerManagedClass[];
  lecturerRoster: LecturerClassRoster | null;
  onNavigateToNotifications: () => void;
  onOverride: (action: "unlock" | "lock", roomId?: string) => void;
  isOverrideSubmitting?: boolean;
};

export function HomeScreenDosen({ 
  user, 
  onLogout, 
  activeTab, 
  onTabChange,
  lecturerTodayClasses,
  onNavigateToNotifications,
  onOverride,
  isOverrideSubmitting = false,
}: HomeScreenDosenProps) {
  const currentClass = toTodayClassSummary(lecturerTodayClasses[0]);
  const isDoorControlDisabled = isOverrideSubmitting || !currentClass.roomId;

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

        .dashboard-grid {
          display: grid;
          grid-template-columns: 350px 1fr;
          gap: 40px;
        }

        .today-class-container {
          background-color: #dbeafe;
          border-radius: 20px;
          padding: 24px;
          display: flex;
          flex-direction: column;
        }

        .section-title {
          font-size: 20px;
          font-weight: 800;
          color: #000;
          margin-bottom: 24px;
        }

        .class-header {
          text-align: center;
          margin-bottom: 20px;
        }

        .class-code-name {
          font-size: 16px;
          font-weight: 800;
          color: #112d4e;
          margin-bottom: 4px;
        }

        .class-details {
          font-size: 12px;
          color: #112d4e;
          font-weight: 600;
        }

        .stats-grid {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .stat-card-large, .stat-card-small {
          background: white;
          border-radius: 15px;
          padding: 20px;
          text-align: center;
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        }

        .stat-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .stat-label {
          font-size: 13px;
          font-weight: 800;
          color: #112d4e;
          margin-bottom: 30px;
          display: block;
        }

        .stat-value {
          font-size: 42px;
          font-weight: bold;
          color: #1e293b;
        }

        .pantau-button {
          margin-top: 20px;
          background-color: #112d4e;
          color: white;
          padding: 12px 20px;
          border-radius: 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: bold;
          font-size: 13px;
          cursor: pointer;
          border: none;
        }

        .arrow-circle {
          background: #fde4c8;
          color: #112d4e;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .door-control-container {
          background-color: #fde4c8;
          border-radius: 20px;
          padding: 30px;
          max-width: 450px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          height: fit-content;
        }

        .countdown-timer {
          font-size: 48px;
          font-weight: bold;
          color: #ef4444;
          margin-bottom: 25px;
        }

        .door-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          width: 100%;
        }

        .door-button {
          background-color: #112d4e;
          color: white;
          width: 100%;
          padding: 15px;
          border-radius: 8px;
          font-weight: bold;
          cursor: pointer;
          border: none;
        }

        .door-button:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        .lock-door-button {
          background-color: #b91c1c;
        }

        @media (max-width: 1024px) {
          .dashboard-grid { grid-template-columns: 1fr; }
          .sidebar { width: 80px; }
          .profile-name, .profile-info, .nav-text { display: none; }
          .profile-section {
            padding: 0;
            align-items: center;
          }
          .main-content {
            padding: 20px;
          }
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

        <div className="dashboard-grid">
          <div className="today-class-container">
            <h2 className="section-title">Today's Class</h2>
            <div className="class-header">
              <div className="class-code-name">{currentClass.courseCode} {currentClass.courseName}</div>
              <div className="class-details">{currentClass.className}</div>
            </div>

            <div className="stats-grid">
              <div className="stat-card-large">
                <span className="stat-label">Total Mahasiswa</span>
                <span className="stat-value">{currentClass.studentCount}</span>
              </div>
              <div className="stat-row">
                <div className="stat-card-small">
                  <span className="stat-label">Total Hadir</span>
                  <span className="stat-value">{currentClass.presentCount}</span>
                </div>
                <div className="stat-card-small">
                  <span className="stat-label">Total Belum Hadir</span>
                  <span className="stat-value">{currentClass.studentCount - currentClass.presentCount}</span>
                </div>
              </div>
            </div>

            <button className="pantau-button" onClick={() => onTabChange('rincian')}>
              Pantau Kehadiran
              <div className="arrow-circle">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </button>
          </div>

          <div className="door-control-container">
            <p className="door-instruction">
              Gunakan tombol dibawah untuk membuka kunci pintu kelas tanpa melakukan pengenalan wajah. Pintu akan terkunci kembali dalam:
            </p>
            <div className="countdown-timer">00:00:00</div>
            <div className="door-actions">
              <button
                className="door-button open-door-button"
                disabled={isDoorControlDisabled}
                onClick={() => onOverride("unlock", currentClass.roomId)}
              >
                Buka Pintu
              </button>
              <button
                className="door-button lock-door-button"
                disabled={isDoorControlDisabled}
                onClick={() => onOverride("lock", currentClass.roomId)}
              >
                Kunci Pintu
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function toTodayClassSummary(classItem?: LecturerTodayClass) {
  if (!classItem) {
    return {
      courseCode: "II3230",
      courseName: "Keamanan Informasi",
      className: "Kelas 01 - 7601",
      roomId: undefined,
      studentCount: 72,
      presentCount: 50,
    };
  }

  return {
    courseCode: classItem.course.code,
    courseName: classItem.course.name,
    className: `${classItem.class_code} - ${classItem.room.code}`,
    roomId: classItem.room.id,
    studentCount: classItem.enrollments_count,
    presentCount: classItem.present_count ?? 0,
  };
}
