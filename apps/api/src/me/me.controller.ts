import { Body, Controller, Get, Patch, Query, UseGuards } from "@nestjs/common";
import {
  todayViewQuerySchema,
  updateUserAccountSchema,
  type TodayViewQueryInput,
  type UpdateUserAccountInput,
} from "@gatekeeper/shared-validation";

import { CurrentUser } from "../common/auth/current-user.decorator";
import type { AuthUser } from "../common/auth/auth-user.interface";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { Roles } from "../common/auth/roles.decorator";
import { RolesGuard } from "../common/auth/roles.guard";
import { successResponse } from "../common/http/api-response";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { MeService } from "./me.service";

@Controller("me")
@UseGuards(JwtAuthGuard, RolesGuard)
export class MeController {
  constructor(private readonly meService: MeService) {}

  @Get("schedules/today")
  @Roles("student")
  async getStudentTodaySchedules(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(todayViewQuerySchema))
    query: TodayViewQueryInput,
  ) {
    const data = await this.meService.getStudentTodaySchedules(user, query);
    return successResponse(data);
  }

  @Get("classes/today")
  @Roles("lecturer")
  async getLecturerTodayClasses(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(todayViewQuerySchema))
    query: TodayViewQueryInput,
  ) {
    const data = await this.meService.getLecturerTodayClasses(user, query);
    return successResponse(data);
  }

  @Get("classes")
  @Roles("lecturer")
  async getLecturerClasses(@CurrentUser() user: AuthUser) {
    const data = await this.meService.getLecturerClasses(user);
    return successResponse(data);
  }

  @Patch("profile")
  @Roles("student", "lecturer", "admin")
  async updateProfile(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(updateUserAccountSchema))
    payload: UpdateUserAccountInput,
  ) {
    const data = await this.meService.updateProfile(user, payload);
    return successResponse(data);
  }
}
