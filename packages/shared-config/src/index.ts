import { z } from "zod";

export const envSchema = z.object({
  API_PORT: z.string().default("3001"),
  IOT_GATEWAY_PORT: z.string().default("3002"),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
});

