import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

import { appEnv } from "../config/app-env";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      datasources: {
        db: {
          url: appEnv.DATABASE_URL,
        },
      },
      log: appEnv.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log(`Connected to database at ${describeDatabaseTarget(appEnv.DATABASE_URL)}.`);
    } catch (error) {
      this.logger.error(
        `Failed to connect to database at ${describeDatabaseTarget(appEnv.DATABASE_URL)}.`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

function describeDatabaseTarget(databaseUrl: string) {
  try {
    const parsed = new URL(databaseUrl);
    return `${parsed.hostname}:${parsed.port || "(default)"}${parsed.pathname}`;
  } catch {
    return "[invalid DATABASE_URL]";
  }
}
