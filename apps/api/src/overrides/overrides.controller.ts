import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import {
  createOverrideSchema,
  overridesListQuerySchema,
  type CreateOverrideInput,
  type OverridesListQueryInput,
} from "@gatekeeper/shared-validation";

import { CurrentUser } from "../common/auth/current-user.decorator";
import type { AuthUser } from "../common/auth/auth-user.interface";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { Roles } from "../common/auth/roles.decorator";
import { RolesGuard } from "../common/auth/roles.guard";
import { successResponse } from "../common/http/api-response";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { OverridesService } from "./overrides.service";

@Controller("overrides")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("lecturer", "admin")
export class OverridesController {
  constructor(private readonly overridesService: OverridesService) {}

  @Post()
  async create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createOverrideSchema))
    payload: CreateOverrideInput,
  ) {
    const data = await this.overridesService.create(user, payload);
    return successResponse(data);
  }

  @Get()
  async list(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(overridesListQuerySchema))
    query: OverridesListQueryInput,
  ) {
    const result = await this.overridesService.list(user, query);
    return successResponse(result.data, result.meta);
  }
}
