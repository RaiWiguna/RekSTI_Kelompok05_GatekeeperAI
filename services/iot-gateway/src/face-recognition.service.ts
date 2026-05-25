import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import axios from "axios";

interface ClassScore {
  class: string;
  confidence: number;
}

interface FaceRecognitionResult {
  identified_person: string;
  confidence: number;
  all_classes: ClassScore[];
}

interface InferenceResponse {
  success: boolean;
  result?: FaceRecognitionResult;
  detections?: any[];  // Fallback for old format
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

  /**
   * Check if a person is detected in the image with high confidence
   * @param imageBase64 Base64 encoded image
   * @param confidenceThreshold Minimum confidence threshold (default 0.7)
   * @returns boolean indicating if a person is detected
   */
  async isPersonDetected(imageBase64: string, confidenceThreshold = 0.7): Promise<boolean> {
    try {
      const result = await this.detectFaceFromBase64(imageBase64);
      if (!result.success || !result.result) {
        return false;
      }
      return result.result.confidence > confidenceThreshold;
    } catch (error) {
      console.error("Error checking person detection:", error);
      return false;
    }
  }

  /**
   * Get the identified person and their confidence
   * @param imageBase64 Base64 encoded image
   * @returns Identified person name and confidence, or null if not detected
   */
  async getIdentifiedPerson(imageBase64: string): Promise<{ person: string; confidence: number } | null> {
    try {
      const result = await this.detectFaceFromBase64(imageBase64);
      if (!result.success || !result.result) {
        return null;
      }
      return {
        person: result.result.identified_person,
        confidence: result.result.confidence,
      };
    } catch (error) {
      console.error("Error getting identified person:", error);
      return null;
    }
  }

  /**
   * Get all class predictions and their confidence scores
   * @param imageBase64 Base64 encoded image
   * @returns Array of all classes with their confidence scores
   */
  async getAllClassPredictions(imageBase64: string): Promise<ClassScore[]> {
    try {
      const result = await this.detectFaceFromBase64(imageBase64);
      if (!result.success || !result.result) {
        return [];
      }
      // Sort by confidence (descending)
      return result.result.all_classes.sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      console.error("Error getting class predictions:", error);
      return [];
    }
  }

  /**
   * Get the highest confidence detection (for backward compatibility)
   * @deprecated Use getIdentifiedPerson instead
   */
  async getHighestConfidenceClass(
    imageBase64: string,
  ): Promise<ClassScore | null> {
    try {
      const result = await this.detectFaceFromBase64(imageBase64);
      if (!result.success || !result.result) {
        return null;
      }
      return {
        class: result.result.identified_person,
        confidence: result.result.confidence,
      };
    } catch (error) {
      console.error("Error getting highest confidence class:", error);
      return null;
    }
  }
}

