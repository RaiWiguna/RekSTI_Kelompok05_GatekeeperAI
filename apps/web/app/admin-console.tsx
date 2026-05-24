"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";

import { AdminDashboard } from "./features/console/components/admin-dashboard";
import { ConsoleSidebar } from "./features/console/components/console-sidebar";
import { HomeScreenDosen } from "./features/console/components/HomeScreenDosen";
import { LoginScreen, Session } from "./features/console/components/LoginScreen";
import { HomeScreenMahasiswa } from "./features/console/components/HomeScreenMahasiswa";
import { ClassesMahasiswa } from "./features/console/components/ClassesMahasiswa";
import { ClassesDosen } from "./features/console/components/ClassesDosen";
import { ProfileMahasiswa } from "./features/console/components/ProfileMahasiswa";
import { ProfileDosen } from "./features/console/components/ProfileDosen";
import { RincianMahasiswa } from "./features/console/components/RincianMahasiswa";
import { RincianKelasMahasiswa } from "./features/console/components/RincianKelasMahasiswa";
import { RincianKelasDosen } from "./features/console/components/RincianKelasDosen";
import { NotificationPage } from "./features/console/components/NotificationPage";
import { buildInitialForms, initialStore, resourceConfigs, resourceOrder } from "./features/console/config/resources";
import type {
  LecturerClassRoster,
  LecturerManagedClass,
  LecturerTodayClass,
  ResourceForms,
  ResourceKey,
  ResourceStore,
} from "./features/console/types";
import { filterResourceItems, getErrorMessage } from "./features/console/utils/display";
import {
  apiRequest,
  clearStoredAuthTokens,
  getStoredAuthTokens,
  storeAuthTokens,
  type SessionUser,
} from "./lib/api-client";

