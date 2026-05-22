import { Injectable, UnauthorizedException, ConflictException, Logger } from "@nestjs/common";
import { UserRole, UserStatus } from "@prisma/client";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import type { LoginInput, RegisterInput, RefreshTokenInput } from "@gatekeeper/shared-validation";

import { appEnv } from "../config/app-env";
import { PrismaService } from "../database/prisma.service";
import type { AuthUser } from "../common/auth/auth-user.interface";
import type { AuthTokenPayload } from "./auth.types";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(input: LoginInput) {
    const normalizedEmail = input.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        accountName: true,
        role: true,
        status: true,
        passwordHash: true,
      },
    });

    if (!user) {
      this.logLoginFailure({
        email: normalizedEmail,
        reason: "user_not_found",
      });
      throw authFailureException("auth_user_not_found", "Akun anda belum terdaftar.");
    }

    if (user.status !== UserStatus.ACTIVE) {
      this.logLoginFailure({
        email: normalizedEmail,
        userId: user.id,
        reason: "inactive_user",
      });
      throw authFailureException("auth_user_inactive", "Akun anda belum aktif. Hubungi admin.");
    }

    if (!isInteractiveUserRole(user.role)) {
      this.logLoginFailure({
        email: normalizedEmail,
        userId: user.id,
        reason: "role_not_allowed",
      });
      throw authFailureException("auth_role_not_allowed", "Role akun tidak diizinkan untuk login aplikasi.");
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, input.password);

    if (!isPasswordValid) {
      this.logLoginFailure({
        email: normalizedEmail,
        userId: user.id,
        reason: "invalid_password",
      });
      throw authFailureException("auth_invalid_password", "Password yang dimasukkan salah.");
    }

    const authUser = mapUserToAuthUser(user);
    const tokens = await this.issueTokens(authUser);
    this.logger.log(
      JSON.stringify({
        action: "login_success",
        userId: authUser.userId,
        role: authUser.role,
        email: maskEmail(authUser.email),
      }),
    );

    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      user: {
        id: authUser.userId,
        account_name: authUser.accountName,
        role: authUser.role,
      },
    };
  }

  async register(input: RegisterInput) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new ConflictException("Email already registered");
    }

    // Hash password
    const passwordHash = await argon2.hash(input.password);

    // Create new user with STUDENT role
    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        accountName: input.account_name,
        passwordHash,
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
      },
      select: {
        id: true,
        email: true,
        accountName: true,
        role: true,
        status: true,
      },
    });

    const authUser = mapUserToAuthUser(user);
    const tokens = await this.issueTokens(authUser);

    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      user: {
        id: authUser.userId,
        account_name: authUser.accountName,
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
        accountName: true,
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
        account_name: authUser.accountName,
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
        accountName: true,
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
      account_name: user.accountName,
      role: normalizeUserRole(user.role),
    };
  }

  private async issueTokens(user: AuthUser) {
    const accessPayload: AuthTokenPayload = {
      sub: user.userId,
      email: user.email,
      account_name: user.accountName,
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

  private logLoginFailure(params: {
    email: string;
    reason: "user_not_found" | "inactive_user" | "role_not_allowed" | "invalid_password";
    userId?: string;
  }) {
    this.logger.warn(
      JSON.stringify({
        action: "login_failed",
        reason: params.reason,
        email: maskEmail(params.email),
        userId: params.userId ?? null,
      }),
    );
  }
}

function mapUserToAuthUser(user: {
  id: string;
  email: string;
  accountName: string;
  role: UserRole;
}) {
  return {
    userId: user.id,
    email: user.email,
    accountName: user.accountName,
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

function authFailureException(code: string, message: string) {
  return new UnauthorizedException({
    code,
    message,
  });
}

function invalidRefreshException() {
  return new UnauthorizedException({
    code: "invalid_auth",
    message: "Invalid refresh token",
  });
}

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!name || !domain) {
    return "***";
  }

  if (name.length <= 2) {
    return `${name[0] ?? "*"}*@${domain}`;
  }

  return `${name.slice(0, 2)}***@${domain}`;
}
