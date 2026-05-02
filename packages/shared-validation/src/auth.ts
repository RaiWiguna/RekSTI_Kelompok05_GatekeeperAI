import { z } from "zod";

import { activeInactiveStatusSchema } from "./common";

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1),
});

export const createUserSchema = z.object({
  role: z.enum(["admin", "lecturer"]),
  name: z.string().trim().min(3).max(120),
  email: z.string().trim().email(),
  password: z.string().min(8).max(72),
  status: activeInactiveStatusSchema.default("active"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
