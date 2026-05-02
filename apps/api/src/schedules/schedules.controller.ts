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
  createScheduleSchema,
  schedulesListQuerySchema,
  updateScheduleSchema,
  uuidParamSchema,
  type CreateScheduleInput,
  type SchedulesListQueryInput,
  type UpdateScheduleInput,
  type UuidParamInput,
} from "@gatekeeper/shared-validation";

import { AdminRoute } from "../common/auth/admin-route.decorator";
import { successResponse } from "../common/http/api-response";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { SchedulesService } from "./schedules.service";

@Controller("schedules")
@AdminRoute()
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get()
  async list(
    @Query(new ZodValidationPipe(schedulesListQuerySchema))
    query: SchedulesListQueryInput,
  ) {
    const result = await this.schedulesService.list(query);
    return successResponse(result.data, result.meta);
  }

  @Get(":id")
  async getById(
    @Param(new ZodValidationPipe(uuidParamSchema))
    params: UuidParamInput,
  ) {
    const data = await this.schedulesService.getById(params.id);
    return successResponse(data);
  }

  @Post()
  async create(
    @Body(new ZodValidationPipe(createScheduleSchema))
    payload: CreateScheduleInput,
  ) {
    const data = await this.schedulesService.create(payload);
    return successResponse(data);
  }

  @Patch(":id")
  async update(
    @Param(new ZodValidationPipe(uuidParamSchema))
    params: UuidParamInput,
    @Body(new ZodValidationPipe(updateScheduleSchema))
    payload: UpdateScheduleInput,
  ) {
    const data = await this.schedulesService.update(params.id, payload);
    return successResponse(data);
  }

  @Delete(":id")
  async remove(
    @Param(new ZodValidationPipe(uuidParamSchema))
    params: UuidParamInput,
  ) {
    const data = await this.schedulesService.remove(params.id);
    return successResponse(data);
  }
}
