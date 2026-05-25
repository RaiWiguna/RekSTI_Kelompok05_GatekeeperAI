"use client";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "/api";

const ACCESS_TOKEN_STORAGE_KEY = "gatekeeper-web-access-token";
const REFRESH_TOKEN_STORAGE_KEY = "gatekeeper-web-refresh-token";
const DEFAULT_REQUEST_TIMEOUT_MS = 8_000;

export type SessionUser = {
  id: string;
  email: string;
  account_name: string;
  role: "student" | "admin" | "lecturer";
};

type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
};

type ApiError = {
  success: false;
  error: {
    code: string;
    message: string;
  };
};

type ApiResult<T> = ApiSuccess<T> | ApiError;

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

type RefreshResponse = {
  access_token: string;
  refresh_token: string;
  user: SessionUser;
};

type ApiRequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  accessToken?: string;
  body?: Record<string, unknown>;
  query?: Record<string, string>;
  timeoutMs?: number;
  onAccessTokenRotated?: (accessToken: string) => void;
};

type ApiExecutionResult<T> = {
  response: Response;
  payload:
    | ApiResult<T>
    | {
        message?: string | string[];
        error?: string;
        statusCode?: number;
      };
};

let refreshPromise: Promise<AuthTokens | null> | null = null;

export function getStoredAuthTokens() {
  if (typeof window === "undefined") {
    return null;
  }

  const accessToken = window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  const refreshToken = window.localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);

  if (!accessToken || !refreshToken) {
    return null;
  }

  return { accessToken, refreshToken } satisfies AuthTokens;
}

export function storeAuthTokens(tokens: AuthTokens) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, tokens.accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, tokens.refreshToken);
}

export function clearStoredAuthTokens() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const execution = await executeApiRequest<T>(path, options);

  if (isSuccessPayload(execution.payload) && execution.response.ok) {
    return execution.payload.data;
  }

  if (shouldRefreshSession(execution.response.status, options)) {
    const refreshedTokens = await refreshSession();

    if (refreshedTokens) {
      options.onAccessTokenRotated?.(refreshedTokens.accessToken);

      const retryExecution = await executeApiRequest<T>(path, {
        ...options,
        accessToken: refreshedTokens.accessToken,
      });

      if (isSuccessPayload(retryExecution.payload) && retryExecution.response.ok) {
        return retryExecution.payload.data;
      }

      throw new Error(extractApiErrorMessage(retryExecution.payload, retryExecution.response.status));
    }
  }

  throw new Error(extractApiErrorMessage(execution.payload, execution.response.status));
}

async function executeApiRequest<T>(
  path: string,
  options: ApiRequestOptions,
): Promise<ApiExecutionResult<T>> {
  const url = buildRequestUrl(path);

  if (options.query) {
    for (const [key, value] of Object.entries(options.query)) {
      url.searchParams.set(key, value);
    }
  }

  try {
    const response = await fetchWithTimeout(url.toString(), {
      method: options.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        ...(options.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : {}),
      },
      body: options.body ? JSON.stringify(cleanPayload(options.body)) : undefined,
      cache: "no-store",
    }, options.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS);

    return {
      response,
      payload: await parseApiPayload<T>(response),
    };
  } catch (error) {
    throw toRequestError(error, options.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS);
  }
}

async function refreshSession() {
  if (refreshPromise) {
    return refreshPromise;
  }

  const storedTokens = getStoredAuthTokens();

  if (!storedTokens) {
    return null;
  }

  // Deduplicate refresh bursts when several requests hit an expired token together.
  refreshPromise = (async () => {
    try {
      const execution = await executeApiRequest<RefreshResponse>("auth/refresh", {
        method: "POST",
        body: {
          refresh_token: storedTokens.refreshToken,
        },
      });

      if (!isSuccessPayload(execution.payload) || !execution.response.ok) {
        clearStoredAuthTokens();
        return null;
      }

      const nextTokens = {
        accessToken: execution.payload.data.access_token,
        refreshToken: execution.payload.data.refresh_token,
      } satisfies AuthTokens;

      storeAuthTokens(nextTokens);
      return nextTokens;
    } catch {
      clearStoredAuthTokens();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeoutHandle = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeoutHandle);
  }
}

async function parseApiPayload<T>(response: Response) {
  const text = await response.text();

  if (!text) {
    return {} as ApiExecutionResult<T>["payload"];
  }

  try {
    return JSON.parse(text) as ApiExecutionResult<T>["payload"];
  } catch {
    return {
      error: text,
      statusCode: response.status,
    };
  }
}

function shouldRefreshSession(status: number, options: ApiRequestOptions) {
  return status === 401 && Boolean(options.accessToken);
}

function isSuccessPayload<T>(payload: ApiExecutionResult<T>["payload"]): payload is ApiSuccess<T> {
  return "success" in payload && payload.success;
}

function cleanPayload(values: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(values)
      .filter(([, value]) => typeof value !== "string" || value.trim() !== "")
      .map(([key, value]) => [key, value]),
  );
}

function toRequestError(error: unknown, timeoutMs: number) {
  if (isAbortError(error)) {
    return new Error(`Request timed out after ${Math.round(timeoutMs / 1000)} seconds.`);
  }

  if (error instanceof Error && error.message === "Failed to fetch") {
    return new Error(
      "Unable to reach the web API proxy or backend. Ensure the API server is running and that the requested route exists.",
    );
  }

  if (error instanceof Error && error.message) {
    return new Error(error.message);
  }

  return new Error("Unable to reach the API.");
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

function buildRequestUrl(path: string) {
  const normalizedBase = API_BASE_URL.startsWith("http://") || API_BASE_URL.startsWith("https://")
    ? `${API_BASE_URL}/`
    : new URL(`${stripLeadingSlash(API_BASE_URL)}/`, window.location.origin).toString();

  return new URL(stripLeadingSlash(path), normalizedBase);
}

function stripLeadingSlash(value: string) {
  return value.replace(/^\/+/, "");
}

function extractApiErrorMessage(
  payload:
    | ApiResult<unknown>
    | {
        message?: string | string[];
        error?: string;
        statusCode?: number;
      },
  status: number,
) {
  if ("success" in payload && payload.success === false) {
    return payload.error.message || "Request failed.";
  }

  if ("message" in payload && payload.message) {
    return Array.isArray(payload.message) ? payload.message.join(", ") : payload.message;
  }

  if ("error" in payload && typeof payload.error === "string") {
    return payload.error;
  }

  if (status === 404) {
    return "Backend route was not found. Restart the API server so the latest auth routes are active.";
  }

  return "Request failed.";
}
