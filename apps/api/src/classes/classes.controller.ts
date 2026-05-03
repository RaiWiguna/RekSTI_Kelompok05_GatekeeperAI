import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
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

import { CurrentUser } from "../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { Roles } from "../common/auth/roles.decorator";
import { RolesGuard } from "../common/auth/roles.guard";
import type { AuthUser } from "../common/auth/auth-user.interface";
import { AdminRoute } from "../common/auth/admin-route.decorator";
import { successResponse } from "../common/http/api-response";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { ClassesService } from "./classes.service";
import { MeService } from "../me/me.service";

@Controller("classes")
export class ClassesController {
  constructor(
    private readonly classesService: ClassesService,
    private readonly meService: MeService,
  ) {}

  @Get()
  @AdminRoute()
  async list(
    @Query(new ZodValidationPipe(classesListQuerySchema))
    query: ClassesListQueryInput,
  ) {
    const result = await this.classesService.list(query);
    return successResponse(result.data, result.meta);
  }

  @Get(":id")
  @AdminRoute()
  async getById(
    @Param(new ZodValidationPipe(uuidParamSchema))
    params: UuidParamInput,
  ) {
    const data = await this.classesService.getById(params.id);
    return successResponse(data);
  }

  @Get(":id/roster")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("lecturer", "admin")
  async getRoster(
    @Param(new ZodValidationPipe(uuidParamSchema))
    params: UuidParamInput,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.meService.getClassRosterForUser(params.id, user);
    return successResponse(data);
  }

  @Post()
  @AdminRoute()
  async create(
    @Body(new ZodValidationPipe(createClassSchema))
    payload: CreateClassInput,
  ) {
    const data = await this.classesService.create(payload);
    return successResponse(data);
  }

  @Patch(":id")
  @AdminRoute()
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
  @AdminRoute()
  async remove(
    @Param(new ZodValidationPipe(uuidParamSchema))
    params: UuidParamInput,
  ) {
    const data = await this.classesService.remove(params.id);
    return successResponse(data);
  }
}
