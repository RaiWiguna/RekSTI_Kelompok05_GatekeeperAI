c"use client";

import React from "react";

const TODAY_COURSES = [
  {
    id: 1,
    code: "II3220",
    name: "Tata Kelola Teknologi Informasi",
    status: "Attended",
    color: "#4ADE80",
  },
  {
    id: 2,
    code: "WI2022",
    name: "Manajemen Proyek",
    status: "Absent",
    color: "#F87171",
  },
  {
    id: 3,
    code: "II3230",
    name: "Keamanan Informasi",
    status: "Not Yet",
    color: "#FACC15",
  },
  {
    id: 4,
    code: "II3240",
    name: "Rekayasa Sistem TI",
    status: "Not Yet",
    color: "#FACC15",
  },
];

export function HomeScreenMahasiswa() {
  const getCurrentDate = () => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date().toLocaleDateString('id-ID', options);
  };

  const currentDate = getCurrentDate();

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
        }

        .profile-section {
          padding: 0 30px;
          margin-bottom: 40px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
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
          text-decoration: none;
        }

        .nav-item.active {
          background: rgba(255, 255, 255, 0.1);
          border-left: 4px solid #fde4c8;
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
        }

        .brand-subtitle {
          font-size: 14px;
          color: #112d4e;
          font-weight: 500;
        }

        .brand-highlight {
          color: #00a8e8;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
        }

        /* ACTIVE CLASS CARD */
        .active-class-container {
          background-color: #dbeafe;
          border-radius: 30px;
          padding: 30px;
          display: flex;
          flex-direction: column;
        }

        .timer-row {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-bottom: 20px;
        }

        .timer-box {
          background: white;
          padding: 8px 12px;
          border-radius: 8px;
          text-align: center;
          min-width: 50px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .timer-val {
          font-size: 16px;
          font-weight: 900;
          display: block;
        }

        .timer-unit {
          font-size: 10px;
          font-weight: bold;
          text-transform: uppercase;
        }

        .class-info {
          text-align: center;
          margin-bottom: 30px;
        }

        .class-title {
          font-size: 22px;
          font-weight: 900;
          color: #112d4e;
          margin-bottom: 8px;
        }

        .class-lecturer {
          font-size: 14px;
          color: #3b82f6;
          font-weight: 600;
        }

        .punch-cards {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .punch-card {
          background: white;
          border-radius: 20px;
          padding: 24px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .punch-label {
          font-size: 20px;
          font-weight: 900;
          color: #112d4e;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .punch-time {
          font-size: 32px;
          font-weight: bold;
          color: #334155;
        }

        .punch-date {
          font-size: 13px;
          color: #64748b;
        }

        /* TODAY'S COURSE */
        .courses-section {
          display: flex;
          flex-direction: column;
        }

        .section-header {
          font-size: 24px;
          font-weight: 800;
          margin-bottom: 24px;
        }

        .course-item {
          background: white;
          border: 1px solid #112d4e;
          border-radius: 100px;
          padding: 18px 30px;
          margin-bottom: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: transform 0.2s;
        }

        .course-item:hover {
          transform: translateX(10px);
        }

        .course-name {
          font-size: 15px;
          font-weight: 500;
          color: #1e293b;
        }

        .course-code {
          font-weight: 800;
          color: #112d4e;
          margin-right: 8px;
        }

        .status-badge {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: bold;
          font-size: 14px;
          min-width: 100px;
        }

        .status-dot {
          width: 16px;
          height: 16px;
          border-radius: 50%;
        }

        @media (max-width: 1024px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
          .sidebar {
            width: 80px;
            padding: 40px 10px;
          }
          .profile-name, .profile-info, .nav-text {
            display: none;
          }
          .profile-section {
            padding: 0;
            align-items: center;
          }
        }
      `}</style>

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="profile-section">
          <img 
            src="https://ui-avatars.com/api/?name=Aliya&background=F44336&color=fff&rounded=true&bold=true" 
            alt="Avatar" 
            className="avatar" 
          />
          <h2 className="profile-name">Halo, Aliya</h2>
          <p className="profile-info">Sistem dan Teknologi Informasi - 2023</p>
        </div>

        <nav className="nav-menu">
          <div className="nav-item active">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <span className="nav-text">Dashboard</span>
          </div>
          <div className="nav-item">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            <span className="nav-text">Kelas</span>
          </div>
          <div className="nav-item">
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
            <img src="/gatekeeper.png" alt="Logo" style={{ width: 60, height: 60, objectFit: 'contain' }} />
          </div>
        </header>

        <div className="dashboard-grid">
          {/* LEFT: ACTIVE CLASS */}
          <div className="active-class-container">
            <div className="timer-row">
              <div className="timer-box">
                <span className="timer-val">09</span>
                <span className="timer-unit">Menit</span>
              </div>
              <div className="timer-box">
                <span className="timer-val">45</span>
                <span className="timer-unit">Detik</span>
              </div>
            </div>

            <div className="class-info">
              <h2 className="class-title">II3230 Keamanan Informasi</h2>
              <p className="class-lecturer">Ir. Budi Rahardjo, M.Sc., Ph.D.</p>
            </div>

            <div className="punch-cards">
              <div className="punch-card">
                <div className="punch-label">
                  Arrive 
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                </div>
                <div className="punch-time">-</div>
                <div className="punch-date">{currentDate}</div>
              </div>
              <div className="punch-card">
                <div className="punch-label">
                  Depart
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                </div>
                <div className="punch-time">-</div>
                <div className="punch-date">{currentDate}</div>
              </div>
            </div>
          </div>

          {/* RIGHT: TODAY'S COURSE */}
          <div className="courses-section">
            <h2 className="section-header">Today's Course</h2>
            <div className="course-list">
              {TODAY_COURSES.map(course => (
                <div key={course.id} className="course-item">
                  <div className="course-name">
                    <span className="course-code">{course.code}</span>
                    {course.name}
                  </div>
                  <div className="status-badge">
                    <div className="status-dot" style={{ backgroundColor: course.color }}></div>
                    {course.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
