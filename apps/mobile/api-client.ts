const DEFAULT_REQUEST_TIMEOUT_MS = 8_000;

type ApiEnvelope<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: {
        message: string;
      };
    };

export function normalizeApiBase(value: string) {
  return value.replace(/\/$/, "");
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
      throw new Error(payload.success ? "Request failed." : payload.error.message);
    }

    return payload.data;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request timed out after ${Math.round(timeoutMs / 1000)} seconds.`);
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Unable to reach the API.");
  } finally {
    clearTimeout(timeoutHandle);
  }
}
