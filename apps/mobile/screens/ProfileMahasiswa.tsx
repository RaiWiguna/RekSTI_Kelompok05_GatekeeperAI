import React from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  Pressable,
  SafeAreaView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

interface ProfileScreenProps {
  onNavigateHome: () => void;
  onNavigateToClasses: () => void;
  onLogout: () => void;
}

export function ProfileScreen({
  onNavigateHome,
  onNavigateToClasses,
  onLogout,
}: ProfileScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* HEADER SECTION */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Profile Information</Text>
      </View>

      {/* PROFILE INFO SECTION */}
      <View style={styles.profileContent}>
        <Image
          source={require('../assets/woman.png')}
          style={styles.avatar}
        />
        
        <Text style={styles.nameText}>Aliya Harta Ary Utama</Text>
        <Text style={styles.emailText}>18223081@mahasiswa.itb.ac.id</Text>
        <Text style={styles.roleText}>Mahasiswa</Text>

        {/* LOGOUT BUTTON */}
        <Pressable style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </Pressable>
      </View>

      {/* BOTTOM NAVIGATION */}
      <View style={styles.bottomNav}>
        {/* Ikon Kiri (Home - Inactive) */}
        <Pressable style={styles.navItem} onPress={onNavigateHome}>
          <Ionicons name="home-outline" size={32} color="#FDEFD3" />
        </Pressable>

        {/* Ikon Tengah (Absen/Dokumen - Inactive) */}
        <Pressable style={styles.navItem} onPress={onNavigateToClasses}>
          <MaterialCommunityIcons
            name="text-box-check-outline"
            size={32}
            color="#FDEFD3"
          />
        </Pressable>

        {/* Ikon Kanan (Profile - Active) */}
        <Pressable style={styles.navItemActive}>
          <View style={styles.navIconActiveBg}>
            <Ionicons name="person-circle-outline" size={40} color="#FFFFFF" />
          </View>
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
  headerContainer: {
    paddingTop: 60,
    alignItems: "center",
    marginBottom: 40,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000000",
  },
  profileContent: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginBottom: 24,
  },
  nameText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#112D4E",
    marginBottom: 8,
    textAlign: "center",
  },
  emailText: {
    fontSize: 14,
    color: "#475569",
    marginBottom: 16,
    textAlign: "center",
  },
  roleText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#112D4E",
    marginBottom: 40,
  },
  logoutButton: {
    backgroundColor: "#112D4E",
    width: "100%",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
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
    marginTop: -40, // Mengangkat tombol aktif ke atas
  },
  navIconActiveBg: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#93C5FD", justifyContent: "center", alignItems: "center" },
});