import { registerRootComponent } from "expo";
import React, { useEffect, useState } from "react";
import { OnboardingScreen } from "./screens/OnboardingScreen";
import { LoginScreen, Session } from "./screens/LoginScreen";
import { HomeScreen as HomeScreenMahasiswa } from "./screens/HomeScreenMahasiswa";
import { HomeScreenDosen } from "./screens/HomeScreenDosen";
import { SplashScreen } from "./screens/SplashScreen";
import { ApiRequestError, updateMyAccountName } from "./api-client";
import {
  hasCompletedOnboarding,
  markOnboardingAsCompleted,
} from "./utils/onboarding";

type AppState = "loading" | "onboarding" | "login" | "home";

export default function App() {
  const [appState, setAppState] = useState<AppState>("loading");
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    async function checkOnboardingStatus() {
      try {
        const completed = await hasCompletedOnboarding();
        await new Promise<void>((resolve) => setTimeout(resolve, 1200));
        setAppState(completed ? "login" : "onboarding");
      } catch (error) {
        console.error("Gagal memuat status onboarding:", error);
        setAppState("onboarding");
      }
    }

    void checkOnboardingStatus();
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

  async function handleUpdateProfileName(nextName: string) {
    if (!session) {
      throw new Error("Sesi login tidak ditemukan.");
    }

    try {
      const updatedProfile = await updateMyAccountName(session.accessToken, nextName);
      setSession((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          user: {
            ...current.user,
            account_name: updatedProfile.account_name,
          },
        };
      });
    } catch (error) {
      if (error instanceof ApiRequestError) {
        throw new Error(error.message);
      }

      throw new Error("Gagal memperbarui nama akun. Coba lagi.");
    }
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
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  if (appState === "home" && session) {
    return session.user.role === "lecturer" ? (
      <HomeScreenDosen
        userId={session.user.id}
        userName={session.user.account_name}
        onUpdateName={handleUpdateProfileName}
        onLogout={handleLogout}
      />
    ) : (
      <HomeScreenMahasiswa
        userId={session.user.id}
        userName={session.user.account_name}
        onUpdateName={handleUpdateProfileName}
        onLogout={handleLogout}
      />
    );
  }

  return null;
}

registerRootComponent(App);
