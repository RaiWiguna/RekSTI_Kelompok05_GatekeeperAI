import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import {
  accessLogsListQuerySchema,
  uuidParamSchema,
  type AccessLogsListQueryInput,
  type UuidParamInput,
} from "@gatekeeper/shared-validation";

import { CurrentUser } from "../common/auth/current-user.decorator";
import type { AuthUser } from "../common/auth/auth-user.interface";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { Roles } from "../common/auth/roles.decorator";
import { RolesGuard } from "../common/auth/roles.guard";
import { successResponse } from "../common/http/api-response";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { AccessLogsService } from "./access-logs.service";

@Controller("access-logs")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("lecturer", "admin")
export class AccessLogsController {
  constructor(private readonly accessLogsService: AccessLogsService) {}

  @Get()
  async list(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(accessLogsListQuerySchema))
    query: AccessLogsListQueryInput,
  ) {
    const result = await this.accessLogsService.list(user, query);
    return successResponse(result.data, result.meta);
  }

  @Get(":id")
  async getById(
    @CurrentUser() user: AuthUser,
    @Param(new ZodValidationPipe(uuidParamSchema))
    params: UuidParamInput,
  ) {
    const data = await this.accessLogsService.getById(user, params.id);
    return successResponse(data);
  }
}
