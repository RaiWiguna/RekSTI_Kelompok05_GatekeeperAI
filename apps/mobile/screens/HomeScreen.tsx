import { StatusBar } from "expo-status-bar";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { Info, Session } from "./LoginScreen";

type HomeScreenProps = {
  session: Session;
  onLogout: () => void;
};

export function HomeScreen({ session, onLogout }: HomeScreenProps) {
  const roleEmoji = {
    student: "👨‍🎓",
    lecturer: "👨‍🏫",
    admin: "👨‍💼",
  }[session.user.role];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.welcomeIcon}>{roleEmoji}</Text>
          <Text style={styles.welcomeText}>Selamat datang,</Text>
          <Text style={styles.userName}>{session.user.name}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Informasi Pengguna</Text>
          <Info label="Role" value={session.user.role} />
          <Info label="User ID" value={session.user.id} />
          <Info
            label="Access Token"
            value={session.accessToken.slice(0, 32) + "..."}
          />
        </View>

        <View style={styles.features}>
          <Text style={styles.featuresTitle}>Fitur Utama</Text>
          <FeatureCard icon="📸" title="Pengenalan Wajah" desc="Absensi otomatis" />
          <FeatureCard icon="📅" title="Jadwal Kelas" desc="Kelola jadwal Anda" />
          <FeatureCard icon="📊" title="Analytics" desc="Lihat statistik" />
          <FeatureCard
            icon="⚙️"
            title="Pengaturan"
            desc="Kelola preferensi"
          />
        </View>

        <Pressable style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutButtonText}>Keluar</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

type FeatureCardProps = {
  icon: string;
  title: string;
  desc: string;
};

function FeatureCard({ icon, title, desc }: FeatureCardProps) {
  return (
    <Pressable style={styles.featureCard}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDesc}>{desc}</Text>
      </View>
      <Text style={styles.featureArrow}>→</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  container: {
    flexGrow: 1,
    padding: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
    paddingTop: 20,
  },
  welcomeIcon: {
    fontSize: 60,
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 14,
    color: "#666",
  },
  userName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginTop: 4,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
    color: "#1a1a1a",
  },
  features: {
    marginBottom: 24,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#1a1a1a",
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  featureIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  featureDesc: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  featureArrow: {
    fontSize: 16,
    color: "#999",
  },
  logoutButton: {
    backgroundColor: "#EF4444",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
