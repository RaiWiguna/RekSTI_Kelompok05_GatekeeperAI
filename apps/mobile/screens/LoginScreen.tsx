import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  Image,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import {
  ApiRequestError,
  ApiUserRole,
  ConnectivityDiagnostics,
  diagnoseApiConnectivity,
  loginWithPassword,
} from "../api-client";

export type Session = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    account_name: string;
    role: ApiUserRole;
  };
};

type LoginScreenProps = {
  onLoginSuccess: (session: Session) => void;
};

type LoginNotice = {
  title: string;
  message: string;
};

const PASSWORD_REVEAL_DURATION_MS = 3_000;

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<"student" | "lecturer" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState<LoginNotice | null>(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const passwordTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (passwordTimerRef.current) {
        clearTimeout(passwordTimerRef.current);
      }
    };
  }, []);

  const togglePasswordVisibility = () => {
    if (passwordTimerRef.current) {
      clearTimeout(passwordTimerRef.current);
      passwordTimerRef.current = null;
    }

    if (isPasswordVisible) {
      setIsPasswordVisible(false);
      return;
    }

    setIsPasswordVisible(true);
    passwordTimerRef.current = setTimeout(() => {
      setIsPasswordVisible(false);
      passwordTimerRef.current = null;
    }, PASSWORD_REVEAL_DURATION_MS);
  };

  const handleLogin = async () => {
    setNotice(null);

    if (!email || !password) {
      Alert.alert("Please fill in all fields");
      return;
    }

    if (!selectedRole) {
      Alert.alert("Please select your role");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      const data = await loginWithPassword(email, password);

      if (data.user.role !== selectedRole) {
        const diagnostics = await diagnoseApiConnectivity();
        setNotice({
          title: "Role tidak sesuai",
          message: `Akun ini terdaftar sebagai ${toRoleLabel(data.user.role)}, bukan ${toRoleLabel(selectedRole)}.`,
        });
        console.warn(buildLoginErrorMessage(new ApiRequestError({
          code: "auth_role_mismatch",
          message: "Selected role does not match authenticated account role.",
          url: diagnostics.loginUrl,
        }), diagnostics));
        return;
      }

      onLoginSuccess({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        user: data.user,
      });
    } catch (error) {
      const diagnostics = await diagnoseApiConnectivity();
      console.warn(buildLoginErrorMessage(error, diagnostics));
      setNotice(mapLoginNotice(error, diagnostics));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.logoContainer}>
            <Image
              source={require("../assets/students.png")}
              style={styles.logo}
            />
            <Text style={styles.brandText}>
              Gatekeeper<Text style={styles.brandHighlight}>-AI</Text>
            </Text>
          </View>

          <Text style={styles.welcomeText}>Welcome Back</Text>

          <View style={styles.form}>
            {notice ? (
              <View style={styles.noticeBox}>
                <Text style={styles.noticeTitle}>{notice.title}</Text>
                <Text style={styles.noticeText}>{notice.message}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Write here..."
                placeholderTextColor="#A9A9A9"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Write here..."
                  placeholderTextColor="#A9A9A9"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!isPasswordVisible}
                  editable={!isLoading}
                />
                <Pressable
                  style={styles.passwordToggle}
                  onPress={togglePasswordVisibility}
                  disabled={isLoading}
                >
                  <Ionicons
                    name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
                    size={22}
                    color="#475569"
                  />
                </Pressable>
              </View>
              {isPasswordVisible ? (
                <Text style={styles.passwordHint}>Password terlihat selama 3 detik.</Text>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Pilih Role</Text>
              <View style={styles.roleButtonsContainer}>
                <Pressable
                  style={[
                    styles.roleButton,
                    selectedRole === "student" && styles.roleButtonActive,
                  ]}
                  onPress={() => setSelectedRole("student")}
                  disabled={isLoading}
                >
                  <Text
                    style={[
                      styles.roleButtonText,
                      selectedRole === "student" && styles.roleButtonTextActive,
                    ]}
                  >
                    Mahasiswa
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.roleButton,
                    selectedRole === "lecturer" && styles.roleButtonActive,
                  ]}
                  onPress={() => setSelectedRole("lecturer")}
                  disabled={isLoading}
                >
                  <Text
                    style={[
                      styles.roleButtonText,
                      selectedRole === "lecturer" && styles.roleButtonTextActive,
                    ]}
                  >
                    Dosen
                  </Text>
                </Pressable>
              </View>
            </View>

            <Pressable
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>Log In</Text>
              )}
            </Pressable>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Akun dibuat oleh admin. Hubungi admin kampus jika belum punya akun.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 30,
    justifyContent: "center",
    paddingVertical: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: "contain",
  },
  brandText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#112D4E",
    marginTop: 10,
  },
  brandHighlight: {
    color: "#00A8E8",
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000",
    textAlign: "center",
    marginBottom: 30,
  },
  form: {
    width: "100%",
  },
  noticeBox: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    backgroundColor: "#FEF2F2",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  noticeTitle: {
    color: "#991B1B",
    fontWeight: "700",
    fontSize: 13,
    marginBottom: 4,
  },
  noticeText: {
    color: "#7F1D1D",
    fontSize: 13,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#112D4E",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#D9D9D9",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
    color: "#333",
  },
  passwordInputContainer: {
    backgroundColor: "#D9D9D9",
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: "#333",
  },
  passwordToggle: {
    paddingLeft: 10,
    paddingVertical: 6,
  },
  passwordHint: {
    marginTop: 6,
    fontSize: 12,
    color: "#64748B",
  },
  roleButtonsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  roleButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: "#D9D9D9",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#F9F9F9",
  },
  roleButtonActive: {
    borderColor: "#112D4E",
    backgroundColor: "#E8F0F8",
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  roleButtonTextActive: {
    color: "#112D4E",
  },
  button: {
    backgroundColor: "#112D4E",
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  footer: {
    justifyContent: "center",
    marginTop: 20,
  },
  footerText: {
    color: "#6B7280",
    fontSize: 13,
    fontWeight: "bold",
    textAlign: "center",
  },
});

