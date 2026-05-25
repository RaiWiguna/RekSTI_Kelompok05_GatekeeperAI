import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import {
  createFaceRegistrationSchema,
  faceRegistrationsListQuerySchema,
  type CreateFaceRegistrationInput,
  type FaceRegistrationsListQueryInput,
} from "@gatekeeper/shared-validation";

import { AdminRoute } from "../common/auth/admin-route.decorator";
import { successResponse } from "../common/http/api-response";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { FaceRegistrationsService } from "./face-registrations.service";

@Controller("face-registrations")
@AdminRoute()
export class FaceRegistrationsController {
  constructor(private readonly faceRegistrationsService: FaceRegistrationsService) {}

  @Post()
  async create(
    @Body(new ZodValidationPipe(createFaceRegistrationSchema))
    payload: CreateFaceRegistrationInput,
  ) {
    const data = await this.faceRegistrationsService.create(payload);
    return successResponse(data);
  }

  @Get()
  async list(
    @Query(new ZodValidationPipe(faceRegistrationsListQuerySchema))
    query: FaceRegistrationsListQueryInput,
  ) {
    const result = await this.faceRegistrationsService.list(query);
    return successResponse(result.data, result.meta);
  }
}
