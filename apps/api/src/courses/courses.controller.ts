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
  coursesListQuerySchema,
  createCourseSchema,
  updateCourseSchema,
  uuidParamSchema,
  type CoursesListQueryInput,
  type CreateCourseInput,
  type UpdateCourseInput,
  type UuidParamInput,
} from "@gatekeeper/shared-validation";

import { AdminRoute } from "../common/auth/admin-route.decorator";
import { successResponse } from "../common/http/api-response";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { CoursesService } from "./courses.service";

@Controller("courses")
@AdminRoute()
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  async list(
    @Query(new ZodValidationPipe(coursesListQuerySchema))
    query: CoursesListQueryInput,
  ) {
    const result = await this.coursesService.list(query);
    return successResponse(result.data, result.meta);
  }

  @Get(":id")
  async getById(
    @Param(new ZodValidationPipe(uuidParamSchema))
    params: UuidParamInput,
  ) {
    const data = await this.coursesService.getById(params.id);
    return successResponse(data);
  }

  @Post()
  async create(
    @Body(new ZodValidationPipe(createCourseSchema))
    payload: CreateCourseInput,
  ) {
    const data = await this.coursesService.create(payload);
    return successResponse(data);
  }

  @Patch(":id")
  async update(
    @Param(new ZodValidationPipe(uuidParamSchema))
    params: UuidParamInput,
    @Body(new ZodValidationPipe(updateCourseSchema))
    payload: UpdateCourseInput,
  ) {
    const data = await this.coursesService.update(params.id, payload);
    return successResponse(data);
  }

  @Delete(":id")
  async remove(
    @Param(new ZodValidationPipe(uuidParamSchema))
    params: UuidParamInput,
  ) {
    const data = await this.coursesService.remove(params.id);
    return successResponse(data);
  }
}
