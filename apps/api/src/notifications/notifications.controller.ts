import { Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import {
  notificationsListQuerySchema,
  uuidParamSchema,
  type NotificationsListQueryInput,
  type UuidParamInput,
} from "@gatekeeper/shared-validation";

import { CurrentUser } from "../common/auth/current-user.decorator";
import type { AuthUser } from "../common/auth/auth-user.interface";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { Roles } from "../common/auth/roles.decorator";
import { RolesGuard } from "../common/auth/roles.guard";
import { successResponse } from "../common/http/api-response";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { NotificationsService } from "./notifications.service";

@Controller("notifications")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("lecturer", "admin")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async list(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(notificationsListQuerySchema))
    query: NotificationsListQueryInput,
  ) {
    const result = await this.notificationsService.list(user, query);
    return successResponse(result.data, result.meta);
  }

  @Post(":id/read")
  async markAsRead(
    @CurrentUser() user: AuthUser,
    @Param(new ZodValidationPipe(uuidParamSchema))
    params: UuidParamInput,
  ) {
    const data = await this.notificationsService.markAsRead(user, params.id);
    return successResponse(data);
  }
}
