const DEFAULT_REQUEST_TIMEOUT_MS = 8_000;
const DEFAULT_API_BASE_URL = "http://103.31.38.237/v1";

declare const process: {
  env?: Record<string, string | undefined>;
};

type ApiEnvelope<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: {
        code: string;
        message: string;
      };
    };

export type ApiUserRole = "student" | "lecturer" | "admin";

export type SessionUser = {
  id: string;
  account_name: string;
  role: ApiUserRole;
};

export type LoginResponse = {
  access_token: string;
  refresh_token: string;
  user: SessionUser;
};

export type UpdateMyProfileResponse = {
  id: string;
  email: string;
  account_name: string;
  role: ApiUserRole;
};

export type StudentTodaySchedule = {
  schedule_id: string;
  date: string;
  start_time: string;
  end_time: string;
  attendance_status: "attended" | "absent" | "not_yet";
  check_in_at: string | null;
  check_out_at: string | null;
  course: {
    code: string;
    name: string;
  };
  lecturer: {
    full_name: string;
  };
};

export type StudentClassSummary = {
  class_id: string;
  class_code: string;
  course: {
    code: string;
    name: string;
  };
  lecturer: {
    full_name: string;
  };
  attendance_percentage: number;
  attendance_history: Array<{
    schedule_id: string;
    date: string;
    status: "attended" | "absent";
  }>;
};

export type LecturerClassSummary = {
  class_id: string;
  class_code: string;
  course: {
    code: string;
    name: string;
  };
  room: {
    id: string;
    code: string;
    name: string;
  };
  enrollments_count: number;
  present_count?: number;
  absent_count?: number;
};

export type LecturerClassRoster = {
  class_id: string;
  class_code: string;
  course: {
    code: string;
    name: string;
  };
  room: {
    id: string;
    code: string;
    name: string;
  };
  students: Array<{
    enrollment_id: string;
    status: string;
    student: {
      id: string;
      nim: string;
      full_name: string;
      status: string;
    };
  }>;
};

export type ConnectivityDiagnostics = {
  apiBaseUrl: string;
  loginUrl: string;
  healthUrl: string;
  healthStatus: "ok" | "http_error" | "timeout" | "unreachable";
  healthMessage: string;
};

export class ApiRequestError extends Error {
  readonly code: string;
  readonly status?: number;
  readonly url: string;

  constructor(params: {
    code: string;
    message: string;
    url: string;
    status?: number;
  }) {
    super(params.message);
    this.name = "ApiRequestError";
    this.code = params.code;
    this.status = params.status;
    this.url = params.url;
  }
}

export function normalizeApiBase(value: string) {
  return value.replace(/\/$/, "");
}

const configuredApiBaseUrl =
  typeof process !== "undefined" ? process.env?.EXPO_PUBLIC_API_BASE_URL : undefined;

export const API_BASE_URL = normalizeApiBase(configuredApiBaseUrl ?? DEFAULT_API_BASE_URL);

export function buildApiUrl(path: string) {
  return `${API_BASE_URL}/${path.replace(/^\/+/, "")}`;
}

export async function fetchJson<T>(url: string, init?: RequestInit, timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      signal: controller.signal,
    });

    const text = await response.text();
    let payload: ApiEnvelope<T>;

    if (!text) {
      payload = {
        success: false,
        error: {
          code: "empty_response",
          message: "Empty response from API.",
        },
      };
    } else {
      try {
        payload = JSON.parse(text) as ApiEnvelope<T>;
      } catch {
        throw new Error("Unexpected response from API.");
      }
    }

    if (!response.ok || !payload.success) {
      if (!payload.success) {
        throw new ApiRequestError({
          code: payload.error.code || "http_error",
          message: payload.error.message,
          status: response.status,
          url,
        });
      }

      throw new ApiRequestError({
        code: "http_error",
        message: `HTTP ${response.status} while calling ${url}.`,
        status: response.status,
        url,
      });
    }

    return payload.data;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiRequestError({
        code: "network_timeout",
        message: `Request timed out after ${Math.round(timeoutMs / 1000)} seconds while calling ${url}.`,
        url,
      });
    }

    if (error instanceof ApiRequestError) {
      throw error;
    }

    if (error instanceof Error) {
      const networkLikeMessage = error.message.toLowerCase();
      if (networkLikeMessage.includes("network request failed")) {
        throw new ApiRequestError({
          code: "network_unreachable",
          message: `Network request failed while calling ${url}.`,
          url,
        });
      }

      throw new ApiRequestError({
        code: "unknown_client_error",
        message: `${error.message} (request: ${url})`,
        url,
      });
    }

    throw new ApiRequestError({
      code: "network_unreachable",
      message: `Unable to reach the API (request: ${url}).`,
      url,
    });
  } finally {
    clearTimeout(timeoutHandle);
  }
}

export async function loginWithPassword(email: string, password: string) {
  return fetchJson<LoginResponse>(buildApiUrl("auth/login"), {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });
}

export async function updateMyAccountName(accessToken: string, accountName: string) {
  return fetchJson<UpdateMyProfileResponse>(buildApiUrl("me/profile"), {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      account_name: accountName,
    }),
  });
}

export async function getStudentTodaySchedules(accessToken: string) {
  return fetchJson<StudentTodaySchedule[]>(buildApiUrl("me/schedules/today"), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function getStudentClasses(accessToken: string) {
  return fetchJson<StudentClassSummary[]>(buildApiUrl("me/classes"), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function getLecturerTodayClasses(accessToken: string) {
  return fetchJson<LecturerClassSummary[]>(buildApiUrl("me/classes/today"), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function getLecturerClasses(accessToken: string) {
  return fetchJson<LecturerClassSummary[]>(buildApiUrl("me/classes"), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function getLecturerClassRoster(accessToken: string, classId: string) {
  return fetchJson<LecturerClassRoster>(buildApiUrl(`classes/${classId}/roster`), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function sendDoorOverride(accessToken: string, roomId: string, action: "unlock" | "lock") {
  return fetchJson<{ status: "sent" | "failed"; iot_gateway?: { message?: string } }>(buildApiUrl("overrides"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      room_id: roomId,
      action,
      reason: `Lecturer ${action} request from mobile app`,
    }),
  });
}

export async function diagnoseApiConnectivity(timeoutMs = 2_500): Promise<ConnectivityDiagnostics> {
  const healthUrl = buildApiUrl("health");
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(healthUrl, {
      method: "GET",
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        apiBaseUrl: API_BASE_URL,
        loginUrl: buildApiUrl("auth/login"),
        healthUrl,
        healthStatus: "http_error",
        healthMessage: `Health endpoint returned HTTP ${response.status}.`,
      };
    }

    return {
      apiBaseUrl: API_BASE_URL,
      loginUrl: buildApiUrl("auth/login"),
      healthUrl,
      healthStatus: "ok",
      healthMessage: "Health endpoint is reachable.",
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return {
        apiBaseUrl: API_BASE_URL,
        loginUrl: buildApiUrl("auth/login"),
        healthUrl,
        healthStatus: "timeout",
        healthMessage: `Health endpoint timed out after ${Math.round(timeoutMs / 1000)} seconds.`,
      };
    }

    return {
      apiBaseUrl: API_BASE_URL,
      loginUrl: buildApiUrl("auth/login"),
      healthUrl,
      healthStatus: "unreachable",
      healthMessage: error instanceof Error ? error.message : "Unable to reach health endpoint.",
    };
  } finally {
    clearTimeout(timeoutHandle);
  }
}
