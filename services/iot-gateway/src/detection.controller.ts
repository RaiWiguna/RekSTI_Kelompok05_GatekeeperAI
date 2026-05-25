import { Controller, Post, Body, HttpException, HttpStatus } from "@nestjs/common";
import { FaceRecognitionService } from "./face-recognition.service";
import { SerialService } from "./serial.service";

interface DetectionRequest {
  image: string; // base64 encoded image
  auto_unlock?: boolean; // if true, automatically unlock if face detected
}

@Controller("detection")
export class DetectionController {
  constructor(
    private readonly faceRecognition: FaceRecognitionService,
    private readonly serial: SerialService,
  ) {}

  @Post("detect")
  async detect(@Body() request: DetectionRequest) {
    if (!request.image) {
      throw new HttpException(
        { ok: false, error: "No image provided" },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const detection = await this.faceRecognition.detectFaceFromBase64(
        request.image,
      );

      // If auto_unlock is enabled and face is detected with high confidence
      if (request.auto_unlock) {
        const isDetected = detection.detections.some(
          (d) => d.class === "face_detected" && d.confidence > 0.7,
        );

        if (isDetected) {
          try {
            this.serial.sendUnlock();
            return {
              ok: true,
              detection: detection,
              action: "unlocked",
            };
          } catch (unlockError) {
            console.error("Unlock command failed:", unlockError);
            return {
              ok: true,
              detection: detection,
              action: "detection_only",
              error: "Unlock command failed",
            };
          }
        }
      }

      return {
        ok: true,
        detection: detection,
      };
    } catch (error) {
      throw new HttpException(
        {
          ok: false,
          error: "Detection failed",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post("health")
  async health() {
    const faceRecognitionOk = await this.faceRecognition.healthCheck();
    const serialOk = this.serial.isConnected();

    return {
      ok: faceRecognitionOk && serialOk,
      face_recognition: faceRecognitionOk ? "ok" : "error",
      serial: serialOk ? "ok" : "disconnected",
    };
  }
}
