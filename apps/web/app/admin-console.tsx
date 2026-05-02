"use client";

import type { Dispatch, FormEvent, SetStateAction } from "react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  API_BASE_URL,
  apiRequest,
  clearStoredAuthTokens,
  getStoredAuthTokens,
  storeAuthTokens,
  type SessionUser,
} from "./lib/api-client";

type ResourceKey =
  | "students"
  | "lecturers"
  | "rooms"
  | "devices"
  | "courses"
  | "classes"
  | "schedules"
  | "enrollments";

type ResourceItem = Record<string, unknown>;
type ResourceStore = Record<ResourceKey, ResourceItem[]>;

type Option = {
  label: string;
  value: string;
};

type ResourceField = {
  name: string;
  label: string;
  placeholder?: string;
  type?: "text" | "number" | "select";
  options?: Option[];
  getOptions?: (store: ResourceStore) => Option[];
};

type ResourceColumn = {
  key: string;
  label: string;
  render: (item: ResourceItem) => string;
};

type ResourceConfig = {
  key: ResourceKey;
  title: string;
  endpoint: string;
  fields: ResourceField[];
  columns: ResourceColumn[];
  emptyMessage: string;
};

const resourceOrder: ResourceKey[] = [
  "students",
  "lecturers",
  "rooms",
  "devices",
  "courses",
  "classes",
  "schedules",
  "enrollments",
];

const resourceLabels: Record<ResourceKey, string> = {
  students: "Students",
  lecturers: "Lecturers",
  rooms: "Rooms",
  devices: "Devices",
  courses: "Courses",
  classes: "Classes",
  schedules: "Schedules",
  enrollments: "Enrollments",
};

