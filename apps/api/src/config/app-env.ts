import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { config as loadDotenv } from "dotenv";
import { ZodError } from "zod";

import { parseApiEnv } from "@gatekeeper/shared-config";

const envCandidates = [
  resolve(process.cwd(), ".env"),
  resolve(process.cwd(), "../../.env"),
];

const envPath = envCandidates.find((candidate) => existsSync(candidate));

if (envPath) {
  loadDotenv({ path: envPath });
}

export const loadedEnvPath = envPath ?? null;

export const appEnv = parseEnvOrThrow();

function parseEnvOrThrow() {
  try {
    return parseApiEnv(process.env);
  } catch (error) {
    if (error instanceof ZodError) {
      const invalidKeys = error.issues.map((issue) => issue.path.join(".")).join(", ");
      const message = [
        "API environment is invalid.",
        `Missing or invalid keys: ${invalidKeys}.`,
        `Loaded env file: ${loadedEnvPath ?? "none"}.`,
        `Checked paths: ${envCandidates.join(", ")}.`,
      ].join(" ");

      throw new Error(message);
    }

    throw error;
  }
}
