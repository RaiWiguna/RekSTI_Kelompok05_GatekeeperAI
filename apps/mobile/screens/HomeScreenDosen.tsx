import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  SafeAreaView,
  ScrollView,
  Pressable,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons, Feather } from "@expo/vector-icons";

import { ProfileScreen } from "./ProfileScreen";

const MY_CLASSES = [
  {
    id: 1,
    code: "II3220",
    name: "Tata Kelola Teknologi Informasi",
    students: 28,
    time: "08:00 - 09:40",
    room: "B.402",
  },
  {
    id: 2,
    code: "WI2022",
    name: "Manajemen Proyek",
    students: 32,
    time: "10:00 - 11:40",
    room: "B.301",
  },
  {
    id: 3,
    code: "II3230",
    name: "Keamanan Informasi",
    students: 25,
    time: "13:00 - 14:40",
    room: "B.201",
  },
];

type HomeScreenDosenProps = {
  userId: string;
  userName: string;
  onLogout: () => void;
  onUpdateName: (nextName: string) => void;
};

export function HomeScreenDosen({ userId, userName, onLogout, onUpdateName }: HomeScreenDosenProps) {
  const [currentScreen, setCurrentScreen] = useState<"home" | "profile">("home");

  if (currentScreen === "profile") {
    return (
      <ProfileScreen
        variant="lecturer"
        userId={userId}
        userName={userName}
        userRole="lecturer"
        onSaveName={onUpdateName}
        onLogout={onLogout}
        onNavigateHome={() => setCurrentScreen("home")}
        onNavigateMiddle={() => setCurrentScreen("home")}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.userInfo}>
              <Image
                source={{
                  uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=0066CC&color=fff&rounded=true&bold=true`,
                }}
                style={styles.avatar}
              />
              <View>
                <Text style={styles.greeting}>Halo, {userName}</Text>
                <Text style={styles.subGreeting}>
                  Departemen Teknik Informatika
                </Text>
              </View>
            </View>
            <Pressable style={styles.bellIcon}>
              <Feather name="bell" size={24} color="#FFF" />
            </Pressable>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="people" size={28} color="#112D4E" />
            </View>
            <View>
              <Text style={styles.statValue}>85</Text>
              <Text style={styles.statLabel}>Total Mahasiswa</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="book" size={28} color="#112D4E" />
            </View>
            <View>
              <Text style={styles.statValue}>3</Text>
              <Text style={styles.statLabel}>Kelas Mengajar</Text>
            </View>
          </View>
        </View>

        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <Pressable style={styles.actionButton}>
              <Ionicons name="camera" size={28} color="#112D4E" />
              <Text style={styles.actionLabel}>Ambil Absensi</Text>
            </Pressable>
            <Pressable style={styles.actionButton}>
              <Ionicons name="document-text" size={28} color="#112D4E" />
              <Text style={styles.actionLabel}>Input Nilai</Text>
            </Pressable>
            <Pressable style={styles.actionButton}>
              <Ionicons name="stats-chart" size={28} color="#112D4E" />
              <Text style={styles.actionLabel}>Laporan</Text>
            </Pressable>
            <Pressable style={styles.actionButton}>
              <Ionicons name="settings" size={28} color="#112D4E" />
              <Text style={styles.actionLabel}>Pengaturan</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.classListContainer}>
          <Text style={styles.sectionTitle}>Kelas Hari Ini</Text>

          {MY_CLASSES.map((course) => (
            <View key={course.id} style={styles.classCard}>
              <View style={styles.classCardLeft}>
                <View style={styles.classCodeBadge}>
                  <Text style={styles.classCode}>{course.code}</Text>
                </View>
              </View>
              <View style={styles.classCardMiddle}>
                <Text style={styles.className}>{course.name}</Text>
                <Text style={styles.classTime}>
                  <Ionicons name="time" size={12} /> {course.time}
                </Text>
                <Text style={styles.classRoom}>
                  <Ionicons name="location" size={12} /> Ruang {course.room}
                </Text>
              </View>
              <View style={styles.classCardRight}>
                <View style={styles.studentBadge}>
                  <Ionicons name="people" size={14} color="#FFF" />
                  <Text style={styles.studentCount}>{course.students}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.bottomNav}>
        <Pressable style={styles.navItemActive}>
          <View style={styles.navIconActiveBg}>
            <Ionicons name="home" size={28} color="#FFFFFF" />
          </View>
        </Pressable>
        <Pressable style={styles.navItem}>
          <Ionicons name="document-text-outline" size={32} color="#FDEFD3" />
        </Pressable>
        <Pressable style={styles.navItem} onPress={() => setCurrentScreen("profile")}>
          <Ionicons name="person-circle-outline" size={34} color="#FDEFD3" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: "#112D4E",
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    borderWidth: 2,
    borderColor: "#FFF",
  },
  greeting: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
  },
  subGreeting: {
    fontSize: 12,
    color: "#E0E0E0",
    marginTop: 4,
  },
  bellIcon: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },

  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: -20,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statIcon: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: "#E8F0F8",
    justifyContent: "center",
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#112D4E",
  },
  statLabel: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },

  quickActionsContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#112D4E",
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  actionButton: {
    width: "48%",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  actionLabel: {
    fontSize: 12,
    color: "#112D4E",
    fontWeight: "500",
    textAlign: "center",
  },

  classListContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  classCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#112D4E",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  classCardLeft: {
    justifyContent: "center",
  },
  classCodeBadge: {
    backgroundColor: "#112D4E",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  classCode: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  classCardMiddle: {
    flex: 1,
  },
  className: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#112D4E",
    marginBottom: 4,
  },
  classTime: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  classRoom: {
    fontSize: 12,
    color: "#666",
  },
  classCardRight: {
    alignItems: "flex-end",
  },
  studentBadge: {
    backgroundColor: "#4ADE80",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  studentCount: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "bold",
  },

  bottomSpacer: {
    height: 20,
  },
  bottomNav: {
    backgroundColor: "#112D4E",
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
  },
  navItemActive: {
    alignItems: "center",
    justifyContent: "center",
  },
  navIconActiveBg: {
    backgroundColor: "#00A8E8",
    borderRadius: 50,
    padding: 10,
  },
});