const statusOptions: Option[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const deviceStatusOptions: Option[] = [
  { value: "online", label: "Online" },
  { value: "offline", label: "Offline" },
  { value: "maintenance", label: "Maintenance" },
];

const dayOptions: Option[] = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

const sourceOptions: Option[] = [
  { value: "manual", label: "Manual" },
  { value: "six", label: "SIX" },
];

const resourceConfigs: Record<ResourceKey, ResourceConfig> = {
  students: {
    key: "students",
    title: "Students",
    endpoint: "students",
    emptyMessage: "No student records yet.",
    fields: [
      { name: "nim", label: "NIM", placeholder: "220123456" },
      { name: "name", label: "Name", placeholder: "Budi" },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: statusOptions,
      },
    ],
    columns: [
      { key: "nim", label: "NIM", render: (item) => text(item.nim) },
      { key: "name", label: "Name", render: (item) => text(item.name) },
      { key: "status", label: "Status", render: (item) => text(item.status) },
      { key: "updated_at", label: "Updated", render: (item) => shortDate(item.updated_at) },
    ],
  },
  lecturers: {
    key: "lecturers",
    title: "Lecturers",
    endpoint: "lecturers",
    emptyMessage: "No lecturer records yet.",
    fields: [
      { name: "nidn", label: "NIDN", placeholder: "100200300" },
      { name: "name", label: "Name", placeholder: "Dr. A" },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: statusOptions,
      },
    ],
    columns: [
      { key: "nidn", label: "NIDN", render: (item) => text(item.nidn) },
      { key: "name", label: "Name", render: (item) => text(item.name) },
      { key: "status", label: "Status", render: (item) => text(item.status) },
      {
        key: "user",
        label: "Linked User",
        render: (item) => nestedText(item.user, "email"),
      },
    ],
  },
  rooms: {
    key: "rooms",
    title: "Rooms",
    endpoint: "rooms",
    emptyMessage: "No room records yet.",
    fields: [
      { name: "code", label: "Code", placeholder: "R101" },
      { name: "name", label: "Name", placeholder: "Lab AI 1" },
      { name: "building", label: "Building", placeholder: "A" },
      { name: "floor", label: "Floor", type: "number", placeholder: "1" },
    ],
    columns: [
      { key: "code", label: "Code", render: (item) => text(item.code) },
      { key: "name", label: "Name", render: (item) => text(item.name) },
      { key: "building", label: "Building", render: (item) => text(item.building) },
      { key: "floor", label: "Floor", render: (item) => text(item.floor) },
    ],
  },
  devices: {
    key: "devices",
    title: "Devices",
    endpoint: "devices",
    emptyMessage: "No device records yet.",
    fields: [
      {
        name: "room_id",
        label: "Room",
        type: "select",
        getOptions: (store) => buildOptions(store.rooms, "id", "name", "code"),
      },
      { name: "device_code", label: "Device Code", placeholder: "DEV-R101-01" },
      { name: "device_type", label: "Device Type", placeholder: "door-face-terminal" },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: deviceStatusOptions,
      },
    ],
    columns: [
      { key: "device_code", label: "Code", render: (item) => text(item.device_code) },
      { key: "device_type", label: "Type", render: (item) => text(item.device_type) },
      { key: "status", label: "Status", render: (item) => text(item.status) },
      { key: "room", label: "Room", render: (item) => nestedText(item.room, "name") },
    ],
  },
  courses: {
    key: "courses",
    title: "Courses",
    endpoint: "courses",
    emptyMessage: "No course records yet.",
    fields: [
      { name: "code", label: "Code", placeholder: "IF301" },
      { name: "name", label: "Name", placeholder: "Machine Learning" },
      { name: "credits", label: "Credits", type: "number", placeholder: "3" },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: statusOptions,
      },
    ],
    columns: [
      { key: "code", label: "Code", render: (item) => text(item.code) },
      { key: "name", label: "Name", render: (item) => text(item.name) },
      { key: "credits", label: "Credits", render: (item) => text(item.credits) },
      { key: "status", label: "Status", render: (item) => text(item.status) },
    ],
  },
  classes: {
    key: "classes",
    title: "Classes",
    endpoint: "classes",
    emptyMessage: "No class records yet.",
    fields: [
      {
        name: "course_id",
        label: "Course",
        type: "select",
        getOptions: (store) => buildOptions(store.courses, "id", "name", "code"),
      },
      {
        name: "lecturer_id",
        label: "Lecturer",
        type: "select",
        getOptions: (store) => buildOptions(store.lecturers, "id", "name", "nidn"),
      },
      {
        name: "room_id",
        label: "Room",
        type: "select",
        getOptions: (store) => buildOptions(store.rooms, "id", "name", "code"),
      },
      { name: "class_code", label: "Class Code", placeholder: "IF-3A" },
      { name: "semester", label: "Semester", placeholder: "6" },
      { name: "academic_year", label: "Academic Year", placeholder: "2026" },
    ],
    columns: [
      { key: "class_code", label: "Code", render: (item) => text(item.class_code) },
      { key: "course", label: "Course", render: (item) => nestedText(item.course, "name") },
      { key: "lecturer", label: "Lecturer", render: (item) => nestedText(item.lecturer, "name") },
      { key: "room", label: "Room", render: (item) => nestedText(item.room, "name") },
    ],
  },
  schedules: {
    key: "schedules",
    title: "Schedules",
    endpoint: "schedules",
    emptyMessage: "No schedule records yet.",
    fields: [
      {
        name: "class_id",
        label: "Class",
        type: "select",
        getOptions: (store) => buildOptions(store.classes, "id", "class_code", "semester"),
      },
      {
        name: "day_of_week",
        label: "Day",
        type: "select",
        options: dayOptions,
      },
      { name: "start_time", label: "Start", placeholder: "08:00:00" },
      { name: "end_time", label: "End", placeholder: "09:40:00" },
      {
        name: "source",
        label: "Source",
        type: "select",
        options: sourceOptions,
      },
    ],
    columns: [
      { key: "class", label: "Class", render: (item) => nestedText(item.class, "class_code") },
      { key: "day_of_week", label: "Day", render: (item) => text(item.day_of_week) },
      { key: "start_time", label: "Start", render: (item) => text(item.start_time) },
      { key: "end_time", label: "End", render: (item) => text(item.end_time) },
    ],
  },
  enrollments: {
    key: "enrollments",
    title: "Enrollments",
    endpoint: "enrollments",
    emptyMessage: "No enrollment records yet.",
    fields: [
      {
        name: "student_id",
        label: "Student",
        type: "select",
        getOptions: (store) => buildOptions(store.students, "id", "name", "nim"),
      },
      {
        name: "class_id",
        label: "Class",
        type: "select",
        getOptions: (store) => buildOptions(store.classes, "id", "class_code", "semester"),
      },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: statusOptions,
      },
    ],
    columns: [
      { key: "student", label: "Student", render: (item) => nestedText(item.student, "name") },
      { key: "class", label: "Class", render: (item) => nestedText(item.class, "class_code") },
      { key: "status", label: "Status", render: (item) => text(item.status) },
      { key: "updated_at", label: "Updated", render: (item) => shortDate(item.updated_at) },
    ],
  },
};

const initialStore = resourceOrder.reduce(
  (accumulator, key) => ({
    ...accumulator,
    [key]: [],
  }),
  {} as ResourceStore,
);

