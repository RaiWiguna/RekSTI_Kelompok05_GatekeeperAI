"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import gatekeeperLogo from "../../../assets/gatekeeper_logo_only.png";
import { apiRequest } from "../../../lib/api-client";

type TodayCourse = {
  schedule_id: string;
  attendance_status: "attended" | "absent" | "not_yet";
  check_in_at: string | null;
  check_out_at: string | null;
  start_time: string;
  end_time: string;
  course: {
    code: string;
    name: string;
  };
  lecturer: {
    full_name: string;
  };
};

type FaceDetectionResult = {
  class: string;
  confidence: number;
};

type FaceDetectionResponse = {
  success: boolean;
  detections?: FaceDetectionResult[];
  error?: string;
};

type CameraScanResponse = {
  attendance_record_id: string;
  status: "present" | "left" | "alpha";
  source: "student_app";
  verification_result: "matched";
  face_probe_ref: string;
};

type HomeScreenMahasiswaProps = {
  accessToken: string;
  onLogout: () => void;
  activeTab: string;
  onTabChange: (tab: "dashboard" | "kelas" | "profil") => void;
  onNavigateToNotifications: () => void;
};

export function HomeScreenMahasiswa({ accessToken, onLogout, activeTab, onTabChange, onNavigateToNotifications }: HomeScreenMahasiswaProps) {
  const [todayCourses, setTodayCourses] = useState<TodayCourse[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<FaceDetectionResult | null>(null);
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let isMounted = true;
    apiRequest<TodayCourse[]>("me/schedules/today", { accessToken })
      .then((items) => {
        if (isMounted) {
          setTodayCourses(items);
          setSelectedScheduleId((current) => current ?? items.find((course) => course.attendance_status === "not_yet")?.schedule_id ?? items[0]?.schedule_id ?? null);
          setLoadError(null);
        }
      })
      .catch((error) => {
        if (isMounted) {
          setLoadError(error instanceof Error ? error.message : "Unable to load today's courses.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [accessToken]);

  const activeCourse = useMemo(
    () => todayCourses.find((course) => course.schedule_id === selectedScheduleId) ?? todayCourses.find((course) => course.attendance_status === "not_yet") ?? todayCourses[0],
    [selectedScheduleId, todayCourses],
  );

  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  useEffect(() => {
    return () => {
      cameraStream?.getTracks().forEach((track) => track.stop());
    };
  }, [cameraStream]);
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
  const scanAction = activeCourse?.attendance_status === "attended" ? "check_out" : "check_in";

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Browser tidak mendukung akses kamera.");
      return;
    }

    setIsCameraStarting(true);
    setCameraError(null);
    setScanError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });
      setCameraStream((current) => {
        current?.getTracks().forEach((track) => track.stop());
        return stream;
      });
    } catch (error) {
      setCameraError(error instanceof Error ? error.message : "Kamera tidak dapat diaktifkan.");
    } finally {
      setIsCameraStarting(false);
    }
  }

  function stopCamera() {
    cameraStream?.getTracks().forEach((track) => track.stop());
    setCameraStream(null);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  async function submitCameraAttendance() {
    if (!activeCourse) {
      setScanError("Tidak ada jadwal yang bisa dipakai untuk absensi.");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !cameraStream) {
      setScanError("Aktifkan kamera terlebih dahulu.");
      return;
    }

    setIsScanning(true);
    setScanError(null);
    setScanMessage(null);
    setScanResult(null);

    try {
      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Canvas capture tidak tersedia.");
      }
      context.drawImage(video, 0, 0, width, height);
      const base64Image = canvas.toDataURL("image/jpeg", 0.82).split(",")[1] ?? "";

      const detectionResponse = await fetch("/api/face-recognition/detect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: base64Image }),
      });
      const detection = (await detectionResponse.json()) as FaceDetectionResponse;
      if (!detectionResponse.ok || !detection.success) {
        throw new Error(detection.error ?? "Face recognition gagal memproses gambar.");
      }

      const matchedFace = detection.detections?.find((item) => item.class === "face_detected" && item.confidence >= 0.7) ?? null;
      setScanResult(matchedFace);
      if (!matchedFace) {
        throw new Error("Wajah belum terkonfirmasi oleh model. Coba ulangi dengan pencahayaan lebih jelas.");
      }

      const now = new Date().toISOString();
      const faceProbeRef = `web-local-camera:${activeCourse.schedule_id}:${Date.now()}:${matchedFace.confidence.toFixed(4)}`;
      const attendance = await apiRequest<CameraScanResponse>("me/attendance/camera-scan", {
        method: "POST",
        accessToken,
        body: {
          schedule_id: activeCourse.schedule_id,
          action: scanAction,
          captured_at: now,
          face_probe_ref: faceProbeRef,
        },
      });

      setScanMessage(
        `${scanAction === "check_in" ? "Check-in" : "Check-out"} berhasil. Status: ${attendance.status}. Confidence: ${(matchedFace.confidence * 100).toFixed(1)}%.`,
      );
      const refreshedCourses = await apiRequest<TodayCourse[]>("me/schedules/today", { accessToken });
      setTodayCourses(refreshedCourses);
    } catch (error) {
      setScanError(error instanceof Error ? error.message : "Absensi kamera gagal.");
    } finally {
      setIsScanning(false);
    }
  }

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
          grid-template-columns: 1fr 1fr;
          gap: 40px;
        }

        .attendance-camera {
          grid-column: 1 / -1;
          background: white;
          border: 1px solid #dbeafe;
          border-radius: 24px;
          padding: 24px;
          display: grid;
          grid-template-columns: minmax(260px, 420px) 1fr;
          gap: 24px;
          box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08);
        }

        .camera-frame {
          aspect-ratio: 4 / 3;
          background: #0f172a;
          border-radius: 18px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #e2e8f0;
          min-height: 260px;
        }

        .camera-frame video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .camera-panel {
          display: flex;
          flex-direction: column;
          gap: 16px;
          justify-content: center;
        }

        .camera-title {
          font-size: 22px;
          font-weight: 900;
          color: #112d4e;
          margin: 0;
        }

        .camera-meta {
          color: #475569;
          font-size: 14px;
          line-height: 1.6;
          margin: 0;
        }

        .camera-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .camera-button {
          border: 0;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 800;
          padding: 12px 16px;
          background: #dbeafe;
          color: #112d4e;
        }

        .camera-button.primary {
          background: #112d4e;
          color: white;
        }

        .camera-button:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        .schedule-select {
          width: 100%;
          max-width: 520px;
          border: 1px solid #bfdbfe;
          border-radius: 12px;
          padding: 11px 12px;
          color: #112d4e;
          font-weight: 700;
          background: #f8fafc;
        }

        .scan-status {
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 14px;
          line-height: 1.5;
          background: #ecfdf5;
          color: #166534;
        }

        .scan-status.error {
          background: #fef2f2;
          color: #991b1b;
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
          .attendance-camera {
            grid-template-columns: 1fr;
          }
          .sidebar {
            width: 80px;
          }
          .profile-name, .profile-info, .nav-text {
            display: none;
          }
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
            src="https://ui-avatars.com/api/?name=Aliya&background=F44336&color=fff&rounded=true&bold=true" 
            alt="Avatar" 
            className="avatar" 
          />
          <h2 className="profile-name">Halo, Aliya</h2>
          <p className="profile-info">Sistem dan Teknologi Informasi - 2023</p>
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
              <h2 className="class-title">
                {activeCourse ? `${activeCourse.course.code} ${activeCourse.course.name}` : "Tidak ada jadwal aktif"}
              </h2>
              <p className="class-lecturer">{activeCourse?.lecturer.full_name ?? "-"}</p>
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
              {loadError ? <p>{loadError}</p> : null}
              {!loadError && todayCourses.length === 0 ? <p>Tidak ada jadwal hari ini.</p> : null}
              {todayCourses.map(course => {
                const status = getStatusDisplay(course.attendance_status);
                return (
                <div
                  key={course.schedule_id}
                  className="course-item"
                  onClick={() => setSelectedScheduleId(course.schedule_id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      setSelectedScheduleId(course.schedule_id);
                    }
                  }}
                >
                  <div className="course-name">
                    <span className="course-code">{course.course.code}</span>
                    {course.course.name}
                  </div>
                  <div className="status-badge">
                    <div className="status-dot" style={{ backgroundColor: status.color }}></div>
                    {status.label}
                  </div>
                </div>
              )})}
            </div>
          </div>

          <section className="attendance-camera">
            <div className="camera-frame">
              {cameraStream ? (
                <video ref={videoRef} autoPlay muted playsInline />
              ) : (
                <span>Kamera lokal belum aktif</span>
              )}
            </div>
            <div className="camera-panel">
              <div>
                <h2 className="camera-title">Absensi Kamera Lokal</h2>
                <p className="camera-meta">
                  {activeCourse
                    ? `${activeCourse.course.code} ${activeCourse.course.name} - ${new Date(activeCourse.start_time).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} sampai ${new Date(activeCourse.end_time).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`
                    : "Pilih jadwal hari ini untuk memulai scan."}
                </p>
              </div>
              <select
                className="schedule-select"
                value={activeCourse?.schedule_id ?? ""}
                onChange={(event) => setSelectedScheduleId(event.target.value)}
                disabled={todayCourses.length === 0}
              >
                {todayCourses.length === 0 ? <option value="">Tidak ada jadwal</option> : null}
                {todayCourses.map((course) => (
                  <option key={course.schedule_id} value={course.schedule_id}>
                    {course.course.code} {course.course.name} - {getStatusDisplay(course.attendance_status).label}
                  </option>
                ))}
              </select>
              <div className="camera-actions">
                <button className="camera-button" type="button" onClick={startCamera} disabled={isCameraStarting}>
                  {cameraStream ? "Restart Kamera" : isCameraStarting ? "Membuka..." : "Aktifkan Kamera"}
                </button>
                <button className="camera-button" type="button" onClick={stopCamera} disabled={!cameraStream}>
                  Matikan
                </button>
                <button
                  className="camera-button primary"
                  type="button"
                  onClick={() => void submitCameraAttendance()}
                  disabled={!activeCourse || !cameraStream || isScanning}
                >
                  {isScanning ? "Memindai..." : scanAction === "check_in" ? "Scan Check-in" : "Scan Check-out"}
                </button>
              </div>
              {scanResult ? (
                <div className="scan-status">
                  Model mendeteksi {scanResult.class} dengan confidence {(scanResult.confidence * 100).toFixed(1)}%.
                </div>
              ) : null}
              {scanMessage ? <div className="scan-status">{scanMessage}</div> : null}
              {cameraError || scanError ? <div className="scan-status error">{cameraError ?? scanError}</div> : null}
              <canvas ref={canvasRef} hidden />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function getStatusDisplay(status: TodayCourse["attendance_status"]) {
  if (status === "attended") {
    return { label: "Attended", color: "#4ADE80" };
  }
  if (status === "absent") {
    return { label: "Absent", color: "#F87171" };
  }
  return { label: "Not Yet", color: "#FACC15" };
}
