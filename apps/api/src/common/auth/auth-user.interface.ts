import type { UserRole } from "@gatekeeper/shared-types";

export interface AuthUser {
  userId: string;
  email: string;
  accountName: string;
  role: UserRole;
}