export default function AdminConsole() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [activeResource, setActiveResource] = useState<ResourceKey>("students");
  const [records, setRecords] = useState<ResourceStore>(initialStore);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loginValues, setLoginValues] = useState({
    email: "",
    password: "",
  });
  const [forms, setForms] = useState<Record<ResourceKey, Record<string, string>>>(() =>
    buildInitialForms(),
  );

  const deferredQuery = useDeferredValue(query);
  const config = resourceConfigs[activeResource];
  const resourceItems = records[activeResource] ?? [];

  const filteredItems = useMemo(() => {
    if (!deferredQuery) {
      return resourceItems;
    }

    const loweredQuery = deferredQuery.toLowerCase();
    return resourceItems.filter((item) =>
      JSON.stringify(item).toLowerCase().includes(loweredQuery),
    );
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

      if (session.role === "admin") {
        try {
          await loadAllResources(activeAccessToken);
        } catch (requestError) {
          setError(
            getErrorMessage(
              requestError,
              "Session started, but admin data could not be loaded yet.",
            ),
          );
        }
      }
    } catch (requestError) {
      clearStoredAuthTokens();
      setToken(null);
      setUser(null);
      setError(getErrorMessage(requestError, "Unable to restore the session."));
    } finally {
      setLoading(false);
    }
  }

  async function loadAllResources(accessToken: string) {
    const datasets = await Promise.all(
      resourceOrder.map(async (key) => {
        const response = await apiRequest<ResourceItem[]>(resourceConfigs[key].endpoint, {
          accessToken,
          query: { page: "1", limit: "100" },
          onAccessTokenRotated: setToken,
        });

        return [key, response] as const;
      }),
    );

    setRecords(
      datasets.reduce((accumulator, [key, items]) => {
        accumulator[key] = items;
        return accumulator;
      }, { ...initialStore }),
    );
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
        body: forms[activeResource],
        onAccessTokenRotated: setToken,
      });

      setForms((current) => ({
        ...current,
        [activeResource]: buildEmptyForm(config.fields),
      }));
      await loadAllResources(getStoredAuthTokens()?.accessToken ?? token);
      setMessage(`${config.title.slice(0, -1)} created.`);
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

      await loadAllResources(getStoredAuthTokens()?.accessToken ?? token);
      setMessage("Record updated.");
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Delete action failed."));
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    clearStoredAuthTokens();
    setToken(null);
    setUser(null);
    setRecords(initialStore);
    setMessage(null);
    setError(null);
  }

  if (!user) {
    return (
      <div className="login-wrap">
        <div className="login-shell">
          <section className="login-side">
            <p className="eyebrow">Gatekeeper AI</p>
            <h1 className="title">Web Console</h1>
            <p className="subtitle">
              Admin access for Sprint 1 data setup, room/device registration, and academic master
              data input.
            </p>

            <div className="kpis">
              <div className="kpi">
                <strong>8</strong>
                <span>Core datasets connected to the same API contract.</span>
              </div>
              <div className="kpi">
                <strong>JWT</strong>
                <span>Admin and lecturer sessions aligned with the NestJS auth module.</span>
              </div>
              <div className="kpi">
                <strong>CRUD</strong>
                <span>Ready for onboarding master data before schedule sync and attendance logic.</span>
              </div>
            </div>
          </section>

          <section className="login-form">
            <p className="eyebrow">Sign In</p>
            <h2 className="title">Start Session</h2>
            <p className="subtitle">Use the credentials provisioned in the API database.</p>

            <form className="form-grid" onSubmit={handleLogin}>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  autoComplete="email"
                  value={loginValues.email}
                  onChange={(event) =>
                    setLoginValues((current) => ({ ...current, email: event.target.value }))
                  }
                />
              </div>

              <div className="field">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={loginValues.password}
                  onChange={(event) =>
                    setLoginValues((current) => ({ ...current, password: event.target.value }))
                  }
                />
              </div>

              {error ? <div className="message error">{error}</div> : null}
              {message ? <div className="message">{message}</div> : null}

              <button className="button primary" disabled={submitting}>
                {submitting ? "Signing in..." : "Sign In"}
              </button>
              <p className="helper">API base: {API_BASE_URL}</p>
            </form>
          </section>
        </div>
      </div>
    );
  }

  const formValues = forms[activeResource];

  return (
    <main className="shell">
      <div className="frame">
        <aside className="sidebar">
          <div>
            <p className="eyebrow">Gatekeeper AI</p>
            <h1 className="title">Admin Console</h1>
            <p className="subtitle">
              Login, inspect session state, and input master data for Sprint 1.
            </p>
          </div>

          <div className="session">
            <span className="session-label">Signed In As</span>
            <span className="session-value">{user.name}</span>
            <span className="muted">{user.email}</span>
            <span className="badge">{user.role}</span>
          </div>

          <div className="actions">
            <button className="button ghost" onClick={() => token && void loadAllResources(token)}>
              Refresh All
            </button>
            <button className="button danger" onClick={handleLogout}>
              Logout
            </button>
          </div>

          <div className="tab-list">
            {resourceOrder.map((resourceKey) => (
              <button
                key={resourceKey}
                className={`tab ${activeResource === resourceKey ? "active" : ""}`}
                onClick={() => {
                  setActiveResource(resourceKey);
                  setQuery("");
                  setMessage(null);
                  setError(null);
                }}
              >
                {resourceLabels[resourceKey]}
              </button>
            ))}
          </div>
        </aside>

        <section className="surface">
          {user.role !== "admin" ? (
            <div className="message error">
              This web surface is currently scoped for admin CRUD. Lecturer login is valid, but
              admin data tools stay locked to the `admin` role.
            </div>
          ) : null}

          <div className="grid two">
            <section className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">{config.title}</p>
                  <h2>Create Record</h2>
                </div>
              </div>
              <div className="panel-body">
                <form className="form-grid" onSubmit={handleCreate}>
                  {config.fields.map((field) => {
                    const options = field.getOptions ? field.getOptions(records) : field.options;
                    const fieldValue = formValues[field.name] ?? "";

                    return (
                      <div className="field" key={field.name}>
                        <label htmlFor={`${config.key}-${field.name}`}>{field.label}</label>
                        {field.type === "select" ? (
                          <select
                            id={`${config.key}-${field.name}`}
                            value={fieldValue}
                            onChange={(event) =>
                              updateFormValue(
                                setForms,
                                activeResource,
                                field.name,
                                event.target.value,
                              )
                            }
                          >
                            <option value="">Select...</option>
                            {(options ?? []).map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            id={`${config.key}-${field.name}`}
                            type={field.type === "number" ? "number" : "text"}
                            placeholder={field.placeholder}
                            value={fieldValue}
                            onChange={(event) =>
                              updateFormValue(
                                setForms,
                                activeResource,
                                field.name,
                                event.target.value,
                              )
                            }
                          />
                        )}
                      </div>
                    );
                  })}

                  {error ? <div className="message error">{error}</div> : null}
                  {message ? <div className="message">{message}</div> : null}

                  <button
                    className="button primary"
                    disabled={submitting || user.role !== "admin"}
                  >
                    {submitting ? "Saving..." : `Create ${config.title.slice(0, -1)}`}
                  </button>
                </form>
              </div>
            </section>

            <section className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">{config.title}</p>
                  <h3>Records</h3>
                </div>
                <div className="toolbar">
                  <input
                    className="search"
                    placeholder={`Search ${config.title.toLowerCase()}...`}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                  <button
                    className="button"
                    onClick={() => token && void loadAllResources(token)}
                    disabled={loading}
                  >
                    {loading ? "Refreshing..." : "Refresh"}
                  </button>
                </div>
              </div>

              <div className="panel-body">
                {filteredItems.length === 0 ? (
                  <p className="muted">{config.emptyMessage}</p>
                ) : (
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          {config.columns.map((column) => (
                            <th key={column.key}>{column.label}</th>
                          ))}
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredItems.map((item) => {
                          const id = text(item.id);
                          return (
                            <tr key={id}>
                              {config.columns.map((column) => (
                                <td key={column.key}>{column.render(item)}</td>
                              ))}
                              <td>
                                <button
                                  className="button danger"
                                  onClick={() => void handleDelete(id)}
                                  disabled={loading || user.role !== "admin"}
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

function buildInitialForms() {
  return resourceOrder.reduce(
    (accumulator, key) => ({
      ...accumulator,
      [key]: buildEmptyForm(resourceConfigs[key].fields),
    }),
    {} as Record<ResourceKey, Record<string, string>>,
  );
}

function buildEmptyForm(fields: ResourceField[]) {
  return fields.reduce(
    (accumulator, field) => ({
      ...accumulator,
      [field.name]: "",
    }),
    {} as Record<string, string>,
  );
}

function updateFormValue(
  setForms: Dispatch<SetStateAction<Record<ResourceKey, Record<string, string>>>>,
  resource: ResourceKey,
  fieldName: string,
  value: string,
) {
  setForms((current) => ({
    ...current,
    [resource]: {
      ...current[resource],
      [fieldName]: value,
    },
  }));
}
function buildOptions(
  items: ResourceItem[],
  valueKey: string,
  primaryLabelKey: string,
  secondaryLabelKey?: string,
) {
  return items.map((item) => {
    const primary = text(item[primaryLabelKey]);
    const secondary = secondaryLabelKey ? text(item[secondaryLabelKey]) : "";

    return {
      value: text(item[valueKey]),
      label: secondary ? `${primary} (${secondary})` : primary,
    };
  });
}

function text(value: unknown) {
  if (value === null || value === undefined) {
    return "-";
  }

  return String(value);
}

function nestedText(value: unknown, key: string) {
  if (!value || typeof value !== "object") {
    return "-";
  }

  return text((value as Record<string, unknown>)[key]);
}

function shortDate(value: unknown) {
  if (!value) {
    return "-";
  }

  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
