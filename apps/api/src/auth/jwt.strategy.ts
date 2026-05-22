import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

import { appEnv } from "../config/app-env";
import type { AuthUser } from "../common/auth/auth-user.interface";
import type { AuthTokenPayload } from "./auth.types";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: appEnv.JWT_SECRET,
    });
  }

  validate(payload: AuthTokenPayload): AuthUser {
    if (payload.type !== "access") {
      throw new UnauthorizedException({
        code: "invalid_auth",
        message: "Invalid access token",
      });
    }

    return {
      userId: payload.sub,
      email: payload.email,
      accountName: payload.account_name,
      role: payload.role,
    };
  }
}
