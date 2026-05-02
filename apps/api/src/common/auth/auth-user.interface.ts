import type { UserRole } from "@gatekeeper/shared-types";

export interface AuthUser {
  userId: string;
  email: string;
  name: string;
  role: Extract<UserRole, "admin" | "lecturer">;
}
