"use client";

import type { FormEvent } from "react";
import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";

import { AdminDashboard } from "./features/console/components/admin-dashboard";
import { ConsoleSidebar } from "./features/console/components/console-sidebar";
import { LecturerDashboard } from "./features/console/components/lecturer-dashboard";
import { LoginView } from "./features/console/components/LoginScreen";
import { buildEmptyForm, buildInitialForms, initialStore, resourceConfigs, resourceOrder } from "./features/console/config/resources";
import type {
  LecturerClassRoster,
  LecturerManagedClass,
  LecturerTodayClass,
  ResourceForms,
  ResourceItem,
  ResourceKey,
  ResourceStore,
} from "./features/console/types";
import { resolvePreferredLecturerClassId } from "./features/console/utils/lecturer";
import { filterResourceItems, getErrorMessage } from "./features/console/utils/display";
import { updateResourceFormValue } from "./features/console/utils/forms";
import {
  API_BASE_URL,
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
  const [loginValues, setLoginValues] = useState({
    email: "",
    password: "",
  });
  const [forms, setForms] = useState<ResourceForms>(() => buildInitialForms());

  const deferredQuery = useDeferredValue(query);
  const config = resourceConfigs[activeResource];
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
      const activeAccessToken = getStoredAuthTokens()?.accessToken ?? accessToken;

      setToken(activeAccessToken);
      setUser(session);
      setMessage(null);

      if (session.role === "admin") {
        setLecturerManagedClasses([]);
        setLecturerTodayClasses([]);
        setSelectedLecturerClassId(null);
        setLecturerRoster(null);

        try {
          await loadAdminResources(activeAccessToken);
        } catch (requestError) {
          setError(
            getErrorMessage(
              requestError,
              "Session started, but admin data could not be loaded yet.",
            ),
          );
        }
      } else if (session.role === "lecturer") {
        setRecords(initialStore);

        try {
          await loadLecturerDashboard(activeAccessToken);
        } catch (requestError) {
          setError(
            getErrorMessage(
              requestError,
              "Session started, but lecturer dashboard could not be loaded yet.",
            ),
          );
        }
      } else {
        setRecords(initialStore);
        setLecturerManagedClasses([]);
        setLecturerTodayClasses([]);
        setSelectedLecturerClassId(null);
        setLecturerRoster(null);
      }
    } catch (requestError) {
      clearStoredAuthTokens();
      resetConsole();
      setError(getErrorMessage(requestError, "Unable to restore the session."));
    } finally {
      setLoading(false);
    }
  }

  async function loadAdminResources(
    accessToken: string,
    resourceKeys: ResourceKey[] = resourceOrder,
  ) {
    const datasets = await Promise.all(
      uniqueResourceKeys(resourceKeys).map(async (key) => {
        const response = await apiRequest<ResourceItem[]>(resourceConfigs[key].endpoint, {
          accessToken,
          query: { page: "1", limit: "100", ...(resourceConfigs[key].query ?? {}) },
          onAccessTokenRotated: setToken,
        });

        return [key, response] as const;
      }),
    );

    setRecords((current) => {
      const nextRecords = { ...(resourceKeys.length === resourceOrder.length ? initialStore : current) };

      for (const [key, items] of datasets) {
        nextRecords[key] = items;
      }

      return nextRecords;
    });
  }

  async function loadLecturerDashboard(accessToken: string) {
    const [todayClasses, managedClasses] = await Promise.all([
      apiRequest<LecturerTodayClass[]>("me/classes/today", {
        accessToken,
        onAccessTokenRotated: setToken,
      }),
      apiRequest<LecturerManagedClass[]>("me/classes", {
        accessToken,
        onAccessTokenRotated: setToken,
      }),
    ]);

    setLecturerTodayClasses(todayClasses);
    setLecturerManagedClasses(managedClasses);

    const nextClassId = resolvePreferredLecturerClassId(
      selectedLecturerClassId,
      todayClasses,
      managedClasses,
    );

    setSelectedLecturerClassId(nextClassId);

    if (!nextClassId) {
      setLecturerRoster(null);
      return;
    }

    const roster = await apiRequest<LecturerClassRoster>(`classes/${nextClassId}/roster`, {
      accessToken,
      onAccessTokenRotated: setToken,
    });
    setLecturerRoster(roster);
  }

  async function loadLecturerRoster(accessToken: string, classId: string) {
    const roster = await apiRequest<LecturerClassRoster>(`classes/${classId}/roster`, {
      accessToken,
      onAccessTokenRotated: setToken,
    });
    setSelectedLecturerClassId(classId);
    setLecturerRoster(roster);
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const result = await apiRequest<{
        access_token: string;
        refresh_token: string;
        user: SessionUser;
      }>("auth/login", {
        method: "POST",
        body: loginValues,
      });

      storeAuthTokens({
        accessToken: result.access_token,
        refreshToken: result.refresh_token,
      });
      setLoginValues({ email: "", password: "" });
      setMessage("Session started.");
      await bootstrapSession(result.access_token);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Login failed."));
    } finally {
      setSubmitting(false);
    }
  }

  async function refreshAdminResources(resourceKeys: ResourceKey[] = resourceOrder) {
    if (!token) {
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      await loadAdminResources(resolveAccessToken(token), resourceKeys);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Admin data could not be refreshed."));
    } finally {
      setLoading(false);
    }
  }

  async function refreshLecturerDashboard() {
    if (!token) {
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      await loadLecturerDashboard(resolveAccessToken(token));
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Lecturer dashboard could not be refreshed."));
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      await apiRequest<ResourceItem>(config.endpoint, {
        method: "POST",
        accessToken: token,
        body: config.buildPayload ? config.buildPayload(forms[activeResource]) : forms[activeResource],
        onAccessTokenRotated: setToken,
      });

      setForms((current) => ({
        ...current,
        [activeResource]: buildEmptyForm(config.fields),
      }));
      await loadAdminResources(resolveAccessToken(token), config.refreshTargets ?? [activeResource]);
      setMessage(`${config.singularLabel} created.`);
    } catch (requestError) {
      setError(getErrorMessage(requestError, `Failed to create ${config.title.toLowerCase()}.`));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!token) {
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      await apiRequest<ResourceItem>(`${config.endpoint}/${id}`, {
        method: "DELETE",
        accessToken: token,
        onAccessTokenRotated: setToken,
      });

      await loadAdminResources(resolveAccessToken(token), config.refreshTargets ?? [activeResource]);
      setMessage(`${config.singularLabel} removed.`);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Delete action failed."));
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    clearStoredAuthTokens();
    resetConsole();
  }

  function handleResourceChange(resourceKey: ResourceKey) {
    startTransition(() => {
      setActiveResource(resourceKey);
      setQuery("");
      setMessage(null);
      setError(null);
    });
  }

  function handleQueryChange(nextQuery: string) {
    startTransition(() => {
      setQuery(nextQuery);
    });
  }

  function resetConsole() {
    setToken(null);
    setUser(null);
    setRecords(initialStore);
    setForms(buildInitialForms());
    setLecturerManagedClasses([]);
    setLecturerTodayClasses([]);
    setSelectedLecturerClassId(null);
    setLecturerRoster(null);
    setQuery("");
    setLoginValues({ email: "", password: "" });
    setMessage(null);
    setError(null);
  }

  if (!user) {
    return (
      <LoginView
        apiBaseUrl={API_BASE_URL}
        error={error}
        message={message}
        submitting={submitting}
        loginValues={loginValues}
        onChange={(field, value) =>
          setLoginValues((current) => ({
            ...current,
            [field]: value,
          }))
        }
        onSubmit={handleLogin}
      />
    );
  }

  const formValues = forms[activeResource];

  return (
    <main className="shell">
      <div className="frame">
        <ConsoleSidebar
          activeResource={activeResource}
          loading={loading}
          user={user}
          onLogout={handleLogout}
          onRefreshAdmin={() => void refreshAdminResources()}
          onRefreshLecturer={() => void refreshLecturerDashboard()}
          onSelectResource={handleResourceChange}
        />

        <section className="surface">
          {user.role === "student" ? (
            <div className="message">
              Student accounts are authenticated successfully, but the web surface is not the
              primary student experience yet. Use the mobile flow for schedule and camera
              attendance once it is enabled.
            </div>
          ) : null}

          {user.role === "lecturer" ? (
            <LecturerDashboard
              error={error}
              lecturerManagedClasses={lecturerManagedClasses}
              lecturerTodayClasses={lecturerTodayClasses}
              lecturerRoster={lecturerRoster}
              selectedLecturerClassId={selectedLecturerClassId}
              onSelectClass={(classId) => token && void loadLecturerRoster(resolveAccessToken(token), classId)}
            />
          ) : null}

          {user.role === "admin" ? (
            <AdminDashboard
              config={config}
              error={error}
              filteredItems={filteredItems}
              formValues={formValues}
              loading={loading}
              message={message}
              records={records}
              query={query}
              submitting={submitting}
              onCreate={handleCreate}
              onDelete={(id) => void handleDelete(id)}
              onFormChange={(fieldName, value) =>
                updateResourceFormValue(setForms, activeResource, fieldName, value)
              }
              onQueryChange={handleQueryChange}
              onRefresh={() => void refreshAdminResources([activeResource])}
            />
          ) : null}
        </section>
      </div>
    </main>
  );
}

function resolveAccessToken(fallbackToken: string) {
  return getStoredAuthTokens()?.accessToken ?? fallbackToken;
}

function uniqueResourceKeys(resourceKeys: ResourceKey[]) {
  return Array.from(new Set(resourceKeys));
}
