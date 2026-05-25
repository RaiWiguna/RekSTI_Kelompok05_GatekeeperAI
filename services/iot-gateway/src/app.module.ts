import { Module } from "@nestjs/common";

import { GatewayController } from "./gateway.controller";
import { GatewayHealthController } from "./health.controller";
import { DetectionController } from "./detection.controller";
import { SerialService } from "./serial.service";
import { FaceRecognitionService } from "./face-recognition.service";

@Module({
  controllers: [GatewayHealthController, GatewayController, DetectionController],
  providers: [SerialService, FaceRecognitionService],
})
export class AppModule {}
