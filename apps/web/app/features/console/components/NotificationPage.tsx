"use client";

import React from "react";

type NotificationItem = {
  id: string;
  courseCode: string;
  courseName: string;
  status: string;
  description: string;
  type: "success" | "warning" | "info" | "error";
};

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "1",
    courseCode: "II3230",
    courseName: "Keamanan Informasi",
    status: "Kehadiran terkonfirmasi",
    description: "Anda tercatat telah mengikuti seluruh rangkaian sesi kelas ini sesuai dengan ketentuan perkuliahan yang berlaku.",
    type: "success",
  },
  {
    id: "2",
    courseCode: "II3240",
    courseName: "Rekayasa Sistem TI",
    status: "Status kehadiran: Tidak Hadir",
    description: "Sistem tidak mendeteksi presensi Anda pada jadwal perkuliahan ini sejak kelas dimulai.",
    type: "warning",
  },
  {
    id: "3",
    courseCode: "II3220",
    courseName: "Tata Kelola Teknologi Informasi",
    status: "Kehadiran terkonfirmasi",
    description: "Anda tercatat telah mengikuti seluruh rangkaian sesi kelas ini sesuai dengan ketentuan perkuliahan yang berlaku.",
    type: "success",
  },
  {
    id: "4",
    courseCode: "II3230",
    courseName: "Keamanan Informasi",
    status: "Status kehadiran: Tidak Hadir",
    description: "Anda meninggalkan kelas lebih dari batas waktu 30 menit.",
    type: "warning",
  },
];

type NotificationPageProps = {
  onBack: () => void;
};

export function NotificationPage({ onBack }: NotificationPageProps) {
  const getIcon = (courseCode: string) => {
    // Mock icons based on course or type
    if (courseCode === "II3230") return "🛡️";
    if (courseCode === "II3240") return "👷";
    if (courseCode === "II3220") return "👥";
    return "🔔";
  };

  return (
    <div className="notification-container">
      <style jsx>{`
        .notification-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
          font-family: 'Inter', sans-serif;
        }

        .header {
          display: flex;
          align-items: center;
          margin-bottom: 40px;
          position: relative;
          justify-content: center;
        }

        .back-button {
          position: absolute;
          left: 0;
          background: #112d4e;
          color: white;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .title {
          font-size: 24px;
          font-weight: 800;
          color: #112d4e;
        }

        .notification-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .notification-item {
          background: #f1f5f9;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          gap: 20px;
          align-items: flex-start;
        }

        .icon-container {
          background: white;
          width: 60px;
          height: 60px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 30px;
          flex-shrink: 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .content {
          flex: 1;
        }

        .item-title {
          font-size: 16px;
          font-weight: 700;
          color: #112d4e;
          margin-bottom: 4px;
        }

        .item-status {
          font-size: 13px;
          font-weight: 700;
          color: #112d4e;
          margin-bottom: 4px;
        }

        .item-description {
          font-size: 12px;
          color: #475569;
          line-height: 1.5;
        }
      `}</style>

      <div className="header">
        <button className="back-button" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="title">Notifications</h1>
      </div>

      <div className="notification-list">
        {MOCK_NOTIFICATIONS.map((notif) => (
          <div key={notif.id} className="notification-item">
            <div className="icon-container">
              {getIcon(notif.courseCode)}
            </div>
            <div className="content">
              <h2 className="item-title">
                {notif.courseCode} {notif.courseName}
              </h2>
              <p className="item-status">{notif.status}</p>
              <p className="item-description">{notif.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
