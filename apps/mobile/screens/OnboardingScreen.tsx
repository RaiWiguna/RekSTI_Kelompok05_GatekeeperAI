import React from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Pressable,
  Image,
} from "react-native";
import { StatusBar } from "expo-status-bar";

type OnboardingScreenProps = {
  onLogin: () => void; // Mengganti onComplete menjadi onLogin untuk menyesuaikan tombol
};

export function OnboardingScreen({ onLogin }: OnboardingScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      {/* Menggunakan 'dark' agar jam dan baterai di atas terlihat pada background putih */}
      <StatusBar style="dark" />

      <View style={styles.content}>
        {/* 
          Ganti URI ini dengan aset lokalmu nanti.
          Contoh: source={require('./assets/students-illustration.png')} 
        */}
        <Image
          source={require('../assets/students.png')}
          style={styles.image}
        />

        {/* Judul dengan dua warna berbeda */}
        <Text style={styles.title}>
          Sistem Absensi Otomatis{"\n"}
          <Text style={styles.titleHighlight}>Berbasis AI</Text>
        </Text>

        <Text style={styles.description}>
          GATEKEEPER-AI adalah solusi komprehensif yang menjamin pengelolaan kelas yang lebih cerdas, aman, dan disiplin
        </Text>
      </View>

      {/* Tombol di bagian bawah layar */}
      <View style={styles.footer}>
        <Pressable style={styles.button} onPress={onLogin}>
          <Text style={styles.buttonText}>Login with SSO</Text>
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
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  image: {
    width: 250,
    height: 250,
    resizeMode: "contain",
    marginBottom: 48,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#112D4E", // Warna biru gelap (Navy)
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 34,
  },
  titleHighlight: {
    color: "#00A8E8", // Warna biru terang (Cyan)
  },
  description: {
    fontSize: 14,
    color: "#000000",
    textAlign: "center",
    lineHeight: 22,
    fontWeight: "400",
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40, // Memberikan jarak dari bawah layar (indikator home iPhone)
  },
  button: {
    backgroundColor: "#112D4E", // Warna biru gelap sama dengan teks atas
    paddingVertical: 18,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});