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
import { Ionicons } from "@expo/vector-icons";

const NOTIFICATION_DATA = [
  {
    id: 1,
    code: "II3230",
    name: "Keamanan Informasi",
    status: "Kehadiran terkonfirmasi",
    statusColor: "#059669",
    desc: "Anda tercatat telah mengikuti seluruh rangkaian sesi kelas ini sesuai dengan ketentuan perkuliahan yang berlaku.",
    iconSource: require('../assets/cyber-security.png'),
  },
  {
    id: 2,
    code: "II3240",
    name: "Rekayasa Sistem TI",
    status: "Status kehadiran: Tidak Hadir",
    statusColor: "#DC2626",
    desc: "Sistem tidak mendeteksi presensi Anda pada jadwal perkuliahan ini sejak kelas dimulai.",
    iconSource: require('../assets/engineering.png'),
  },
  {
    id: 3,
    code: "II3220",
    name: "Tata Kelola Teknologi Informasi",
    status: "Kehadiran terkonfirmasi",
    statusColor: "#059669",
    desc: "Anda tercatat telah mengikuti seluruh rangkaian sesi kelas ini sesuai dengan ketentuan perkuliahan yang berlaku.",
    iconSource: require('../assets/management.png'),
  },
  {
    id: 4,
    code: "II3230",
    name: "Keamanan Informasi",
    status: "Status kehadiran: Tidak Hadir",
    statusColor: "#DC2626",
    desc: "Anda meninggalkan kelas lebih dari batas waktu 30 menit",
    iconSource: require('../assets/cyber-security.png'),
  },
];

export function NotificationScreen({ onNavigateBack }: { onNavigateBack: () => void }) {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.notifHeader}>
        <Pressable style={styles.backButton} onPress={onNavigateBack}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.notifTitle}>Notifications</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.notifListContainer}
        showsVerticalScrollIndicator={false}
      >
        {NOTIFICATION_DATA.map((item) => (
          <View key={item.id} style={styles.notifCard}>
            <Image source={item.iconSource} style={styles.notifIcon} />
            <View style={styles.notifTextContainer}>
              <Text style={styles.notifCourseTitle}>
                <Text style={styles.notifCourseCode}>{item.code}</Text> {item.name}
              </Text>
              <Text style={[styles.notifStatus, { color: item.statusColor }]}>
                {item.status}
              </Text>
              <Text style={styles.notifDesc}>{item.desc}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  notifHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  backButton: {
    backgroundColor: "#112D4E",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  notifTitle: { fontSize: 24, fontWeight: "bold", color: "#000000" },
  notifListContainer: { paddingHorizontal: 24, paddingBottom: 40 },
  notifCard: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: "flex-start",
  },
  notifIcon: { width: 52, height: 52, marginRight: 16, resizeMode: "contain" },
  notifTextContainer: { flex: 1 },
  notifCourseTitle: { fontSize: 16, color: "#334155", marginBottom: 6 },
  notifCourseCode: { fontWeight: "bold", color: "#112D4E" },
  notifStatus: { fontSize: 14, fontWeight: "bold", marginBottom: 6 },
  notifDesc: { fontSize: 13, color: "#4B5563", lineHeight: 18 },
});