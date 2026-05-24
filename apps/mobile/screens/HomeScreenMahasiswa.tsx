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

// --- DATA MOCKUP ---
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
    status: "Not yet",
    color: "#FACC15",
  },
  {
    id: 4,
    code: "II3240",
    name: "Rekayasa Sistem TI",
    status: "Not yet",
    color: "#FACC15",
  },
];

// --- KOMPONEN HOME SCREEN CONTENT ---
function HomeScreenContent({ 
  onNavigateToClasses, 
  onNavigateToProfile,
  onNavigateToNotifications
}: { 
  onNavigateToClasses: () => void; 
  onNavigateToProfile: () => void;
  onNavigateToNotifications: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState(3600);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const intervalId = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedMinutes = minutes.toString().padStart(2, "0");
  const formattedSeconds = seconds.toString().padStart(2, "0");

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
                <Text style={styles.greeting}>Halo, Aliya</Text>
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
              II3230 Keamanan Informasi
            </Text>
            <Text style={styles.activeCourseLecturer}>
              Ir. Budi Rahardjo, M.Sc., Ph.D.
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
          <Text style={styles.sectionTitle}>Today’s Course</Text>

          {TODAY_COURSES.map((course) => (
            <View key={course.id} style={styles.courseListItem}>
              <Text style={styles.courseNameText}>
                <Text style={styles.courseCodeText}>{course.code}</Text>{" "}
                {course.name}
              </Text>
              <View style={styles.statusBadge}>
                <View
                  style={[styles.statusDot, { backgroundColor: course.color }]}
                />
                <Text style={styles.statusText}>{course.status}</Text>
              </View>
            </View>
          ))}
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
  onNavigateHome, 
  onNavigateToProfile,
  onNavigateToNotifications 
}: { 
  onNavigateHome: () => void; 
  onNavigateToProfile: () => void;
  onNavigateToNotifications: () => void;
}) {
  return (
    <View style={styles.container}>
      <ClassListScreen 
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
export function HomeScreen({ onLogout }: { onLogout: () => void }) {
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
      onNavigateToClasses={() => setCurrentScreen("classes")} 
      onNavigateToProfile={() => setCurrentScreen("profile")}
      onNavigateToNotifications={goToNotifications} // Gunakan fungsi interseptor
    />
  );
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