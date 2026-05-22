import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
  TextInput,
  Pressable,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";

import type { ApiUserRole } from "../api-client";

type ProfileScreenProps = {
  userId: string;
  userName: string;
  userRole: ApiUserRole;
  onSaveName: (nextName: string) => Promise<void> | void;
  onLogout: () => void;
  onNavigateHome: () => void;
  onNavigateMiddle: () => void;
  variant: "student" | "lecturer";
};

export function ProfileScreen({
  userId,
  userName,
  userRole,
  onSaveName,
  onLogout,
  onNavigateHome,
  onNavigateMiddle,
  variant,
}: ProfileScreenProps) {
  const [draftName, setDraftName] = useState(userName);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDraftName(userName);
  }, [userName]);

  const roleLabel = useMemo(() => {
    if (userRole === "student") {
      return "Mahasiswa";
    }

    if (userRole === "lecturer") {
      return "Dosen";
    }

    return "Admin";
  }, [userRole]);

  const userSubtitle = userRole === "student"
    ? "Akun Mahasiswa Gatekeeper AI"
    : userRole === "lecturer"
      ? "Akun Dosen Gatekeeper AI"
      : "Akun Admin Gatekeeper AI";

  const saveProfile = async () => {
    const trimmedName = draftName.trim();
    if (!trimmedName) {
      setNotice("Nama tidak boleh kosong.");
      return;
    }

    setNotice(null);
    setIsSaving(true);

    try {
      await onSaveName(trimmedName);
      setDraftName(trimmedName);
      setNotice("Profil berhasil diperbarui.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memperbarui profil.";
      setNotice(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Image
              source={{
                uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=112D4E&color=fff&rounded=true&bold=true`,
              }}
              style={styles.avatar}
            />
            <View>
              <Text style={styles.greeting}>Profil Pengguna</Text>
              <Text style={styles.subGreeting}>{userSubtitle}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Informasi Akun</Text>

          {notice ? <Text style={styles.notice}>{notice}</Text> : null}

          <View style={styles.field}>
            <Text style={styles.label}>Nama</Text>
            <TextInput
              style={styles.input}
              value={draftName}
              onChangeText={setDraftName}
              placeholder="Masukkan nama anda"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Role</Text>
            <View style={styles.readOnlyBox}>
              <Text style={styles.readOnlyValue}>{roleLabel}</Text>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>User ID</Text>
            <View style={styles.readOnlyBox}>
              <Text style={styles.readOnlyValue}>{userId}</Text>
            </View>
          </View>

          <Pressable
            style={[styles.primaryButton, isSaving && styles.primaryButtonDisabled]}
            onPress={() => {
              void saveProfile();
            }}
            disabled={isSaving}
          >
            <Text style={styles.primaryButtonText}>
              {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
            </Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={onLogout}>
            <Text style={styles.secondaryButtonText}>Keluar dari Akun</Text>
          </Pressable>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {variant === "student" ? (
        <View style={styles.studentBottomNav}>
          <Pressable style={styles.studentNavItem} onPress={onNavigateHome}>
            <Ionicons name="home-outline" size={32} color="#FDEFD3" />
          </Pressable>
          <Pressable style={styles.studentNavItem} onPress={onNavigateMiddle}>
            <Ionicons name="document-text-outline" size={32} color="#FDEFD3" />
          </Pressable>
          <Pressable style={styles.studentNavItemActive}>
            <View style={styles.studentNavActiveBubble}>
              <Ionicons name="person-circle" size={34} color="#FFFFFF" />
            </View>
          </Pressable>
        </View>
      ) : (
        <View style={styles.lecturerBottomNav}>
          <Pressable style={styles.lecturerNavItem} onPress={onNavigateHome}>
            <Ionicons name="home-outline" size={28} color="#FDEFD3" />
          </Pressable>
          <Pressable style={styles.lecturerNavItem} onPress={onNavigateMiddle}>
            <Ionicons name="document-text-outline" size={30} color="#FDEFD3" />
          </Pressable>
          <Pressable style={styles.lecturerNavItemActive}>
            <View style={styles.lecturerNavActiveBubble}>
              <Ionicons name="person-circle" size={30} color="#FFFFFF" />
            </View>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
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
    paddingTop: 56,
    paddingHorizontal: 24,
    paddingBottom: 28,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    marginRight: 14,
    borderWidth: 2,
    borderColor: "#FACC15",
  },
  greeting: {
    fontSize: 20,
    fontWeight: "700",
    color: "#F6E4C8",
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 12,
    color: "#DBEAFE",
  },
  card: {
    marginHorizontal: 20,
    marginTop: 22,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#112D4E",
    marginBottom: 12,
  },
  notice: {
    marginBottom: 12,
    color: "#0369A1",
    fontWeight: "600",
    fontSize: 13,
  },
  field: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    color: "#334155",
    fontWeight: "700",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#0F172A",
    backgroundColor: "#FFFFFF",
  },
  readOnlyBox: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  readOnlyValue: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "600",
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: "#112D4E",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  secondaryButton: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    backgroundColor: "#FEF2F2",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#B91C1C",
    fontSize: 14,
    fontWeight: "700",
  },
  bottomSpacer: {
    height: 110,
  },
  studentBottomNav: {
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
  studentNavItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  studentNavItemActive: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -40,
  },
  studentNavActiveBubble: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#93C5FD",
    justifyContent: "center",
    alignItems: "center",
  },
  lecturerBottomNav: {
    backgroundColor: "#112D4E",
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  lecturerNavItem: {
    alignItems: "center",
    justifyContent: "center",
  },
  lecturerNavItemActive: {
    alignItems: "center",
    justifyContent: "center",
  },
  lecturerNavActiveBubble: {
    backgroundColor: "#00A8E8",
    borderRadius: 50,
    padding: 10,
  },
});