function toRoleLabel(role: ApiUserRole | "student" | "lecturer") {
  if (role === "student") {
    return "Mahasiswa";
  }

  if (role === "lecturer") {
    return "Dosen";
  }

  return "Admin";
}

function buildLoginErrorMessage(error: unknown, diagnostics: ConnectivityDiagnostics) {
  const rawError = error instanceof Error ? error.message : "Unknown error while calling login API.";
  const lines = [
    "[Gatekeeper Mobile] Login diagnostics",
    `Time: ${new Date().toISOString()}`,
    `Error: ${rawError}`,
    `API Base URL: ${diagnostics.apiBaseUrl}`,
    `Login endpoint: ${diagnostics.loginUrl}`,
    `Health endpoint: ${diagnostics.healthUrl}`,
    `Health check: ${diagnostics.healthStatus} - ${diagnostics.healthMessage}`,
  ];

  for (const hint of buildConnectionHints(diagnostics)) {
    lines.push(`- ${hint}`);
  }

  return lines.join("\n");
}

function buildConnectionHints(diagnostics: ConnectivityDiagnostics) {
  const hints: string[] = [];

  if (diagnostics.healthStatus === "ok") {
    hints.push("Backend reachable. Check email/password or selected role mismatch.");
    return hints;
  }

  hints.push("Pastikan API sudah berjalan (`pnpm dev:mobile:stack` atau `pnpm --filter @gatekeeper/api dev`).");

  if (diagnostics.apiBaseUrl.includes("10.0.2.2")) {
    hints.push("`10.0.2.2` hanya untuk Android emulator. Jika pakai device fisik, pakai mode `dev:mobile:stack:device`.");
  }

  if (diagnostics.apiBaseUrl.includes("localhost") || diagnostics.apiBaseUrl.includes("127.0.0.1")) {
    hints.push("`localhost` hanya valid dari device yang sama dengan API server.");
  }

  hints.push("Jika pakai device fisik, set `EXPO_PUBLIC_API_BASE_URL=http://<LAN_IP_PC>:3001/v1`.");
  hints.push("Periksa firewall Windows agar port 3001 bisa diakses dari emulator/device.");

  return hints;
}

function mapLoginNotice(error: unknown, diagnostics: ConnectivityDiagnostics): LoginNotice {
  if (error instanceof ApiRequestError) {
    switch (error.code) {
      case "auth_user_not_found":
        return {
          title: "Akun belum terdaftar",
          message: "Email anda belum terdaftar di sistem. Hubungi admin untuk pembuatan akun.",
        };
      case "auth_invalid_password":
        return {
          title: "Password salah",
          message: "Password yang anda masukkan tidak sesuai. Silakan periksa kembali.",
        };
      case "auth_user_inactive":
        return {
          title: "Akun belum aktif",
          message: "Akun anda sudah ada tetapi belum aktif. Silakan hubungi admin.",
        };
      case "auth_role_not_allowed":
        return {
          title: "Role tidak diizinkan",
          message: "Role akun anda tidak memiliki akses ke aplikasi mobile ini.",
        };
      case "network_timeout":
        return {
          title: "Koneksi timeout",
          message: "Server terlalu lama merespons. Pastikan API berjalan dan koneksi stabil.",
        };
      case "network_unreachable":
        return {
          title: "Server tidak terjangkau",
          message: "Aplikasi tidak dapat terhubung ke server API. Periksa URL API dan jaringan.",
        };
      default:
        return {
          title: "Login gagal",
          message: `Terjadi kesalahan (${error.code}). Silakan coba lagi atau hubungi admin.`,
        };
    }
  }

  if (diagnostics.healthStatus === "ok") {
    return {
      title: "Login gagal",
      message: "Permintaan sudah sampai ke server, tetapi kredensial anda tidak dapat diproses.",
    };
  }

  return {
    title: "Koneksi ke server bermasalah",
    message: "Server API belum siap atau tidak dapat dijangkau. Cek log CLI untuk detail.",
  };
}
