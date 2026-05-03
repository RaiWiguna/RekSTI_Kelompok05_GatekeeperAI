import { Injectable, UnauthorizedException } from "@nestjs/common";
import { UserRole, UserStatus } from "@prisma/client";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import type { LoginInput, RefreshTokenInput } from "@gatekeeper/shared-validation";

import { appEnv } from "../config/app-env";
import { PrismaService } from "../database/prisma.service";
import type { AuthUser } from "../common/auth/auth-user.interface";
import type { AuthTokenPayload } from "./auth.types";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(input: LoginInput) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        passwordHash: true,
      },
    });

    if (!user || user.status !== UserStatus.ACTIVE || !isInteractiveUserRole(user.role)) {
      throw invalidAuthException();
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, input.password);

    if (!isPasswordValid) {
      throw invalidAuthException();
    }

    const authUser = mapUserToAuthUser(user);
    const tokens = await this.issueTokens(authUser);

    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      user: {
        id: authUser.userId,
        name: authUser.name,
        role: authUser.role,
      },
    };
  }

  async refresh(input: RefreshTokenInput) {
    let payload: AuthTokenPayload;

    try {
      payload = await this.jwtService.verifyAsync<AuthTokenPayload>(input.refresh_token, {
        secret: appEnv.JWT_REFRESH_SECRET,
      });
    } catch {
      throw invalidRefreshException();
    }

    if (payload.type !== "refresh") {
      throw invalidRefreshException();
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
      },
    });

    if (!user || user.status !== UserStatus.ACTIVE || !isInteractiveUserRole(user.role)) {
      throw invalidAuthException();
    }

    const authUser = mapUserToAuthUser(user);
    const tokens = await this.issueTokens(authUser);

    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      user: {
        id: authUser.userId,
        name: authUser.name,
        role: authUser.role,
      },
    };
  }

  async getSessionUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
      },
    });

    if (!user || user.status !== UserStatus.ACTIVE || !isInteractiveUserRole(user.role)) {
      throw invalidAuthException();
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: normalizeUserRole(user.role),
    };
  }

  private async issueTokens(user: AuthUser) {
    const accessPayload: AuthTokenPayload = {
      sub: user.userId,
      email: user.email,
      name: user.name,
      role: user.role,
      type: "access",
    };
    const refreshPayload: AuthTokenPayload = {
      ...accessPayload,
      type: "refresh",
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: appEnv.JWT_SECRET,
        expiresIn: "15m",
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: appEnv.JWT_REFRESH_SECRET,
        expiresIn: "7d",
      }),
    ]);

    return { accessToken, refreshToken };
  }
}

function mapUserToAuthUser(user: {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}) {
  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: normalizeUserRole(user.role),
  } satisfies AuthUser;
}

function isInteractiveUserRole(role: UserRole) {
  return role === UserRole.STUDENT || role === UserRole.ADMIN || role === UserRole.LECTURER;
}

function normalizeUserRole(role: UserRole) {
  return role.toLowerCase() as Extract<AuthUser["role"], "student" | "admin" | "lecturer">;
}

function invalidAuthException() {
  return new UnauthorizedException({
    code: "invalid_auth",
    message: "Invalid email or password",
  });
}

function invalidRefreshException() {
  return new UnauthorizedException({
    code: "invalid_auth",
    message: "Invalid refresh token",
  });
}
