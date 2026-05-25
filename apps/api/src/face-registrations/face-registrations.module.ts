import { Module } from "@nestjs/common";

import { FaceRegistrationsController } from "./face-registrations.controller";
import { FaceRegistrationsService } from "./face-registrations.service";

@Module({
  controllers: [FaceRegistrationsController],
  providers: [FaceRegistrationsService],
})
export class FaceRegistrationsModule {}
