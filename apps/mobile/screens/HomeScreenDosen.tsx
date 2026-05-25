import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  Pressable,
  Alert,
  Modal,
  TouchableOpacity,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  getLecturerClasses,
  getLecturerClassRoster,
  getLecturerTodayClasses,
  sendDoorOverride,
  type LecturerClassRoster,
  type LecturerClassSummary,
} from "../api-client";

// --- DATA MOCKUP ---
const INITIAL_STUDENTS = [
  { id: 1, name: "Zheannetta Apple H.", status: "Hadir" },
  { id: 2, name: "Muhammad Aymar B.", status: "Alpha" },
  { id: 3, name: "Nawaf Amjad R. A. I.", status: "Izin" },
  { id: 4, name: "Aliya Harta Ary U.", status: "Hadir" },
  { id: 5, name: "I Nyoman Rai Dharma W.", status: "Alpha" },
  { id: 6, name: "Zheannetta Apple H.", status: "Alpha" },
  { id: 7, name: "Muhammad Aymar B.", status: "Izin" },
  { id: 8, name: "Nawaf Amjad R. A. I.", status: "Hadir" },
];

const DOSEN_CLASSES = [
  { id: 1, code: "II3230", name: "Keamanan Informasi", classCode: "Kelas 01", attendance: "90.76 %" },
  { id: 2, code: "II3230", name: "Keamanan Informasi", classCode: "Kelas 02", attendance: "50.81 %" },
  { id: 3, code: "II3230", name: "Keamanan Informasi", classCode: "Kelas 03", attendance: "66.66 %" },
  { id: 4, code: "II3240", name: "Rekayasa Sistem TI", classCode: "Kelas 01", attendance: "87.77 %" },
  { id: 5, code: "II3240", name: "Rekayasa Sistem TI", classCode: "Kelas 02", attendance: "76.34 %" },
  { id: 6, code: "II3240", name: "Rekayasa Sistem TI", classCode: "Kelas 03", attendance: "90 %" },
];

const ATTENDANCE_HISTORY_DOSEN = [
  { id: 1, date: "Senin, 9 Februari 2026" },
  { id: 2, date: "Rabu, 11 Februari 2026" },
  { id: 3, date: "Senin, 16 Februari 2026" },
  { id: 4, date: "Rabu, 18 Februari 2026" },
  { id: 5, date: "Senin, 23 Februari 2026" },
  { id: 6, date: "Rabu, 25 Februari 2026" },
];

// Mock data notifikasi pintu khusus dosen
const NOTIFICATIONS_DOSEN = [
  { id: 1, title: "Akses Pintu Berhasil", desc: "Pintu Ruang 7601 berhasil dibuka manual.", time: "Baru saja", icon: "door-open", color: "#4ADE80" },
  { id: 2, title: "Sistem Terkunci Kembali", desc: "Pintu Ruang 7601 telah otomatis terkunci kembali.", time: "1 menit yang lalu", icon: "door-closed", color: "#F87171" },
  { id: 3, title: "Akses Pintu Berhasil", desc: "Pintu Ruang 7601 berhasil dibuka manual.", time: "2 jam yang lalu", icon: "door-open", color: "#4ADE80" },
];

type LecturerRosterStudent = {
  id: string;
  name: string;
  status: string;
};

// --- FUNGSI BANTUAN ---
const getStatusColor = (status: string) => {
  switch (status) {
    case "Hadir": return "#059669";
    case "Izin": return "#D97706";
    case "Alpha": return "#DC2626";
    default: return "#112D4E";
  }
};

const getMonthFromDateStr = (dateStr: string) => {
  const parts = dateStr.split(" ");
  if (parts.length >= 3) return parts[2];
  return "";
};

