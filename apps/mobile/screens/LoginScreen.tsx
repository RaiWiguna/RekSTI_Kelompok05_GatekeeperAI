import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { fetchJson, normalizeApiBase } from "../api-client";

type LoginResponse = {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    name: string;
    role: "student" | "admin" | "lecturer";
  };
};

export type Session = {
  accessToken: string;
  refreshToken: string;
  user: LoginResponse["user"];
};

type LoginScreenProps = {
  apiBaseUrl: string;
  onApiBaseUrlChange: (url: string) => void;
  onLoginSuccess: (session: Session) => void;
};

export function LoginScreen({
  apiBaseUrl,
  onApiBaseUrlChange,
  onLoginSuccess,
}: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchJson<LoginResponse>(
        `${normalizeApiBase(apiBaseUrl)}/auth/login`,
        {
          method: "POST",
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      onLoginSuccess({
        accessToken: result.access_token,
        refreshToken: result.refresh_token,
        user: result.user,
      });
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Login failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.icon}>🔐</Text>
          <Text style={styles.title}>Gatekeeper AI</Text>
          <Text style={styles.subtitle}>
            Platform Manajemen Akses Cerdas
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Masuk</Text>

          <Field
            label="API Base URL"
            value={apiBaseUrl}
            onChangeText={onApiBaseUrlChange}
            autoCapitalize="none"
            helper="Android emulator: http://10.0.2.2:3001/v1"
          />
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="email@example.com"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            disabled={loading}
            onPress={() => void handleLogin()}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Masuk</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  secureTextEntry?: boolean;
  helper?: string;
  placeholder?: string;
};

function Field({
  label,
  value,
  onChangeText,
  autoCapitalize = "none",
  keyboardType = "default",
  secureTextEntry = false,
  helper,
  placeholder,
}: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        placeholder={placeholder}
        placeholderTextColor="#999"
        style={styles.input}
      />
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}
    </View>
  );
}

type InfoProps = {
  label: string;
  value: string;
};

export function Info({ label, value }: InfoProps) {
  return (
    <View style={styles.info}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
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
  hero: {
    alignItems: "center",
    marginBottom: 40,
    marginTop: 20,
  },
  icon: {
    fontSize: 60,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 20,
    color: "#1a1a1a",
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1a1a1a",
  },
  helper: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  button: {
    backgroundColor: "#6366F1",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  error: {
    color: "#EF4444",
    fontSize: 14,
    marginBottom: 12,
    backgroundColor: "#FEE2E2",
    padding: 10,
    borderRadius: 6,
  },
  info: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: "#999",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  infoValue: {
    fontSize: 14,
    color: "#1a1a1a",
    marginTop: 4,
    fontWeight: "500",
  },
});
