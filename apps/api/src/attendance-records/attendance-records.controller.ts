import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import {
  attendanceRecordsListQuerySchema,
  updateAttendanceRecordSchema,
  uuidParamSchema,
  type AttendanceRecordsListQueryInput,
  type UpdateAttendanceRecordInput,
  type UuidParamInput,
} from "@gatekeeper/shared-validation";

import { CurrentUser } from "../common/auth/current-user.decorator";
import type { AuthUser } from "../common/auth/auth-user.interface";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { Roles } from "../common/auth/roles.decorator";
import { RolesGuard } from "../common/auth/roles.guard";
import { successResponse } from "../common/http/api-response";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { AttendanceRecordsService } from "./attendance-records.service";

@Controller("attendance-records")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceRecordsController {
  constructor(private readonly attendanceRecordsService: AttendanceRecordsService) {}

  @Get()
  @Roles("student", "lecturer", "admin")
  async list(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(attendanceRecordsListQuerySchema))
    query: AttendanceRecordsListQueryInput,
  ) {
    const result = await this.attendanceRecordsService.list(user, query);
    return successResponse(result.data, result.meta);
  }

  @Get(":id")
  @Roles("student", "lecturer", "admin")
  async getById(
    @CurrentUser() user: AuthUser,
    @Param(new ZodValidationPipe(uuidParamSchema))
    params: UuidParamInput,
  ) {
    const data = await this.attendanceRecordsService.getById(user, params.id);
    return successResponse(data);
  }

  @Patch(":id")
  @Roles("admin", "system")
  async update(
    @Param(new ZodValidationPipe(uuidParamSchema))
    params: UuidParamInput,
    @Body(new ZodValidationPipe(updateAttendanceRecordSchema))
    payload: UpdateAttendanceRecordInput,
  ) {
    const data = await this.attendanceRecordsService.update(params.id, payload);
    return successResponse(data);
  }

  @Post(":id/recalculate")
  @Roles("admin", "system")
  async recalculate(
    @Param(new ZodValidationPipe(uuidParamSchema))
    params: UuidParamInput,
  ) {
    const data = await this.attendanceRecordsService.recalculate(params.id);
    return successResponse(data);
  }
}
