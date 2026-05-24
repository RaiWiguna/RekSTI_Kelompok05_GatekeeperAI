import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  Modal,
  Pressable,
  TouchableOpacity,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";

const CLASS_LIST = [
  { id: 1, code: "II3230", name: "Keamanan Informasi", lecturer: "Ir. Budi Rahardjo, M.Sc., Ph.D.", attendance: "90.76 %" },
  { id: 2, code: "WI2022", name: "Manajemen Proyek", lecturer: "Dr. Ir. Arry Akhmad Arman, M.T.", attendance: "50.81 %" },
  { id: 3, code: "II3240", name: "Rekayasa Sistem TI", lecturer: "Prof. Dr. Ing. Ir. Suhardi, M.T.", attendance: "100 %" },
  { id: 4, code: "IF3211", name: "Komputasi Domain Spesifik", lecturer: "Muhamad Koyimatu, S.Si., M.Si., M.Sc., Ph.D.", attendance: "87.77 %" },
  { id: 5, code: "II3220", name: "Tata Kelola TI", lecturer: "Prof. Ir. Kridanto Surendro, M.Sc., Ph.D.", attendance: "76.34 %" },
  { id: 6, code: "II4012", name: "AI for Business", lecturer: "Ir. Windy Gambetta, M.B.A.", attendance: "100 %" }
];

const ATTENDANCE_HISTORY = [
  { id: 1, date: "Senin, 9 Februari 2026", status: "Attended", color: "#4ADE80" },
  { id: 2, date: "Rabu, 11 Februari 2026", status: "Absent", color: "#F87171" },
  { id: 3, date: "Senin, 16 Februari 2026", status: "Attended", color: "#4ADE80" },
  { id: 4, date: "Rabu, 18 Februari 2026", status: "Attended", color: "#4ADE80" },
  { id: 5, date: "Senin, 23 Februari 2026", status: "Absent", color: "#F87171" },
  { id: 6, date: "Rabu, 25 Februari 2026", status: "Attended", color: "#4ADE80" },
  // Tambahan dummy untuk simulasi beda bulan
  { id: 7, date: "Senin, 2 Maret 2026", status: "Attended", color: "#4ADE80" } 
];

const getMonthFromDateStr = (dateStr: string) => {
  const parts = dateStr.split(" ");
  if (parts.length >= 3) return parts[2];
  return "";
};

