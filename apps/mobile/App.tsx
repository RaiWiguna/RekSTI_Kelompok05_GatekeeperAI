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
import { fetchJson, normalizeApiBase } from "./api-client";

type LoginResponse = {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    name: string;
    role: "admin" | "lecturer";
  };
};

type Session = {
  accessToken: string;
  refreshToken: string;
  user: LoginResponse["user"];
};

const mobileRuntime = globalThis as typeof globalThis & {
  process?: {
    env?: Record<string, string | undefined>;
  };
};

export default function App() {
  const [apiBaseUrl, setApiBaseUrl] = useState(
    mobileRuntime.process?.env?.EXPO_PUBLIC_API_BASE_URL ?? "http://10.0.2.2:3001/v1",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchJson<LoginResponse>(`${normalizeApiBase(apiBaseUrl)}/auth/login`, {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      setSession({
        accessToken: result.access_token,
        refreshToken: result.refresh_token,
        user: result.user,
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    setSession(null);
    setError(null);
    setPassword("");
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Gatekeeper AI</Text>
          <Text style={styles.title}>Lecturer Mobile</Text>
          <Text style={styles.subtitle}>
            Sprint 1 mobile login tester for lecturer and admin accounts.
          </Text>
        </View>

        {!session ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Sign In</Text>

            <Field
              label="API Base URL"
              value={apiBaseUrl}
              onChangeText={setApiBaseUrl}
              autoCapitalize="none"
              helper="Android emulator usually uses http://10.0.2.2:3001/v1"
            />
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
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
                <Text style={styles.buttonText}>Login</Text>
              )}
            </Pressable>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Session Active</Text>
            <Info label="Name" value={session.user.name} />
            <Info label="Role" value={session.user.role} />
            <Info label="User ID" value={session.user.id} />
            <Info label="Access Token" value={session.accessToken.slice(0, 32) + "..."} />

            <Pressable style={styles.secondaryButton} onPress={handleLogout}>
              <Text style={styles.secondaryButtonText}>Logout</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  helper?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: "default" | "email-address";
};

function Field({
  label,
  value,
  onChangeText,
  helper,
  secureTextEntry,
  autoCapitalize,
  keyboardType,
}: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        style={styles.input}
      />
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}
    </View>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f1e8",
  },
  container: {
    flexGrow: 1,
    padding: 24,
    gap: 20,
  },
  hero: {
    gap: 8,
    paddingTop: 12,
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "#5c6a61",
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#1f2b24",
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#5c6a61",
  },
  card: {
    backgroundColor: "#fbfaf6",
    borderColor: "#d9cfbe",
    borderWidth: 1,
    padding: 20,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2b24",
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    color: "#4e5d54",
  },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: "#d9cfbe",
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    color: "#1f2b24",
  },
  helper: {
    fontSize: 12,
    color: "#6f7d74",
  },
  error: {
    color: "#8d3428",
    backgroundColor: "#f9e4e0",
    borderColor: "#e6b7af",
    borderWidth: 1,
    padding: 10,
  },
  button: {
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1d6b52",
    paddingHorizontal: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  secondaryButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#cdbfa7",
    backgroundColor: "#f0ebdf",
    marginTop: 8,
  },
  secondaryButtonText: {
    color: "#1f2b24",
    fontWeight: "600",
  },
  infoRow: {
    gap: 4,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ece4d5",
  },
  infoLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1.1,
    color: "#6f7d74",
  },
  infoValue: {
    fontSize: 15,
    color: "#1f2b24",
  },
});
