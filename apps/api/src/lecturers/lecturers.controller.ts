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
  createLecturerSchema,
  lecturersListQuerySchema,
  updateLecturerSchema,
  uuidParamSchema,
  type CreateLecturerInput,
  type LecturersListQueryInput,
  type UpdateLecturerInput,
  type UuidParamInput,
} from "@gatekeeper/shared-validation";

import { AdminRoute } from "../common/auth/admin-route.decorator";
import { successResponse } from "../common/http/api-response";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { LecturersService } from "./lecturers.service";

@Controller("lecturers")
@AdminRoute()
export class LecturersController {
  constructor(private readonly lecturersService: LecturersService) {}

  @Get()
  async list(
    @Query(new ZodValidationPipe(lecturersListQuerySchema))
    query: LecturersListQueryInput,
  ) {
    const result = await this.lecturersService.list(query);
    return successResponse(result.data, result.meta);
  }

  @Get(":id")
  async getById(
    @Param(new ZodValidationPipe(uuidParamSchema))
    params: UuidParamInput,
  ) {
    const data = await this.lecturersService.getById(params.id);
    return successResponse(data);
  }

  @Post()
  async create(
    @Body(new ZodValidationPipe(createLecturerSchema))
    payload: CreateLecturerInput,
  ) {
    const data = await this.lecturersService.create(payload);
    return successResponse(data);
  }

  @Patch(":id")
  async update(
    @Param(new ZodValidationPipe(uuidParamSchema))
    params: UuidParamInput,
    @Body(new ZodValidationPipe(updateLecturerSchema))
    payload: UpdateLecturerInput,
  ) {
    const data = await this.lecturersService.update(params.id, payload);
    return successResponse(data);
  }

  @Delete(":id")
  async remove(
    @Param(new ZodValidationPipe(uuidParamSchema))
    params: UuidParamInput,
  ) {
    const data = await this.lecturersService.remove(params.id);
    return successResponse(data);
  }
}
