import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import {
  loginSchema,
  registerSchema,
  refreshTokenSchema,
  type LoginInput,
  type RegisterInput,
  type RefreshTokenInput,
} from "@gatekeeper/shared-validation";

import { CurrentUser } from "../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { Roles } from "../common/auth/roles.decorator";
import { RolesGuard } from "../common/auth/roles.guard";
import type { AuthUser } from "../common/auth/auth-user.interface";
import { successResponse } from "../common/http/api-response";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  async login(
    @Body(new ZodValidationPipe(loginSchema))
    payload: LoginInput,
  ) {
    const data = await this.authService.login(payload);
    return successResponse(data);
  }

  @Post("register")
  async register(
    @Body(new ZodValidationPipe(registerSchema))
    payload: RegisterInput,
  ) {
    const data = await this.authService.register(payload);
    return successResponse(data);
  }

  @Post("refresh")
  async refresh(
    @Body(new ZodValidationPipe(refreshTokenSchema))
    payload: RefreshTokenInput,
  ) {
    const data = await this.authService.refresh(payload);
    return successResponse(data);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("student", "admin", "lecturer")
  async me(@CurrentUser() user: AuthUser) {
    const data = await this.authService.getSessionUser(user.userId);
    return successResponse(data);
  }
}
