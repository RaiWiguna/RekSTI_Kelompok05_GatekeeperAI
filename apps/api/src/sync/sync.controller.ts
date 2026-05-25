import { Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import {
  syncRunIdParamSchema,
  type SyncRunIdParamInput,
} from "@gatekeeper/shared-validation";

import { CurrentUser } from "../common/auth/current-user.decorator";
import type { AuthUser } from "../common/auth/auth-user.interface";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { Roles } from "../common/auth/roles.decorator";
import { RolesGuard } from "../common/auth/roles.guard";
import { successResponse } from "../common/http/api-response";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { SyncService } from "./sync.service";

@Controller("sync")
@UseGuards(JwtAuthGuard, RolesGuard)
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post("six/run")
  @Roles("admin", "system")
  async runSixSync(@CurrentUser() user: AuthUser) {
    const data = await this.syncService.runSixSync(user);
    return successResponse(data);
  }

  @Get("six/status/:sync_run_id")
  @Roles("admin", "system")
  async getSixSyncStatus(
    @Param(new ZodValidationPipe(syncRunIdParamSchema))
    params: SyncRunIdParamInput,
  ) {
    const data = await this.syncService.getSixSyncStatus(params.sync_run_id);
    return successResponse(data);
  }
}
