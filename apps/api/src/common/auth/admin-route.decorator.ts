import { applyDecorators, UseGuards } from "@nestjs/common";

import { JwtAuthGuard } from "./jwt-auth.guard";
import { Roles } from "./roles.decorator";
import { RolesGuard } from "./roles.guard";

export function AdminRoute() {
  return applyDecorators(UseGuards(JwtAuthGuard, RolesGuard), Roles("admin"));
}
