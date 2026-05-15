import React from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  Pressable,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";

// Data Dummy untuk daftar kelas dan persentase kehadiran
const CLASS_LIST = [
  {
    id: 1,
    code: "II3230",
    name: "Keamanan Informasi",
    lecturer: "Ir. Budi Rahardjo, M.Sc., Ph.D.",
    attendance: "90.76 %",
  },
  {
    id: 2,
    code: "WI2022",
    name: "Manajemen Proyek",
    lecturer: "Dr. Ir. Arry Akhmad Arman, M.T.",
    attendance: "50.81 %",
  },
  {
    id: 3,
    code: "II3240",
    name: "Rekayasa Sistem TI",
    lecturer: "Prof. Dr. Ing. Ir. Suhardi, M.T.",
    attendance: "100 %",
  },
  {
    id: 4,
    code: "IF3211",
    name: "Komputasi Domain Spesifik",
    lecturer: "Muhamad Koyimatu, S.Si., M.Si., M.Sc., Ph.D.",
    attendance: "87.77 %",
  },
  {
    id: 5,
    code: "II3220",
    name: "Tata Kelola TI",
    lecturer: "Prof. Ir. Kridanto Surendro, M.Sc., Ph.D.",
    attendance: "76.34 %",
  },
  {
    id: 6,
    code: "II4012",
    name: "AI for Business",
    lecturer: "Ir. Windy Gambetta, M.B.A.",
    attendance: "100 %",
  },
];

export function ClassListScreen({ onNavigateHome }: { onNavigateHome?: () => void } = {}) {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER SECTION */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.userInfo}>
              <Image
                source={{
                  uri: "https://ui-avatars.com/api/?name=Aliya&background=F44336&color=fff&rounded=true&bold=true",
                }}
                style={styles.avatar}
              />
              <View>
                <Text style={styles.greeting}>Halo, Aliya</Text>
                <Text style={styles.subGreeting}>
                  Sistem dan Teknologi Informasi - 2023
                </Text>
              </View>
            </View>
            <Pressable style={styles.bellIcon}>
              <Feather name="bell" size={24} color="#F6E4C8" />
            </Pressable>
          </View>
        </View>

        {/* CLASS LIST SECTION */}
        <View style={styles.listContainer}>
          {CLASS_LIST.map((item) => (
            <View key={item.id} style={styles.card}>
              {/* Bagian Kiri: Info Kelas */}
              <View style={styles.cardInfo}>
                <Text style={styles.courseTitle}>
                  {item.code} {item.name}
                </Text>
                <Text style={styles.courseLecturer}>{item.lecturer}</Text>
              </View>

              {/* Bagian Kanan: Persentase & Tombol Panah */}
              <View style={styles.cardAction}>
                <View style={styles.attendanceBadge}>
                  <Text style={styles.attendanceText}>{item.attendance}</Text>
                </View>
                <Pressable style={styles.arrowButton}>
                  <Feather name="chevron-right" size={20} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
        
        {/* Spacer untuk Bottom Navigation */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* BOTTOM NAVIGATION */}
      <View style={styles.bottomNav}>
        {/* Ikon Kiri (Home - Inactive) */}
        <Pressable style={styles.navItem} onPress={onNavigateHome}>
          <Ionicons name="home-outline" size={32} color="#FDEFD3" />
        </Pressable>

        {/* Ikon Tengah (Absen/Dokumen - Active) */}
        <Pressable style={styles.navItemActive}>
          <View style={styles.navIconActiveBg}>
            <MaterialCommunityIcons name="text-box-check-outline" size={32} color="#FFFFFF" />
          </View>
        </Pressable>

        {/* Ikon Kanan (Profile - Inactive) */}
        <Pressable style={styles.navItem}>
          <Ionicons name="person-circle-outline" size={34} color="#FDEFD3" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC", // Sedikit abu-abu terang agar kartu putih lebih menonjol
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
    borderWidth: 2,
    borderColor: "#FACC15",
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
    elevation: 2, // Shadow untuk Android
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
    backgroundColor: "#FDEFD3", // Warna krem/kuning muda
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
    height: 120, // Ruang kosong agar item terbawah tidak tertutup navigasi
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
    justifyContent: "space-between", // Gunakan space-between
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  navItem: {
    flex: 1, // Pastikan ini ada agar lebar merata
    alignItems: "center",
    justifyContent: "center",
  },
  navItemActive: {
    flex: 1, // Pastikan ini ada agar lebar merata
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
});