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
  classesListQuerySchema,
  createClassSchema,
  updateClassSchema,
  uuidParamSchema,
  type ClassesListQueryInput,
  type CreateClassInput,
  type UpdateClassInput,
  type UuidParamInput,
} from "@gatekeeper/shared-validation";

import { AdminRoute } from "../common/auth/admin-route.decorator";
import { successResponse } from "../common/http/api-response";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { ClassesService } from "./classes.service";

@Controller("classes")
@AdminRoute()
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Get()
  async list(
    @Query(new ZodValidationPipe(classesListQuerySchema))
    query: ClassesListQueryInput,
  ) {
    const result = await this.classesService.list(query);
    return successResponse(result.data, result.meta);
  }

  @Get(":id")
  async getById(
    @Param(new ZodValidationPipe(uuidParamSchema))
    params: UuidParamInput,
  ) {
    const data = await this.classesService.getById(params.id);
    return successResponse(data);
  }

  @Post()
  async create(
    @Body(new ZodValidationPipe(createClassSchema))
    payload: CreateClassInput,
  ) {
    const data = await this.classesService.create(payload);
    return successResponse(data);
  }

  @Patch(":id")
  async update(
    @Param(new ZodValidationPipe(uuidParamSchema))
    params: UuidParamInput,
    @Body(new ZodValidationPipe(updateClassSchema))
    payload: UpdateClassInput,
  ) {
    const data = await this.classesService.update(params.id, payload);
    return successResponse(data);
  }

  @Delete(":id")
  async remove(
    @Param(new ZodValidationPipe(uuidParamSchema))
    params: UuidParamInput,
  ) {
    const data = await this.classesService.remove(params.id);
    return successResponse(data);
  }
}
