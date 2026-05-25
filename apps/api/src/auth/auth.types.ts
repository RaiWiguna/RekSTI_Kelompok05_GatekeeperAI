import type { UserRole } from "@gatekeeper/shared-types";

export interface AuthTokenPayload {
  sub: string;
  email: string;
  account_name: string;
  role: UserRole;
  type: "access" | "refresh";
}
