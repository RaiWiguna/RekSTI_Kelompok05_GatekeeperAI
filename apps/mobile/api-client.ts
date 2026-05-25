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