export default function AdminConsole() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [activeResource, setActiveResource] = useState<ResourceKey>("students");
  const [records, setRecords] = useState<ResourceStore>(initialStore);
  const [lecturerManagedClasses, setLecturerManagedClasses] = useState<LecturerManagedClass[]>([]);
  const [lecturerTodayClasses, setLecturerTodayClasses] = useState<LecturerTodayClass[]>([]);
  const [selectedLecturerClassId, setSelectedLecturerClassId] = useState<string | null>(null);
  const [lecturerRoster, setLecturerRoster] = useState<LecturerClassRoster | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [forms, setForms] = useState<ResourceForms>(() => buildInitialForms());
  
  // State navigasi untuk Mahasiswa & Dosen
  const [activeTab, setActiveTab] = useState<"dashboard" | "kelas" | "profil" | "rincian" | "rincian-kelas" | "rincian-kelas-dosen" | "notifikasi">("dashboard");
  const [previousTab, setPreviousTab] = useState<any>("dashboard");

  const deferredQuery = useDeferredValue(query);
  const resourceItems = records[activeResource] ?? [];

  const filteredItems = useMemo(() => {
    return filterResourceItems(resourceItems, deferredQuery);
  }, [deferredQuery, resourceItems]);

  useEffect(() => {
    const storedTokens = getStoredAuthTokens();
    if (storedTokens) {
      void bootstrapSession(storedTokens.accessToken);
    }
  }, []);

  async function bootstrapSession(accessToken: string) {
    setLoading(true);
    setError(null);

    try {
      const session = await apiRequest<SessionUser>("auth/me", {
        accessToken,
        onAccessTokenRotated: setToken,
      });
      setUser(session);
      setToken(getStoredAuthTokens()?.accessToken ?? accessToken);
    } catch (requestError) {
      clearStoredAuthTokens();
      resetConsole();
      setError(getErrorMessage(requestError, "Unable to restore the session."));
    } finally {
      setLoading(false);
    }
  }

  const handleLoginSuccess = async (session: Session) => {
    storeAuthTokens({ 
      accessToken: session.accessToken, 
      refreshToken: session.refreshToken 
    });
    await bootstrapSession(session.accessToken);
  };

  function handleLogout() {
    clearStoredAuthTokens();
    resetConsole();
  }

  function resetConsole() {
    setToken(null);
    setUser(null);
    setRecords(initialStore);
    setActiveTab("dashboard");
    setError(null);
  }

  const navigateToNotifications = () => {
    setPreviousTab(activeTab);
    setActiveTab("notifikasi");
  };

  if (!user) {
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  if (activeTab === "notifikasi") {
    return <NotificationPage onBack={() => setActiveTab(previousTab)} />;
  }

  // Tampilan Mahasiswa
  if (user.role === "student") {
    if (activeTab === "rincian-kelas") {
      return (
        <RincianKelasMahasiswa 
          user={{ name: user.account_name || "Aliya", email: user.email || "" }}
          activeTab="kelas"
          onTabChange={(tab: any) => setActiveTab(tab)}
          onLogout={handleLogout}
          onNavigateToNotifications={navigateToNotifications}
        />
      );
    }
    if (activeTab === "kelas") {
      return (
        <ClassesMahasiswa 
          activeTab="kelas" 
          onTabChange={(tab: any) => setActiveTab(tab)} 
          onLogout={handleLogout} 
          onNavigateToNotifications={navigateToNotifications}
        />
      );
    }
    if (activeTab === "profil") {
      return (
        <ProfileMahasiswa 
          activeTab="profil" 
          onTabChange={(tab: any) => setActiveTab(tab)} 
          onLogout={handleLogout} 
          onNavigateToNotifications={navigateToNotifications}
        />
      );
    }
    return (
      <HomeScreenMahasiswa 
        activeTab="dashboard" 
        onTabChange={(tab: any) => setActiveTab(tab)} 
        onLogout={handleLogout} 
        onNavigateToNotifications={navigateToNotifications} 
      />
    );
  }

  // Tampilan Dosen
  if (user.role === "lecturer") {
    if (activeTab === "rincian") {
      return (
        <RincianMahasiswa 
          user={{ name: user.account_name || "Aymar", email: user.email || "" }}
          activeTab="dashboard" 
          onTabChange={(tab: any) => setActiveTab(tab)}
          onLogout={handleLogout}
          onNavigateToNotifications={navigateToNotifications}
        />
      );
    }
    if (activeTab === "rincian-kelas-dosen") {
      return (
        <RincianKelasDosen 
          user={{ name: user.name || "Aymar", email: user.email || "" }}
          activeTab="kelas" 
          onTabChange={(tab: any) => setActiveTab(tab)}
          onLogout={handleLogout}
          onNavigateToNotifications={navigateToNotifications}
        />
      );
    }
    if (activeTab === "kelas") {
      return (
        <ClassesDosen 
          user={{ name: user.account_name || "Aymar", email: user.email || "" }}
          activeTab="kelas" 
          onTabChange={(tab: any) => setActiveTab(tab)}
          onLogout={handleLogout}
          onNavigateToNotifications={navigateToNotifications}
        />
      );
    }
    if (activeTab === "profil") {
      return (
        <ProfileDosen 
          user={{ name: user.account_name || "Aymar", email: user.email || "" }}
          activeTab="profil" 
          onTabChange={(tab: any) => setActiveTab(tab)}
          onLogout={handleLogout}
          onNavigateToNotifications={navigateToNotifications}
        />
      );
    }
    return (
      <HomeScreenDosen 
        user={{ name: user.account_name || "Aymar", email: user.email || "" }}
        onLogout={handleLogout}
        activeTab={activeTab}
        onTabChange={(tab: any) => setActiveTab(tab)}
        lecturerTodayClasses={lecturerTodayClasses}
        lecturerManagedClasses={lecturerManagedClasses}
        lecturerRoster={lecturerRoster}
        onNavigateToNotifications={navigateToNotifications}
      />
    );
  }

  // Tampilan Admin
  return (
    <main className="shell">
      <div className="frame">
        <ConsoleSidebar
          activeResource={activeResource}
          loading={loading}
          user={user}
          onLogout={handleLogout}
          onRefreshAdmin={() => {}}
          onRefreshLecturer={() => {}}
          onSelectResource={(res) => setActiveResource(res)}
        />
        <section className="surface">
          {user.role === "admin" ? (
            <AdminDashboard
              config={resourceConfigs[activeResource]}
              error={error}
              filteredItems={filteredItems}
              formValues={forms[activeResource]}
              loading={loading}
              message={message}
              records={records}
              query={query}
              submitting={submitting}
              onCreate={() => {}} 
              onDelete={() => {}}
              onFormChange={() => {}}
              onQueryChange={setQuery}
              onRefresh={() => {}}
            />
          ) : null}
        </section>
      </div>
    </main>
  );
}
