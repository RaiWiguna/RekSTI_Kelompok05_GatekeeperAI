import type { NextRequest } from "next/server";

const DEFAULT_FACE_RECOGNITION_URL =
  process.env.NODE_ENV === "production"
    ? "http://103.31.38.237/face"
    : "http://localhost:8000";
const FACE_RECOGNITION_URL =
  (process.env.FACE_RECOGNITION_URL ?? process.env.FACE_SERVICE_URL ?? DEFAULT_FACE_RECOGNITION_URL)
    .replace(/\/$/, "");
const FACE_RECOGNITION_TIMEOUT_MS = Number(process.env.FACE_RECOGNITION_TIMEOUT_MS ?? 15000);

type Detection = {
  class: string;
  confidence: number;
  bbox?: number[];
};

type FaceRecognitionResponse = {
  success: boolean;
  detections?: Detection[];
  timestamp?: string;
  error?: string;
};

export async function GET() {
  const healthUrl = `${FACE_RECOGNITION_URL}/health`;
  const response = await fetchFaceRecognition(healthUrl, {
    method: "GET",
    cache: "no-store",
  });

  return Response.json(
    {
      success: response.ok,
      face_service_url: FACE_RECOGNITION_URL,
      health_url: healthUrl,
      status: response.status,
      body: response.body,
      error: response.ok ? undefined : response.error,
    },
    { status: response.ok ? 200 : 503 },
  );
}

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);
  const image = normalizeBase64Image(typeof payload?.image === "string" ? payload.image : "");

  if (!image) {
    return Response.json(
      {
        success: false,
        error: "No image provided",
        detections: [],
      },
      { status: 400 },
    );
  }

  try {
    const targetUrl = `${FACE_RECOGNITION_URL}/inference/detect-base64`;
    const response = await fetchFaceRecognition(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image }),
      cache: "no-store",
    });

    if (!response.ok) {
      return Response.json(
        {
          success: false,
          error: response.error ?? `Face recognition service returned HTTP ${response.status}`,
          detections: [],
          target_url: targetUrl,
          upstream_status: response.status,
          upstream_body: response.body,
        },
        { status: response.status === null ? 503 : 502 },
      );
    }

    const data = response.body as FaceRecognitionResponse | null;

    return Response.json(
      data ?? {
        success: false,
        error: "Face recognition service returned an unreadable response",
        detections: [],
      },
      { status: 200 },
    );
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Face recognition service is unreachable",
        detections: [],
      },
      { status: 503 },
    );
  }
}

async function fetchFaceRecognition(url: string, init: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getTimeoutMs());

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });
    const text = await response.text();
    const body = parseBody(text);

    return {
      ok: response.ok,
      status: response.status,
      body,
      error: response.ok ? undefined : formatUpstreamError(response.status, body),
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      body: null,
      error: error instanceof Error && error.name === "AbortError"
        ? `Face recognition request timed out after ${Math.round(getTimeoutMs() / 1000)} seconds`
        : error instanceof Error
          ? error.message
          : "Face recognition service is unreachable",
    };
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeBase64Image(value: string) {
  return value.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "");
}

function parseBody(text: string) {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function formatUpstreamError(status: number, body: unknown) {
  if (!body) {
    return `Face recognition service returned HTTP ${status}`;
  }

  if (typeof body === "string") {
    return `Face recognition service returned HTTP ${status}: ${body.slice(0, 200)}`;
  }

  if (typeof body === "object" && body !== null && "detail" in body) {
    const detail = (body as { detail?: unknown }).detail;
    return `Face recognition service returned HTTP ${status}: ${String(detail)}`;
  }

  if (typeof body === "object" && body !== null && "error" in body) {
    const error = (body as { error?: unknown }).error;
    return `Face recognition service returned HTTP ${status}: ${String(error)}`;
  }

  return `Face recognition service returned HTTP ${status}: ${JSON.stringify(body).slice(0, 200)}`;
}

function getTimeoutMs() {
  return Number.isFinite(FACE_RECOGNITION_TIMEOUT_MS) && FACE_RECOGNITION_TIMEOUT_MS > 0
    ? FACE_RECOGNITION_TIMEOUT_MS
    : 15000;
}
