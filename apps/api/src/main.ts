import "reflect-metadata";

import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";
import { ApiExceptionFilter } from "./common/filters/api-exception.filter";
import { appEnv, loadedEnvPath } from "./config/app-env";

const logger = new Logger("Bootstrap");

async function bootstrap() {
  const port = Number(appEnv.API_PORT);
  const corsOrigins = [
    "http://localhost:3000",
    `http://127.0.0.1:${appEnv.WEB_PORT}`,
    `http://localhost:${appEnv.WEB_PORT}`,
  ];

  try {
    const app = await NestFactory.create(AppModule);
    app.setGlobalPrefix("v1");
    app.enableCors({
      origin: corsOrigins,
      credentials: false,
    });
    app.useGlobalFilters(new ApiExceptionFilter());
    app.enableShutdownHooks();

    await listenWithRetry(app, port);

    logger.log(`API listening on http://localhost:${port}/v1`);
    logger.log(`CORS origins: ${corsOrigins.join(", ")}`);

    if (loadedEnvPath) {
      logger.log(`Environment loaded from ${loadedEnvPath}`);
    } else {
      logger.warn("No .env file was found in the expected API or repo-root locations.");
    }
  } catch (error) {
    logStartupError(error, port);
    throw error;
  }
}

void bootstrap().catch(() => {
  process.exit(1);
});

async function listenWithRetry(
  app: Awaited<ReturnType<typeof NestFactory.create>>,
  port: number,
) {
  const maxAttempts = 10;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await app.listen(port);
      return;
    } catch (error) {
      if (!isAddressInUseError(error) || attempt === maxAttempts) {
        throw error;
      }

      logger.warn(
        `Port ${port} is still busy during restart. Retrying (${attempt}/${maxAttempts})...`,
      );
      await delay(500);
    }
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function logStartupError(error: unknown, port: number) {
  if (isAddressInUseError(error)) {
    logger.error(
      `Port ${port} is already in use. Stop the previous API instance or change API_PORT in .env.`,
    );
    return;
  }

  if (isPrismaInitializationError(error)) {
    logger.error(
      "Prisma failed during startup. Check whether PostgreSQL is running and DATABASE_URL points to the correct host/port.",
      error instanceof Error ? error.stack : undefined,
    );
    return;
  }

  logger.error(
    "API bootstrap failed with an unexpected error.",
    error instanceof Error ? error.stack : undefined,
  );
}

function isAddressInUseError(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === "object" && error !== null && "code" in error && error.code === "EADDRINUSE";
}

function isPrismaInitializationError(error: unknown) {
  return error instanceof Error && error.name === "PrismaClientInitializationError";
}
