import type { NextRequest } from "next/server";

const FACE_RECOGNITION_URL =
  process.env.FACE_RECOGNITION_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

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

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);
  const image = typeof payload?.image === "string" ? payload.image : "";

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
    const response = await fetch(`${FACE_RECOGNITION_URL}/inference/detect-base64`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image }),
      cache: "no-store",
    });
    const data = (await response.json().catch(() => null)) as FaceRecognitionResponse | null;

    return Response.json(
      data ?? {
        success: false,
        error: "Face recognition service returned an unreadable response",
        detections: [],
      },
      { status: response.status },
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
