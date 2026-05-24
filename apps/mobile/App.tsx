import { registerRootComponent } from 'expo';
import React from 'react';
import { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { OnboardingScreen } from "./screens/OnboardingScreen";
import { LoginScreen, Session } from "./screens/LoginScreen";
import { RegisterScreen } from "./screens/RegisterScreen";
import { HomeScreen as HomeScreenMahasiswa } from "./screens/HomeScreenMahasiswa";
import { HomeScreenDosen } from "./screens/HomeScreenDosen";
import { SplashScreen } from "./screens/SplashScreen";
import {
  hasCompletedOnboarding,
  markOnboardingAsCompleted,
  resetOnboarding,
} from "./utils/onboarding";

type AppState = "loading" | "onboarding" | "register" | "login" | "home";

export default function App() {
  const [appState, setAppState] = useState<AppState>("loading");
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    async function checkOnboardingStatus() {
      try {
        // For development/testing: uncomment line below to reset onboarding
        await resetOnboarding();
        
        const completed = await hasCompletedOnboarding();
        await new Promise<void>(resolve => setTimeout(resolve, 2000));
        setAppState(completed ? "login" : "onboarding");
      } catch (error) {
        console.error("Gagal memuat status onboarding:", error);
        setAppState("onboarding");
      }
    }

    checkOnboardingStatus();
  }, []);

  async function handleOnboardingComplete() {
    await markOnboardingAsCompleted();
    setAppState("register");
  }

  function handleRegisterSuccess(newSession: Session) {
    setSession(newSession);
    setAppState("home");
  }

  function handleNavigateToLogin() {
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

  if (appState === "register") {
    return (
      <RegisterScreen
        onRegister={async (email: string, password: string, name: string) => {
          // Simulate network delay
          await new Promise<void>(resolve => setTimeout(resolve, 500));
          
          // Mock registration - any credentials work for UI testing
          const mockSession: Session = {
            accessToken: "mock_access_token_" + Math.random().toString(36).substr(2, 9),
            refreshToken: "mock_refresh_token_" + Math.random().toString(36).substr(2, 9),
            user: {
              id: "user_" + Math.random().toString(36).substr(2, 9),
              name: name || "User",
              role: "student",
            },
          };
          handleRegisterSuccess(mockSession);
        }}
        onNavigateToLogin={handleNavigateToLogin}
      />
    );
  }

  if (appState === "login") {
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        onNavigateToRegister={() => setAppState("register")}
      />
    );
  }

  if (appState === "home" && session) {
    return session.user.role === "dosen" ? (
      <HomeScreenDosen onLogout={handleLogout} />
    ) : (
      <HomeScreenMahasiswa onLogout={handleLogout} />
    );
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
