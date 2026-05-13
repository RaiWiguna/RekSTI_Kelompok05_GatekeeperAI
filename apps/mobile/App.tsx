import { registerRootComponent } from 'expo';
import React from 'react';
import { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { OnboardingScreen } from "./screens/OnboardingScreen";
import { LoginScreen, Session } from "./screens/LoginScreen";
import { HomeScreen } from "./screens/HomeScreen";
import {
  hasCompletedOnboarding,
  markOnboardingAsCompleted,
} from "./utils/onboarding";
import { SplashScreen } from "./screens/SplashScreen";

const mobileRuntime = globalThis as typeof globalThis & {
  process?: {
    env?: Record<string, string | undefined>;
  };
};

type AppState = "loading" | "onboarding" | "login" | "home";

export default function App() {
  const [appState, setAppState] = useState<AppState>("loading");
  const [apiBaseUrl, setApiBaseUrl] = useState(
    mobileRuntime.process?.env?.EXPO_PUBLIC_API_BASE_URL ??
      "http://10.0.2.2:3001/v1"
  );
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    async function checkOnboardingStatus() {
      try {
        const completed = await hasCompletedOnboarding();
        await new Promise<void>(resolve => setTimeout(resolve, 2000));
        
        // HAPUS ATAU COMMENT BARIS INI:
        // setAppState(completed ? "login" : "onboarding");
        
        setAppState("onboarding"); 

      } catch (error) {
        console.error("Gagal memuat status onboarding:", error);
        setAppState("onboarding"); 
      }
    }

    checkOnboardingStatus();
  }, []);

  async function handleOnboardingComplete() {
    await markOnboardingAsCompleted();
    setAppState("login");
  }

  function handleLoginSuccess(newSession: Session) {
    setSession(newSession);
    setAppState("home");
  }

  function handleLogout() {
    setSession(null);
    setAppState("login");
  }

  if (appState === "loading") {
    return <SplashScreen />;
  }

  if (appState === "onboarding") {
    return <OnboardingScreen onLogin={handleOnboardingComplete} />;
  }

  if (appState === "login") {
    return (
      <LoginScreen
        apiBaseUrl={apiBaseUrl}
        onApiBaseUrlChange={setApiBaseUrl}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  if (appState === "home" && session) {
    return <HomeScreen session={session} onLogout={handleLogout} />;
  }

  return null;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
});
registerRootComponent(App);