// =======================================================
// KOMPONEN: HALAMAN NOTIFIKASI DOSEN (BARU)
// =======================================================
function NotificationScreenDosen({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.detailContainer}>
      <StatusBar style="dark" />
      
      <View style={styles.detailHeader}>
        <Pressable style={styles.backButton} onPress={onBack}>
          <Feather name="chevron-left" size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.detailTitle}>Notifications</Text>
      </View>

      <ScrollView contentContainerStyle={styles.detailScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.notifListContainer}>
          {NOTIFICATIONS_DOSEN.map((notif) => (
            <View key={notif.id} style={styles.notifCard}>
              <View style={[styles.notifIconWrapper, { backgroundColor: notif.color + "20" }]}>
                <MaterialCommunityIcons name={notif.icon as any} size={24} color={notif.color} />
              </View>
              <View style={styles.notifTextWrapper}>
                <View style={styles.notifHeaderRow}>
                  <Text style={styles.notifCardTitle}>{notif.title}</Text>
                  <Text style={styles.notifTimeText}>{notif.time}</Text>
                </View>
                <Text style={styles.notifDescText}>{notif.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// =======================================================
// KOMPONEN 1: HALAMAN DAFTAR MAHASISWA (PANTAU KEHADIRAN)
// =======================================================
function CourseAttendanceDetailScreen({ roster, onBack }: { roster: LecturerClassRoster | null; onBack: () => void }) {
  const [students, setStudents] = useState<LecturerRosterStudent[]>(
    roster?.students.map((item) => ({
      id: item.student.id,
      name: item.student.full_name,
      status: item.status === "active" ? "Belum Hadir" : "Alpha",
    })) ?? INITIAL_STUDENTS.map((student) => ({ ...student, id: String(student.id) })),
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const openDropdown = (id: string) => {
    setSelectedStudentId(id);
    setModalVisible(true);
  };

  const handleStatusChange = (newStatus: string) => {
    if (selectedStudentId !== null) {
      setStudents(prev => 
        prev.map(student => 
          student.id === selectedStudentId ? { ...student, status: newStatus } : student
        )
      );
    }
    setModalVisible(false);
  };

  return (
    <View style={styles.detailContainer}>
      <StatusBar style="dark" />
      
      <View style={styles.detailHeader}>
        <Pressable style={styles.backButton} onPress={onBack}>
          <Feather name="chevron-left" size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.detailTitle}>Course Attendance Detail</Text>
      </View>

      <ScrollView contentContainerStyle={styles.detailScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.detailCourseInfo}>
          <Text style={styles.detailCourseCode}>
            {roster ? `${roster.course.code} ${roster.course.name}` : "Kelas belum tersedia"}
          </Text>
          <Text style={styles.detailCourseClass}>
            {roster ? `${roster.class_code} - ${roster.room.code}` : "-"}
          </Text>
        </View>

        <View style={styles.studentList}>
          {students.map((student) => {
            const statusColor = getStatusColor(student.status); 
            return (
              <View key={student.id} style={styles.studentRow}>
                <Text style={styles.studentName}>{student.name}</Text>
                <Pressable 
                  style={[styles.statusPill, { borderColor: statusColor }]} 
                  onPress={() => openDropdown(student.id)}
                >
                  <Text style={[styles.statusPillText, { color: statusColor }]}>{student.status}</Text>
                  <Feather name="chevron-down" size={16} color={statusColor} />
                </Pressable>
              </View>
            );
          })}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ubah Status Kehadiran</Text>
            {["Hadir", "Izin", "Alpha"].map((statusOption) => {
              const optionColor = getStatusColor(statusOption);
              return (
                <TouchableOpacity 
                  key={statusOption} style={styles.modalOption} 
                  onPress={() => handleStatusChange(statusOption)}
                >
                  <Text style={[styles.modalOptionText, { color: optionColor }]}>{statusOption}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

// =======================================================
// KOMPONEN 2: HALAMAN RIWAYAT ABSENSI
// =======================================================
function AttendanceHistoryDetailScreenDosen({ onBack }: { onBack: () => void }) {
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const availableMonths = Array.from(new Set(ATTENDANCE_HISTORY_DOSEN.map(item => getMonthFromDateStr(item.date))));
  
  const filteredHistory = selectedMonth
    ? ATTENDANCE_HISTORY_DOSEN.filter(item => getMonthFromDateStr(item.date) === selectedMonth)
    : ATTENDANCE_HISTORY_DOSEN;

  const handleDownload = (dateStr: string) => {
    Alert.alert("Download", `Mengunduh data kehadiran untuk ${dateStr}`);
  };

  return (
    <View style={styles.detailContainer}>
      <StatusBar style="dark" />
      
      <View style={styles.detailHeader}>
        <Pressable style={styles.backButton} onPress={onBack}>
          <Feather name="chevron-left" size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.detailTitle}>Attendance History Detail</Text>
      </View>

      <ScrollView contentContainerStyle={styles.detailScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.shieldWrapper}>
          <View style={styles.shieldPlaceholder}>
            <MaterialCommunityIcons name="shield-lock" size={80} color="#4ADE80" />
          </View>
        </View>

        <View style={styles.detailCourseInfo}>
          <Text style={styles.detailCourseCode}>II3230 Keamanan Informasi</Text>
          <Text style={styles.detailCourseClass}>Kelas 01</Text>
        </View>

        <View style={styles.historySection}>
          <View style={styles.historyHeaderRow}>
            <Text style={styles.historyTitleText}>Attendance History</Text>
            <Pressable style={styles.monthFilterBtn} onPress={() => setIsFilterVisible(true)}>
              <Text style={styles.monthFilterText}>{selectedMonth || "Month"}</Text>
              <Ionicons name="filter" size={14} color="#FFFFFF" />
            </Pressable>
          </View>

          {filteredHistory.map((record) => (
            <View key={record.id} style={styles.historyItemRow}>
              <Text style={styles.historyDateText}>{record.date}</Text>
              <Pressable onPress={() => handleDownload(record.date)}>
                <Feather name="download" size={20} color="#112D4E" />
              </Pressable>
            </View>
          ))}
          
          {filteredHistory.length === 0 && (
             <Text style={{textAlign: 'center', marginTop: 20, color: '#64748B'}}>Tidak ada data.</Text>
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={isFilterVisible} transparent={true} animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setIsFilterVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Pilih Bulan</Text>
            <TouchableOpacity 
              style={styles.modalOption} 
              onPress={() => { setSelectedMonth(null); setIsFilterVisible(false); }}
            >
              <Text style={styles.modalOptionText}>Semua Bulan</Text>
            </TouchableOpacity>

            {availableMonths.map((month, index) => (
              <TouchableOpacity 
                key={index} style={styles.modalOption} 
                onPress={() => { setSelectedMonth(month); setIsFilterVisible(false); }}
              >
                <Text style={styles.modalOptionText}>{month}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

// =======================================================
// KOMPONEN 3: HALAMAN DAFTAR KELAS DOSEN
// =======================================================
function ClassListScreenDosen({
  onNavigateHome,
  onNavigateToHistory,
  onNavigateToProfile,
  onNavigateToNotifications,
  classes,
  onSelectClass
}: {
  onNavigateHome: () => void;
  onNavigateToHistory: () => void;
  onNavigateToProfile: () => void;
  onNavigateToNotifications: () => void;
  classes: LecturerClassSummary[];
  onSelectClass: (classId: string) => void;
}) {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.userInfo}>
              <Image
                source={{ uri: "https://ui-avatars.com/api/?name=Aymar&background=CFE2F3&color=112D4E&rounded=true&bold=true" }}
                style={styles.avatar}
              />
              <View style={styles.textContainer}>
                <Text style={styles.greeting}>Halo, Aymar</Text>
                <Text style={styles.subGreeting}>Sekolah Teknik Elektro dan Informatika</Text>
              </View>
            </View>
            <Pressable style={styles.bellIcon} onPress={onNavigateToNotifications}>
              <Feather name="bell" size={24} color="#F6E4C8" />
            </Pressable>
          </View>
        </View>

        <View style={styles.classListContainer}>
          {classes.length === 0 ? (
            <Text style={{ color: "#64748B", textAlign: "center" }}>Tidak ada kelas yang terhubung.</Text>
          ) : null}
          {classes.map((item) => (
            <View key={item.class_id} style={styles.classItemCard}>
              <View style={styles.classItemLeft}>
                <Text style={styles.classItemTitle}>{item.course.code} {item.course.name}</Text>
                <Text style={styles.classItemSubtitle}>{item.class_code} - {item.room.code}</Text>
              </View>

              <View style={styles.classItemRight}>
                <View style={styles.classItemBadge}>
                  <Text style={styles.classItemBadgeText}>
                    {item.enrollments_count === 0 ? "0.00 %" : `${(((item.present_count ?? 0) / item.enrollments_count) * 100).toFixed(2)} %`}
                  </Text>
                </View>
                <Pressable style={styles.classItemArrow} onPress={() => {
                  onSelectClass(item.class_id);
                  onNavigateToHistory();
                }}>
                  <Feather name="chevron-right" size={20} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.bottomNav}>
        <Pressable style={styles.navItem} onPress={onNavigateHome}>
          <Ionicons name="home" size={32} color="#FDEFD3" />
        </Pressable>
        
        <Pressable style={styles.navItemActive}>
          <View style={styles.navIconActiveBg}>
            <MaterialCommunityIcons name="clipboard-text-clock-outline" size={32} color="#FFFFFF" />
          </View>
        </Pressable>

        <Pressable style={styles.navItem} onPress={onNavigateToProfile}>
          <Ionicons name="person-circle-outline" size={34} color="#FDEFD3" />
        </Pressable>
      </View>
    </View>
  );
}

// =======================================================
// KOMPONEN 4: HALAMAN PROFILE DOSEN
// =======================================================
function ProfileScreenDosen({
  onNavigateHome,
  onNavigateToClasses,
  onLogout
}: {
  onNavigateHome: () => void;
  onNavigateToClasses: () => void;
  onLogout?: () => void;
}) {
  const handleLogoutClick = () => {
    Alert.alert("Konfirmasi Logout", "Apakah Anda yakin ingin keluar?", [
      { text: "Batal", style: "cancel" },
      { text: "Logout", onPress: () => onLogout?.(), style: "destructive" },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.profileHeaderContainer}>
        <Text style={styles.headerTitle}>Profile Information</Text>
      </View>

      <View style={styles.profileContent}>
        <Image
          source={{ uri: "https://ui-avatars.com/api/?name=Aymar&background=CFE2F3&color=112D4E&rounded=true&bold=true&size=200" }}
          style={styles.profileAvatar}
        />
        
        <Text style={styles.profileName}>Muhammad Aymar Bharkaya</Text>
        <Text style={styles.profileEmail}>18223051@dosen.itb.ac.id</Text>
        <Text style={styles.profileRole}>Dosen</Text>

        <Pressable style={styles.logoutButton} onPress={handleLogoutClick}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </Pressable>
      </View>

      <View style={styles.bottomNav}>
        <Pressable style={styles.navItem} onPress={onNavigateHome}>
          <Ionicons name="home" size={32} color="#FDEFD3" />
        </Pressable>

        <Pressable style={styles.navItem} onPress={onNavigateToClasses}>
          <MaterialCommunityIcons name="clipboard-text-clock-outline" size={32} color="#FDEFD3" />
        </Pressable>

        <Pressable style={styles.navItemActive}>
          <View style={styles.navIconActiveBg}>
            <Ionicons name="person-circle-outline" size={32} color="#FFFFFF" />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

// =======================================================
// KOMPONEN 5: HALAMAN UTAMA DOSEN (HOME CONTENT)
// =======================================================
function HomeScreenDosenContent({ 
  onNavigateToAttendance,
  onNavigateToClasses,
  onNavigateToProfile,
  onNavigateToNotifications,
  todayClasses,
  onOpenDoor
}: { 
  onNavigateToAttendance: () => void;
  onNavigateToClasses: () => void;
  onNavigateToProfile: () => void;
  onNavigateToNotifications: () => void;
  todayClasses: LecturerClassSummary[];
  onOpenDoor: (roomId?: string) => void;
}) {
  const [doorTimeLeft, setDoorTimeLeft] = useState(60);

  useEffect(() => {
    if (doorTimeLeft <= 0) return;
    const intervalId = setInterval(() => {
      setDoorTimeLeft((prevTime) => prevTime - 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [doorTimeLeft]);

  const formatDoorTimer = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const formattedMinutes = minutes.toString().padStart(2, "0");
    const formattedSeconds = seconds.toString().padStart(2, "0");
    return `00:${formattedMinutes}:${formattedSeconds}`;
  };

  const currentClass = todayClasses[0];
  const handleOpenDoor = () => onOpenDoor(currentClass?.room.id);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.userInfo}>
              <Image
                source={{ uri: "https://ui-avatars.com/api/?name=Aymar&background=CFE2F3&color=112D4E&rounded=true&bold=true" }}
                style={styles.avatar}
              />
              <View style={styles.textContainer}>
                <Text style={styles.greeting}>Halo, Aymar</Text>
                <Text style={styles.subGreeting}>Sekolah Teknik Elektro dan Informatika</Text>
              </View>
            </View>
            <Pressable style={styles.bellIcon} onPress={onNavigateToNotifications}>
              <Feather name="bell" size={24} color="#F6E4C8" />
            </Pressable>
          </View>
        </View>

        <View style={styles.todayClassContainer}>
          <Text style={styles.sectionTitle}>Today’s Class</Text>

          <View style={styles.courseInfoContainer}>
            <Text style={styles.courseTitle}>
              {currentClass ? `${currentClass.course.code} ${currentClass.course.name}` : "Tidak ada kelas hari ini"}
            </Text>
            <Text style={styles.courseSubtitle}>
              {currentClass ? `${currentClass.class_code} - ${currentClass.room.code}` : "-"}
            </Text>
          </View>

          <View style={styles.statMainCard}>
            <View style={styles.statHeaderRow}>
              <Text style={styles.statLabelMain}>Total Mahasiswa</Text>
              <Ionicons name="school-outline" size={20} color="#112D4E" />
            </View>
            <Text style={styles.statValueMain}>{currentClass?.enrollments_count ?? 0}</Text>
          </View>

          <View style={styles.statRowContainer}>
            <View style={styles.statHalfCard}>
              <Text style={styles.statLabelHalf}>Total Hadir</Text>
              <Text style={styles.statValueHalf}>{currentClass?.present_count ?? 0}</Text>
            </View>
            <View style={styles.statHalfCard}>
              <Text style={styles.statLabelHalf}>Total Belum Hadir</Text>
              <Text style={styles.statValueHalf}>{currentClass?.absent_count ?? 0}</Text>
            </View>
          </View>

          <Pressable style={styles.pantauButton} onPress={onNavigateToAttendance}>
            <Text style={styles.pantauButtonText}>Pantau Kehadiran</Text>
            <View style={styles.pantauIconCircle}>
              <Feather name="chevron-right" size={20} color="#000" />
            </View>
          </Pressable>
        </View>

        <View style={styles.doorControlContainer}>
          <Text style={styles.doorInstructionText}>
            Gunakan tombol dibawah untuk membuka kunci pintu kelas tanpa melakukan pengenalan wajah. Pintu akan terkunci kembali dalam:
          </Text>
          
          <Text style={styles.doorTimerText}>{formatDoorTimer(doorTimeLeft)}</Text>
          
          <Pressable 
            style={[styles.doorButton, doorTimeLeft > 0 && styles.doorButtonDisabled]}
            disabled={doorTimeLeft > 0} 
            onPress={handleOpenDoor}
          >
            <Text style={styles.doorButtonText}>Buka Pintu</Text>
          </Pressable>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.bottomNav}>
        <Pressable style={styles.navItemActive}>
          <View style={styles.navIconActiveBg}>
            <Ionicons name="home" size={32} color="#FFFFFF" />
          </View>
        </Pressable>
        
        <Pressable style={styles.navItem} onPress={onNavigateToClasses}>
          <MaterialCommunityIcons name="clipboard-text-clock-outline" size={32} color="#FDEFD3" />
        </Pressable>

        <Pressable style={styles.navItem} onPress={onNavigateToProfile}>
          <Ionicons name="person-circle-outline" size={34} color="#FDEFD3" />
        </Pressable>
      </View>
    </View>
  );
}

// =======================================================
// MAIN EXPORT CONTROLLER
// =======================================================
export function HomeScreenDosen({ accessToken, onLogout }: { accessToken: string; onLogout?: () => void }) {
  const [currentScreen, setCurrentScreen] = useState<"home" | "attendance" | "classes" | "history" | "profile" | "notifications">("home");
  const [previousScreen, setPreviousScreen] = useState<"home" | "classes">("home");
  const [todayClasses, setTodayClasses] = useState<LecturerClassSummary[]>([]);
  const [classes, setClasses] = useState<LecturerClassSummary[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [roster, setRoster] = useState<LecturerClassRoster | null>(null);

  useEffect(() => {
    let isMounted = true;
    Promise.all([getLecturerTodayClasses(accessToken), getLecturerClasses(accessToken)])
      .then(([today, managed]) => {
        if (!isMounted) return;
        setTodayClasses(today);
        setClasses(managed);
        setSelectedClassId((current) => current ?? today[0]?.class_id ?? managed[0]?.class_id ?? null);
      })
      .catch((error) => Alert.alert("Data dosen gagal dimuat", error instanceof Error ? error.message : "Gagal memuat data dosen."));

    return () => {
      isMounted = false;
    };
  }, [accessToken]);

  useEffect(() => {
    if (!selectedClassId) return;
    let isMounted = true;
    getLecturerClassRoster(accessToken, selectedClassId)
      .then((nextRoster) => {
        if (isMounted) setRoster(nextRoster);
      })
      .catch((error) => Alert.alert("Roster gagal dimuat", error instanceof Error ? error.message : "Gagal memuat roster."));

    return () => {
      isMounted = false;
    };
  }, [accessToken, selectedClassId]);

  const handleOpenDoor = async (roomId?: string) => {
    if (!roomId) {
      Alert.alert("Override gagal", "Tidak ada ruangan aktif untuk override.");
      return;
    }

    try {
      const response = await sendDoorOverride(accessToken, roomId, "unlock");
      Alert.alert(
        response.status === "sent" ? "Perintah dikirim" : "Override gagal",
        response.iot_gateway?.message ?? "Perintah dikirim ke IoT gateway.",
      );
    } catch (error) {
      Alert.alert("Override gagal", error instanceof Error ? error.message : "Tidak dapat mengirim override.");
    }
  };

  const goToAttendance = () => {
    if (currentScreen !== "attendance") setPreviousScreen(currentScreen as "home" | "classes");
    setCurrentScreen("attendance");
  };

  const goToHistory = () => {
    if (currentScreen !== "history") setPreviousScreen(currentScreen as "home" | "classes");
    setCurrentScreen("history");
  };

  const goToNotifications = () => {
    if (currentScreen !== "notifications") {
      // Simpan posisi halaman asal (bisa dari home atau dari kelas)
      setPreviousScreen(currentScreen as "home" | "classes");
    }
    setCurrentScreen("notifications");
  };

  if (currentScreen === "notifications") {
    return <NotificationScreenDosen onBack={() => setCurrentScreen(previousScreen)} />;
  }

  if (currentScreen === "attendance") {
    return <CourseAttendanceDetailScreen roster={roster} onBack={() => setCurrentScreen(previousScreen)} />;
  }
  
  if (currentScreen === "history") {
    return <AttendanceHistoryDetailScreenDosen onBack={() => setCurrentScreen(previousScreen)} />;
  }

  if (currentScreen === "classes") {
    return (
      <ClassListScreenDosen 
        onNavigateHome={() => setCurrentScreen("home")}
        onNavigateToHistory={goToHistory}
        onNavigateToProfile={() => setCurrentScreen("profile")}
        onNavigateToNotifications={goToNotifications}
        classes={classes}
        onSelectClass={setSelectedClassId}
      />
    );
  }

  if (currentScreen === "profile") {
    return (
      <ProfileScreenDosen
        onNavigateHome={() => setCurrentScreen("home")}
        onNavigateToClasses={() => setCurrentScreen("classes")}
        onLogout={onLogout}
      />
    );
  }

  return (
    <HomeScreenDosenContent 
      onNavigateToAttendance={goToAttendance} 
      onNavigateToClasses={() => setCurrentScreen("classes")} 
      onNavigateToProfile={() => setCurrentScreen("profile")}
      onNavigateToNotifications={goToNotifications}
      todayClasses={todayClasses}
      onOpenDoor={handleOpenDoor}
    />
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" }, 
  scrollContent: { flexGrow: 1 },
  
  header: {
    backgroundColor: "#112D4E", paddingTop: 60, paddingHorizontal: 24, paddingBottom: 20, 
    borderBottomLeftRadius: 36, borderBottomRightRadius: 36,
  },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  userInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  textContainer: { flex: 1, paddingRight: 10 },
  avatar: { width: 60, height: 60, borderRadius: 30, marginRight: 16 },
  greeting: { fontSize: 20, fontWeight: "bold", color: "#F6E4C8", marginBottom: 4 },
  subGreeting: { fontSize: 12, color: "#F6E4C8", opacity: 0.9 },
  bellIcon: { padding: 8 },

  todayClassContainer: {
    backgroundColor: "#CFE2F3", marginHorizontal: 24, borderRadius: 24, padding: 24, marginTop: 20, 
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5,
  },
  sectionTitle: { fontSize: 18, fontWeight: "900", color: "#000", marginBottom: 16 },
  courseInfoContainer: { alignItems: "center", marginBottom: 20 },
  courseTitle: { fontSize: 16, fontWeight: "bold", color: "#112D4E", textAlign: "center" },
  courseSubtitle: { fontSize: 12, color: "#112D4E", textAlign: "center", marginTop: 4 },
  statMainCard: {
    backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, alignItems: "center", marginBottom: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  statHeaderRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  statLabelMain: { fontSize: 14, fontWeight: "bold", color: "#112D4E" },
  statValueMain: { fontSize: 32, fontWeight: "900", color: "#000" },
  statRowContainer: { flexDirection: "row", justifyContent: "space-between", gap: 12, marginBottom: 20 },
  statHalfCard: {
    flex: 1, backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  statLabelHalf: { fontSize: 12, fontWeight: "bold", color: "#112D4E", marginBottom: 8 },
  statValueHalf: { fontSize: 28, fontWeight: "900", color: "#000" },
  pantauButton: {
    backgroundColor: "#112D4E", flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12,
  },
  pantauButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
  pantauIconCircle: { backgroundColor: "#FDEFD3", width: 28, height: 28, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  
  doorControlContainer: {
    backgroundColor: "#FFF9F0", marginHorizontal: 24, borderRadius: 24, padding: 24, marginTop: 24, alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 10,
  },
  doorInstructionText: { fontSize: 12, color: "#112D4E", textAlign: "center", fontWeight: "600", lineHeight: 18, marginBottom: 16 },
  doorTimerText: { fontSize: 32, color: "#E63946", marginBottom: 20, fontWeight: "bold" },
  doorButton: { backgroundColor: "#112D4E", width: "100%", paddingVertical: 16, borderRadius: 12, alignItems: "center" },
  doorButtonDisabled: { backgroundColor: "#94A3B8", opacity: 0.8 },
  doorButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },

  classListContainer: { paddingHorizontal: 24, paddingTop: 30 },
  classItemCard: {
    flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16,
    justifyContent: 'space-between', alignItems: 'center',
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  classItemLeft: { flex: 1, paddingRight: 10 },
  classItemTitle: { fontSize: 15, fontWeight: 'bold', color: '#112D4E', marginBottom: 8 },
  classItemSubtitle: { fontSize: 12, color: '#475569' },
  classItemRight: { alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 },
  classItemBadge: { backgroundColor: '#FDEFD3', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  classItemBadgeText: { fontSize: 13, fontWeight: 'bold', color: '#112D4E' },
  classItemArrow: {
    backgroundColor: '#112D4E', width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 3,
  },

  bottomSpacer: { height: 120 },
  bottomNav: {
    position: "absolute", bottom: 0, left: 0, right: 0, height: 80,
    backgroundColor: "#112D4E", borderTopLeftRadius: 36, borderTopRightRadius: 36,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingBottom: 10,
  },
  navItem: { flex: 1, alignItems: "center", justifyContent: "center" },
  navItemActive: { flex: 1, alignItems: "center", justifyContent: "center", marginTop: -40 },
  navIconActiveBg: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#93C5FD", justifyContent: "center", alignItems: "center" },

  // --- DETAIL GENERAL ---
  detailContainer: { flex: 1, backgroundColor: "#FFFFFF" },
  detailHeader: { flexDirection: "row", alignItems: "center", paddingTop: 60, paddingHorizontal: 24, paddingBottom: 20 },
  backButton: { backgroundColor: "#112D4E", width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginRight: 16 },
  detailTitle: { fontSize: 20, fontWeight: "bold", color: "#000000" },
  detailScroll: { flexGrow: 1 },
  detailCourseInfo: { alignItems: "center", marginTop: 20, marginBottom: 30 },
  detailCourseCode: { fontSize: 18, fontWeight: "bold", color: "#112D4E", marginBottom: 8 },
  detailCourseClass: { fontSize: 14, color: "#112D4E" },
  studentList: { paddingHorizontal: 24 },
  studentRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 18, borderBottomWidth: 1, borderColor: "#E2E8F0",
  },
  studentName: { fontSize: 15, fontWeight: "500", color: "#1E293B", flex: 1, paddingRight: 12 },
  statusPill: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, minWidth: 90,
  },
  statusPillText: { fontSize: 14, fontWeight: "bold", marginRight: 8 },

  // --- RIWAYAT ABSENSI ---
  shieldWrapper: { alignItems: 'center', marginBottom: 20 },
  shieldPlaceholder: { width: 120, height: 120, backgroundColor: "#E0F2FE", borderRadius: 60, justifyContent: "center", alignItems: "center" },
  historySection: { paddingHorizontal: 24, paddingTop: 10 },
  historyHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  historyTitleText: { fontSize: 18, fontWeight: "bold", color: "#000000" },
  monthFilterBtn: { backgroundColor: "#112D4E", flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, gap: 6 },
  monthFilterText: { color: "#FFFFFF", fontSize: 12, fontWeight: "bold" },
  historyItemRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 18, borderBottomWidth: 1, borderColor: "#E2E8F0" },
  historyDateText: { fontSize: 14, color: "#112D4E", fontWeight: "600" },

  // --- NOTIFIKASI STYLES (BARU) ---
  notifListContainer: { paddingHorizontal: 24, paddingTop: 10 },
  notifCard: { flexDirection: "row", backgroundColor: "#FFFFFF", padding: 16, borderRadius: 16, marginBottom: 12, alignItems: "center", borderWidth: 1, borderColor: "#F1F5F9", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  notifIconWrapper: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", marginRight: 16 },
  notifTextWrapper: { flex: 1 },
  notifHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  notifCardTitle: { fontSize: 15, fontWeight: "bold", color: "#112D4E" },
  notifTimeText: { fontSize: 11, color: "#94A3B8" },
  notifDescText: { fontSize: 13, color: "#475569", lineHeight: 18 },

  // --- MODAL ---
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContent: { width: "80%", backgroundColor: "#FFFFFF", borderRadius: 16, padding: 24, alignItems: "center" },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#112D4E", marginBottom: 20 },
  modalOption: { width: "100%", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#F1F5F9", alignItems: "center" },
  modalOptionText: { fontSize: 16, fontWeight: "bold" },

  // --- PROFILE DOSEN ---
  profileHeaderContainer: { paddingTop: 80, alignItems: "center", marginBottom: 40 },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#000000" },
  profileContent: { flex: 1, alignItems: "center", paddingHorizontal: 24 },
  profileAvatar: { width: 140, height: 140, borderRadius: 70, marginBottom: 24 },
  profileName: { fontSize: 20, fontWeight: "bold", color: "#112D4E", marginBottom: 8, textAlign: "center" },
  profileEmail: { fontSize: 14, color: "#475569", marginBottom: 16, textAlign: "center" },
  profileRole: { fontSize: 16, fontWeight: "bold", color: "#112D4E", marginBottom: 40 },
  logoutButton: { backgroundColor: "#112D4E", width: "100%", paddingVertical: 16, borderRadius: 12, alignItems: "center" },
  logoutButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
});
