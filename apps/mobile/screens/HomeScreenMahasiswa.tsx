import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  Pressable,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons, Feather } from "@expo/vector-icons";

import { ClassListScreen } from "./ClassesMahasiswa";
import { ProfileScreen } from "./ProfileMahasiswa";
import { NotificationScreen } from "./NotificationScreen"; 
import { getStudentTodaySchedules, type StudentTodaySchedule } from "../api-client";

// --- KOMPONEN HOME SCREEN CONTENT ---
function HomeScreenContent({ 
  userName,
  accessToken,
  onNavigateToClasses, 
  onNavigateToProfile,
  onNavigateToNotifications
}: { 
  userName: string;
  accessToken: string;
  onNavigateToClasses: () => void; 
  onNavigateToProfile: () => void;
  onNavigateToNotifications: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState(3600);
  const [todayCourses, setTodayCourses] = useState<StudentTodaySchedule[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const intervalId = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [timeLeft]);

  useEffect(() => {
    let isMounted = true;
    getStudentTodaySchedules(accessToken)
      .then((items) => {
        if (isMounted) {
          setTodayCourses(items);
          setLoadError(null);
        }
      })
      .catch((error) => {
        if (isMounted) {
          setLoadError(error instanceof Error ? error.message : "Gagal memuat jadwal hari ini.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [accessToken]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedMinutes = minutes.toString().padStart(2, "0");
  const formattedSeconds = seconds.toString().padStart(2, "0");

  const getCurrentDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date().toLocaleDateString("id-ID", options);
  };

  const currentDate = getCurrentDate();
  const activeCourse = todayCourses.find((course) => course.attendance_status === "not_yet") ?? todayCourses[0];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.userInfo}>
              <Image
                source={require('../assets/woman.png')}
                style={styles.avatar}
              />
              <View>
                <Text style={styles.greeting}>Halo, {userName}</Text>
                <Text style={styles.subGreeting}>
                  Sistem dan Teknologi Informasi - 2023
                </Text>
              </View>
            </View>
            <Pressable style={styles.bellIcon} onPress={onNavigateToNotifications}>
              <Feather name="bell" size={24} color="#F6E4C8" />
            </Pressable>
          </View>
        </View>

        <View style={styles.activeCard}>
          <View style={styles.timerBadgeContainer}>
            <View style={styles.timerBox}>
              <Text style={styles.timerNumber}>{formattedMinutes}</Text>
              <Text style={styles.timerLabel}>Menit</Text>
            </View>
            <View style={styles.timerBox}>
              <Text style={styles.timerNumber}>{formattedSeconds}</Text>
              <Text style={styles.timerLabel}>Detik</Text>
            </View>
          </View>

          <View style={styles.activeClassInfo}>
            <Text style={styles.activeCourseTitle}>
              {activeCourse ? `${activeCourse.course.code} ${activeCourse.course.name}` : "Tidak ada jadwal aktif"}
            </Text>
            <Text style={styles.activeCourseLecturer}>
              {activeCourse?.lecturer.full_name ?? "-"}
            </Text>
          </View>

          <View style={styles.punchContainer}>
            <View style={styles.punchCard}>
              <View style={styles.punchHeader}>
                <Text style={styles.punchTitle}>Arrive</Text>
                <Ionicons name="phone-portrait-outline" size={16} color="#112D4E" />
              </View>
              <Text style={styles.punchTime}>-</Text>
              <Text style={styles.punchDate}>{currentDate}</Text>
            </View>

            <View style={styles.punchCard}>
              <View style={styles.punchHeader}>
                <Text style={styles.punchTitle}>Depart</Text>
                <Ionicons name="phone-portrait-outline" size={16} color="#112D4E" />
              </View>
              <Text style={styles.punchTime}>-</Text>
              <Text style={styles.punchDate}>{currentDate}</Text>
            </View>
          </View>
        </View>

        <View style={styles.courseListContainer}>
          <Text style={styles.sectionTitle}>Today's Course</Text>

          {loadError ? <Text style={styles.emptyStateText}>{loadError}</Text> : null}
          {!loadError && todayCourses.length === 0 ? (
            <Text style={styles.emptyStateText}>Tidak ada jadwal hari ini.</Text>
          ) : null}
          {todayCourses.map((course) => {
            const status = getStatusDisplay(course.attendance_status);
            return (
            <View key={course.schedule_id} style={styles.courseListItem}>
              <Text style={styles.courseNameText}>
                <Text style={styles.courseCodeText}>{course.course.code}</Text>{" "}
                {course.course.name}
              </Text>
              <View style={styles.statusBadge}>
                <View
                  style={[styles.statusDot, { backgroundColor: status.color }]}
                />
                <Text style={styles.statusText}>{status.label}</Text>
              </View>
            </View>
          )})}
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
          <Ionicons name="document-text-outline" size={32} color="#FDEFD3" />
        </Pressable>
        <Pressable style={styles.navItem} onPress={onNavigateToProfile}>
          <Ionicons name="person-circle-outline" size={34} color="#FDEFD3" />
        </Pressable>
      </View>
    </View>
  );
}

// --- WRAPPER UNTUK HALAMAN CLASSES ---
function ClassesMahasiswaWrapper({ 
  accessToken,
  onNavigateHome, 
  onNavigateToProfile,
  onNavigateToNotifications 
}: { 
  accessToken: string;
  onNavigateHome: () => void; 
  onNavigateToProfile: () => void;
  onNavigateToNotifications: () => void;
}) {
  return (
    <View style={styles.container}>
      <ClassListScreen 
        accessToken={accessToken}
        onNavigateHome={onNavigateHome} 
        onNavigateToProfile={onNavigateToProfile} 
        onNavigateToNotifications={onNavigateToNotifications} 
      />
    </View>
  );
}

// --- WRAPPER UNTUK HALAMAN PROFILE ---
function ProfileWrapper({ onNavigateHome, onNavigateToClasses, onLogout }: { onNavigateHome: () => void; onNavigateToClasses: () => void; onLogout: () => void }) {
  return (
    <ProfileScreen onNavigateHome={onNavigateHome} onNavigateToClasses={onNavigateToClasses} onLogout={onLogout} />
  );
}

// --- MAIN EXPORT & STATE MANAGER ---
export function HomeScreen({ userName, accessToken, onLogout }: { userName: string; accessToken: string; onLogout: () => void }) {
  const [currentScreen, setCurrentScreen] = useState<"home" | "classes" | "profile" | "notifications">("home");
  
  // State baru untuk menyimpan riwayat halaman sebelum membuka notifikasi
  const [previousScreen, setPreviousScreen] = useState<"home" | "classes" | "profile">("home");

  // Fungsi interseptor navigasi untuk mencatat posisi halaman asal
  const goToNotifications = () => {
    if (currentScreen !== "notifications") {
      setPreviousScreen(currentScreen); // Rekam halaman saat ini (home / classes / profile)
    }
    setCurrentScreen("notifications");
  };

  // Kondisi render halaman Notifikasi
  if (currentScreen === "notifications") {
    // onNavigateBack sekarang akan mengarahkan kembali ke state yang disimpan di previousScreen
    return <NotificationScreen onNavigateBack={() => setCurrentScreen(previousScreen)} />;
  }

  if (currentScreen === "classes") {
    return (
      <ClassesMahasiswaWrapper 
        accessToken={accessToken}
        onNavigateHome={() => setCurrentScreen("home")} 
        onNavigateToProfile={() => setCurrentScreen("profile")}
        onNavigateToNotifications={goToNotifications} // Gunakan fungsi interseptor
      />
    );
  }

  if (currentScreen === "profile") {
    return (
      <ProfileWrapper 
        onNavigateHome={() => setCurrentScreen("home")} 
        onNavigateToClasses={() => setCurrentScreen("classes")}
        onLogout={onLogout}
      />
    );
  }

  return (
    <HomeScreenContent 
      userName={userName}
      accessToken={accessToken}
      onNavigateToClasses={() => setCurrentScreen("classes")} 
      onNavigateToProfile={() => setCurrentScreen("profile")}
      onNavigateToNotifications={goToNotifications} // Gunakan fungsi interseptor
    />
  );
}

function getStatusDisplay(status: StudentTodaySchedule["attendance_status"]) {
  if (status === "attended") {
    return { label: "Attended", color: "#4ADE80" };
  }

  if (status === "absent") {
    return { label: "Absent", color: "#F87171" };
  }

  return { label: "Not yet", color: "#FACC15" };
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  scrollContent: { flexGrow: 1 },
  header: {
    backgroundColor: "#112D4E",
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 30,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  userInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  avatar: { width: 60, height: 60, borderRadius: 30, marginRight: 16, borderColor: "#FACC15" },
  greeting: { fontSize: 20, fontWeight: "bold", color: "#F6E4C8", marginBottom: 4 },
  subGreeting: { fontSize: 12, color: "#F6E4C8", marginRight: 10, opacity: 0.9 },
  bellIcon: { padding: 8 },
  activeCard: {
    backgroundColor: "#DBEAFE",
    marginHorizontal: 24,
    borderRadius: 24,
    padding: 20,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  timerBadgeContainer: { flexDirection: "row", justifyContent: "flex-end", gap: 4, marginBottom: 12 },
  timerBox: { backgroundColor: "#FFFFFF", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignItems: "center", minWidth: 40 },
  timerNumber: { fontSize: 14, fontWeight: "bold", color: "#000" },
  timerLabel: { fontSize: 8, fontWeight: "bold", color: "#000" },
  activeClassInfo: { alignItems: "center", marginBottom: 20 },
  activeCourseTitle: { fontSize: 18, fontWeight: "900", color: "#112D4E", textAlign: "center", marginBottom: 4 },
  activeCourseLecturer: { fontSize: 12, color: "#3B82F6", textAlign: "center" },
  punchContainer: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  punchCard: { flex: 1, backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, alignItems: "center" },
  punchHeader: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, marginBottom: 16 },
  punchTitle: { fontSize: 14, fontWeight: "bold", color: "#112D4E" },
  punchTime: { fontSize: 24, fontWeight: "bold", color: "#000", marginBottom: 16 },
  punchDate: { fontSize: 10, color: "#64748B", textAlign: 'center' },
  courseListContainer: { paddingHorizontal: 24, paddingTop: 30 },
  sectionTitle: { fontSize: 20, fontWeight: "bold", color: "#000", marginBottom: 16 },
  emptyStateText: { color: "#64748B", fontSize: 13, marginBottom: 12 },
  courseListItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#112D4E",
    borderRadius: 30,
    marginBottom: 12,
  },
  courseNameText: { fontSize: 13, color: "#334155", flex: 1, marginRight: 10 },
  courseCodeText: { fontWeight: "bold", color: "#112D4E" },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 6, minWidth: 80 },
  statusDot: { width: 14, height: 14, borderRadius: 7 },
  statusText: { fontSize: 12, fontWeight: "bold", color: "#000" },
  bottomSpacer: { height: 120 },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: "#112D4E",
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  navItem: { flex: 1, alignItems: "center", justifyContent: "center" },
  navItemActive: { flex: 1, alignItems: "center", justifyContent: "center", marginTop: -40 },
  navIconActiveBg: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#93C5FD", justifyContent: "center", alignItems: "center" },
});
