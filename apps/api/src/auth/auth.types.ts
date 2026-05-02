import type { UserRole } from "@gatekeeper/shared-types";

export interface AuthTokenPayload {
  sub: string;
  email: string;
  name: string;
  role: Extract<UserRole, "admin" | "lecturer">;
  type: "access" | "refresh";
}
