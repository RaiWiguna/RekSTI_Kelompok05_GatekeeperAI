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
  createStudentSchema,
  studentsListQuerySchema,
  updateStudentSchema,
  uuidParamSchema,
  type CreateStudentInput,
  type StudentsListQueryInput,
  type UpdateStudentInput,
  type UuidParamInput,
} from "@gatekeeper/shared-validation";

import { AdminRoute } from "../common/auth/admin-route.decorator";
import { successResponse } from "../common/http/api-response";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { StudentsService } from "./students.service";

@Controller("students")
@AdminRoute()
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  async list(
    @Query(new ZodValidationPipe(studentsListQuerySchema))
    query: StudentsListQueryInput,
  ) {
    const result = await this.studentsService.list(query);
    return successResponse(result.data, result.meta);
  }

  @Get(":id")
  async getById(
    @Param(new ZodValidationPipe(uuidParamSchema))
    params: UuidParamInput,
  ) {
    const data = await this.studentsService.getById(params.id);
    return successResponse(data);
  }

  @Post()
  async create(
    @Body(new ZodValidationPipe(createStudentSchema))
    payload: CreateStudentInput,
  ) {
    const data = await this.studentsService.create(payload);
    return successResponse(data);
  }

  @Patch(":id")
  async update(
    @Param(new ZodValidationPipe(uuidParamSchema))
    params: UuidParamInput,
    @Body(new ZodValidationPipe(updateStudentSchema))
    payload: UpdateStudentInput,
  ) {
    const data = await this.studentsService.update(params.id, payload);
    return successResponse(data);
  }

  @Delete(":id")
  async remove(
    @Param(new ZodValidationPipe(uuidParamSchema))
    params: UuidParamInput,
  ) {
    const data = await this.studentsService.remove(params.id);
    return successResponse(data);
  }
}
