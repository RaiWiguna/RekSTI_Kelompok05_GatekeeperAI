import { z } from "zod";

export const runtimeEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.string().default("3001"),
  IOT_GATEWAY_PORT: z.string().default("3002"),
  WEB_PORT: z.string().default("3000"),
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:3000,http://127.0.0.1:3000"),
});

export const databaseEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
});

export const authEnvSchema = z.object({
  JWT_SECRET: z.string().min(8),
  JWT_REFRESH_SECRET: z.string().min(8),
});

export const integrationEnvSchema = z.object({
  REDIS_URL: z.string().min(1).default("redis://localhost:56379"),
  SIX_SYNC_CRON: z.string().min(1).default("0 0 * * *"),
  FACE_SERVICE_URL: z.string().url().default("http://localhost:8000"),
  IOT_GATEWAY_BASE_URL: z.string().url().default("http://localhost:3002/v1"),
  IOT_GATEWAY_REQUEST_TIMEOUT_MS: z.string().default("5000"),
});

export const apiEnvSchema = runtimeEnvSchema
  .merge(databaseEnvSchema)
  .merge(authEnvSchema)
  .merge(integrationEnvSchema);

export type AppEnv = z.infer<typeof apiEnvSchema>;

export function parseApiEnv(input: Record<string, string | undefined>) {
  return apiEnvSchema.parse(input);
}

export function parseEnv(input: Record<string, string | undefined>) {
  return parseApiEnv(input);
}
