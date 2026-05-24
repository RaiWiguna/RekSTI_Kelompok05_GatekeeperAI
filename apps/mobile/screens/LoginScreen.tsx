import React, { useState } from "react";
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

export type Session = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    role: string;
  };
};

type LoginScreenProps = {
  onLoginSuccess: (session: Session) => void;
  onNavigateToRegister: () => void;
};

export function LoginScreen({
  onLoginSuccess,
  onNavigateToRegister,
}: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<"mahasiswa" | "dosen" | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
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
    
    // Simulate network delay
    await new Promise<void>(resolve => setTimeout(resolve, 500));
    
    // Mock login - any email/password works for UI testing
    const mockSession: Session = {
      accessToken: "mock_access_token_" + Math.random().toString(36).substr(2, 9),
      refreshToken: "mock_refresh_token_" + Math.random().toString(36).substr(2, 9),
      user: {
        id: "user_" + Math.random().toString(36).substr(2, 9),
        name: email.split("@")[0] || "User",
        role: selectedRole,
      },
    };
    
    onLoginSuccess(mockSession);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <Image
            source={require("../assets/students.png")} // Pastikan path benar
            style={styles.logo}
          />
          <Text style={styles.brandText}>
            Gatekeeper<Text style={styles.brandHighlight}>-AI</Text>
          </Text>
        </View>

        <Text style={styles.welcomeText}>Welcome Back</Text>

        {/* Form Section */}
        <View style={styles.form}>
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
            <TextInput
              style={styles.input}
              placeholder="Write here..."
              placeholderTextColor="#A9A9A9"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pilih Role</Text>
            <View style={styles.roleButtonsContainer}>
              <Pressable
                style={[
                  styles.roleButton,
                  selectedRole === "mahasiswa" && styles.roleButtonActive,
                ]}
                onPress={() => setSelectedRole("mahasiswa")}
                disabled={isLoading}
              >
                <Text
                  style={[
                    styles.roleButtonText,
                    selectedRole === "mahasiswa" && styles.roleButtonTextActive,
                  ]}
                >
                  👨‍🎓 Mahasiswa
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.roleButton,
                  selectedRole === "dosen" && styles.roleButtonActive,
                ]}
                onPress={() => setSelectedRole("dosen")}
                disabled={isLoading}
              >
                <Text
                  style={[
                    styles.roleButtonText,
                    selectedRole === "dosen" && styles.roleButtonTextActive,
                  ]}
                >
                  👨‍🏫 Dosen
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
              <Text style={styles.footerText}>Don't have an account? </Text>
              <Pressable onPress={onNavigateToRegister} disabled={isLoading}>
                <Text style={styles.linkText}>Register</Text>
              </Pressable>
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
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  footerText: {
    color: "#A9A9A9",
    fontSize: 14,
  },
  linkText: {
    color: "#112D4E",
    fontSize: 14,
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
});