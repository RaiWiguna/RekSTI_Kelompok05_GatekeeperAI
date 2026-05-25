import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import axios from "axios";

interface FaceDetectionResult {
  class: string;
  confidence: number;
  bbox?: number[];
}

interface InferenceResponse {
  success: boolean;
  detections: FaceDetectionResult[];
  timestamp?: string;
  error?: string;
}

@Injectable()
export class FaceRecognitionService {
  private readonly faceRecognitionUrl = 
    process.env.FACE_RECOGNITION_URL || "http://localhost:8000";
  private readonly faceRecognitionTimeout = 30000; // 30 seconds

  constructor() {
    console.log(
      `Face Recognition Service initialized with URL: ${this.faceRecognitionUrl}`,
    );
  }

  async detectFaceFromBase64(imageBase64: string): Promise<InferenceResponse> {
    try {
      const response = await axios.post<InferenceResponse>(
        `${this.faceRecognitionUrl}/inference/detect-base64`,
        {
          image: imageBase64,
        },
        {
          timeout: this.faceRecognitionTimeout,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      return response.data;
    } catch (error) {
      console.error("Face detection error:", error);
      throw new HttpException(
        {
          ok: false,
          error: "Face detection service error",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async detectFaceFromFile(fileBuffer: Buffer): Promise<InferenceResponse> {
    try {
      const formData = new FormData();
      const blob = new Blob([fileBuffer], { type: "image/jpeg" });
      formData.append("image", blob, "image.jpg");

      const response = await axios.post<InferenceResponse>(
        `${this.faceRecognitionUrl}/inference/detect`,
        formData,
        {
          timeout: this.faceRecognitionTimeout,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      return response.data;
    } catch (error) {
      console.error("Face detection error:", error);
      throw new HttpException(
        {
          ok: false,
          error: "Face detection service error",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.faceRecognitionUrl}/health`, {
        timeout: 5000,
      });
      return response.data.status === "ok";
    } catch (error) {
      console.error("Face recognition service health check failed:", error);
      return false;
    }
  }

  async isPersonDetected(imageBase64: string): Promise<boolean> {
    const result = await this.detectFaceFromBase64(imageBase64);
    if (!result.success) {
      return false;
    }

    return result.detections.some(
      (detection) => detection.class === "face_detected" && detection.confidence > 0.7,
    );
  }

  async getHighestConfidenceClass(
    imageBase64: string,
  ): Promise<FaceDetectionResult | null> {
    const result = await this.detectFaceFromBase64(imageBase64);
    if (!result.success || result.detections.length === 0) {
      return null;
    }

    return result.detections.reduce((prev, current) =>
      current.confidence > prev.confidence ? current : prev,
    );
  }
}