function CourseDetailScreen({ course, onBack }: { course: any, onBack: () => void }) {
  // --- STATE UNTUK FILTER BULAN ---
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  // Dapatkan daftar bulan yang unik dari data history
  const availableMonths = Array.from(new Set(ATTENDANCE_HISTORY.map(item => getMonthFromDateStr(item.date))));

  // Filter data history berdasarkan bulan yang dipilih
  const filteredHistory = selectedMonth
    ? ATTENDANCE_HISTORY.filter(item => getMonthFromDateStr(item.date) === selectedMonth)
    : ATTENDANCE_HISTORY;

  return (
    <View style={styles.detailContainer}>
      <StatusBar style="dark" />
      
      <ScrollView contentContainerStyle={styles.detailScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.detailTopBar}>
          <Pressable style={styles.backButton} onPress={onBack}>
            <Feather name="chevron-left" size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.detailTitle}>Course Attendance Detail</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.courseHeader}>
          <View style={styles.shieldPlaceholder}>
            <MaterialCommunityIcons name="shield-lock" size={80} color="#4ADE80" />
          </View>
          <Text style={styles.detailCourseTitle}>{course.code} {course.name}</Text>
          <Text style={styles.detailLecturer}>{course.lecturer}</Text>
        </View>

        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Attendance History</Text>
            
            {/* Tombol pemicu Modal Filter */}
            <Pressable style={styles.monthFilterBtn} onPress={() => setIsFilterVisible(true)}>
              <Text style={styles.monthFilterText}>{selectedMonth || "Choose Month"}</Text>
              <Ionicons name="filter" size={14} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* Render daftar histori yang sudah terfilter */}
          {filteredHistory.map((record) => (
            <View key={record.id} style={styles.historyRow}>
              <Text style={styles.historyDate}>{record.date}</Text>
              <View style={styles.historyStatus}>
                <View style={[styles.statusDot, { backgroundColor: record.color }]} />
                <Text style={styles.historyStatusText}>{record.status}</Text>
              </View>
            </View>
          ))}
          
          {/* Teks kosong jika filter tidak menghasilkan apa-apa */}
          {filteredHistory.length === 0 && (
             <Text style={styles.emptyStateText}>Tidak ada data kehadiran untuk bulan ini.</Text>
          )}
        </View>
      </ScrollView>

      {/* MODAL FILTER BULAN */}
      <Modal visible={isFilterVisible} transparent={true} animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setIsFilterVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Pilih Bulan</Text>
            
            <TouchableOpacity 
              style={[styles.modalOption, selectedMonth === null && styles.modalOptionSelected]} 
              onPress={() => { setSelectedMonth(null); setIsFilterVisible(false); }}
            >
              <Text style={[styles.modalOptionText, selectedMonth === null && styles.modalOptionTextSelected]}>
                Semua Bulan
              </Text>
            </TouchableOpacity>

            {availableMonths.map((month, index) => (
              <TouchableOpacity 
                key={index} 
                style={[styles.modalOption, selectedMonth === month && styles.modalOptionSelected]} 
                onPress={() => { setSelectedMonth(month); setIsFilterVisible(false); }}
              >
                <Text style={[styles.modalOptionText, selectedMonth === month && styles.modalOptionTextSelected]}>
                  {month}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

    </View>
  );
}

export function ClassListScreen({ 
  onNavigateHome, 
  onNavigateToProfile,
  onNavigateToNotifications // Fungsi navigasi notifikasi diterima di sini
}: { 
  onNavigateHome?: () => void; 
  onNavigateToProfile?: () => void; 
  onNavigateToNotifications?: () => void; // Tipe data didaftarkan agar TypeScript tidak error
}){
  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  if (selectedCourse) {
    return <CourseDetailScreen course={selectedCourse} onBack={() => setSelectedCourse(null)} />;
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.userInfo}>
              <Image
                source={require('../assets/woman.png')}
                style={styles.avatar}
              />
              <View>
                <Text style={styles.greeting}>Halo, Aliya</Text>
                <Text style={styles.subGreeting}>Sistem dan Teknologi Informasi - 2023</Text>
              </View>
            </View>
            <Pressable style={styles.bellIcon} onPress={onNavigateToNotifications}>
              <Feather name="bell" size={24} color="#F6E4C8" />
            </Pressable>
          </View>
        </View>

        <View style={styles.listContainer}>
          {CLASS_LIST.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardInfo}>
                <Text style={styles.courseTitle}>{item.code} {item.name}</Text>
                <Text style={styles.courseLecturer}>{item.lecturer}</Text>
              </View>

              <View style={styles.cardAction}>
                <View style={styles.attendanceBadge}>
                  <Text style={styles.attendanceText}>{item.attendance}</Text>
                </View>
                <Pressable style={styles.arrowButton} onPress={() => setSelectedCourse(item)}>
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
          <Ionicons name="home-outline" size={32} color="#FDEFD3" />
        </Pressable>
        <Pressable style={styles.navItemActive}>
          <View style={styles.navIconActiveBg}>
            <MaterialCommunityIcons name="text-box-check-outline" size={32} color="#FFFFFF" />
          </View>
        </Pressable>
        <Pressable style={styles.navItem} onPress={onNavigateToProfile}>
          <Ionicons name="person-circle-outline" size={34} color="#FDEFD3" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: "#112D4E",
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 30, 
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
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
  },
  greeting: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#F6E4C8",
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 12,
    color: "#F6E4C8",
    marginRight: 10,
    opacity: 0.9,
  },
  bellIcon: {
    padding: 8,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardInfo: {
    flex: 1,
    paddingRight: 16,
    justifyContent: "space-between",
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#112D4E",
    marginBottom: 12,
  },
  courseLecturer: {
    fontSize: 11,
    color: "#475569",
  },
  cardAction: {
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 12,
  },
  attendanceBadge: {
    backgroundColor: "#FDEFD3",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  attendanceText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#112D4E",
  },
  arrowButton: {
    backgroundColor: "#112D4E",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  bottomSpacer: {
    height: 120,
  },
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
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  navItemActive: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -40, 
  },
  navIconActiveBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#93C5FD", 
    justifyContent: "center",
    alignItems: "center",
  },
  detailContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  detailScroll: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  detailTopBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 40,
  },
  backButton: {
    backgroundColor: "#112D4E",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
  },
  courseHeader: {
    alignItems: "center",
    marginBottom: 40,
  },
  shieldPlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: "#E2E8F0",
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  detailCourseTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#112D4E",
    textAlign: "center",
    marginBottom: 8,
  },
  detailLecturer: {
    fontSize: 12,
    color: "#475569",
    textAlign: "center",
  },
  historySection: {
    flex: 1,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
  },
  monthFilterBtn: {
    backgroundColor: "#112D4E",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  monthFilterText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  historyDate: {
    fontSize: 14,
    color: "#112D4E",
    fontWeight: "500",
  },
  historyStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 80,
  },
  statusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  historyStatusText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#000000",
  },
  emptyStateText: {
    textAlign: 'center',
    color: '#64748B',
    marginTop: 20,
    fontStyle: 'italic',
  },
  
  // --- STYLES UNTUK MODAL ---
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#112D4E",
    marginBottom: 20,
  },
  modalOption: {
    width: "100%",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    alignItems: "center",
  },
  modalOptionSelected: {
    backgroundColor: "#FDEFD3",
    borderRadius: 10,
    borderBottomWidth: 0,
  },
  modalOptionText: {
    fontSize: 16,
    color: "#475569",
  },
  modalOptionTextSelected: {
    fontWeight: "bold",
    color: "#112D4E",
  },
});