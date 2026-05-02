import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import {
  createEnrollmentSchema,
  enrollmentsListQuerySchema,
  updateEnrollmentSchema,
  uuidParamSchema,
  type CreateEnrollmentInput,
  type EnrollmentsListQueryInput,
  type UpdateEnrollmentInput,
  type UuidParamInput,
} from "@gatekeeper/shared-validation";

import { AdminRoute } from "../common/auth/admin-route.decorator";
import { successResponse } from "../common/http/api-response";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { EnrollmentsService } from "./enrollments.service";

@Controller("enrollments")
@AdminRoute()
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Get()
  async list(
    @Query(new ZodValidationPipe(enrollmentsListQuerySchema))
    query: EnrollmentsListQueryInput,
  ) {
    const result = await this.enrollmentsService.list(query);
    return successResponse(result.data, result.meta);
  }

  @Get(":id")
  async getById(
    @Param(new ZodValidationPipe(uuidParamSchema))
    params: UuidParamInput,
  ) {
    const data = await this.enrollmentsService.getById(params.id);
    return successResponse(data);
  }

  @Post()
  async create(
    @Body(new ZodValidationPipe(createEnrollmentSchema))
    payload: CreateEnrollmentInput,
  ) {
    const data = await this.enrollmentsService.create(payload);
    return successResponse(data);
  }

  @Patch(":id")
  async update(
    @Param(new ZodValidationPipe(uuidParamSchema))
    params: UuidParamInput,
    @Body(new ZodValidationPipe(updateEnrollmentSchema))
    payload: UpdateEnrollmentInput,
  ) {
    const data = await this.enrollmentsService.update(params.id, payload);
    return successResponse(data);
  }

  @Delete(":id")
  async remove(
    @Param(new ZodValidationPipe(uuidParamSchema))
    params: UuidParamInput,
  ) {
    const data = await this.enrollmentsService.remove(params.id);
    return successResponse(data);
  }
}
