import { Injectable } from "@nestjs/common";
import { SyncResult, SyncType } from "@prisma/client";
import { randomUUID } from "node:crypto";

import type { AuthUser } from "../common/auth/auth-user.interface";
import { assertFound } from "../common/database/query-helpers";
import {
  fromSyncResult,
  fromSyncType,
} from "../common/database/prisma-enum-mappers";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class SyncService {
  constructor(private readonly prisma: PrismaService) {}

  async runSixSync(user: AuthUser) {
    const syncLog = await this.prisma.syncLog.create({
      data: {
        syncRunId: randomUUID(),
        userId: user.userId,
        syncType: SyncType.SIX_SCHEDULE,
        source: "six",
        target: "api",
        result: SyncResult.QUEUED,
      },
    });

    return {
      sync_run_id: syncLog.syncRunId,
      status: fromSyncResult(syncLog.result),
    };
  }

  async getSixSyncStatus(syncRunId: string) {
    const syncLog = await this.prisma.syncLog.findUnique({
      where: { syncRunId },
    });

    return mapSyncLog(assertFound(syncLog, "Sync log"));
  }
}

function mapSyncLog(syncLog: {
  syncRunId: string;
  syncType: Parameters<typeof fromSyncType>[0];
  result: Parameters<typeof fromSyncResult>[0];
  startedAt: Date;
  finishedAt: Date | null;
  totalReceived: number;
  totalInserted: number;
  totalUpdated: number;
  totalDuplicate: number;
  totalRejected: number;
  errorSummary: string | null;
}) {
  return {
    sync_run_id: syncLog.syncRunId,
    sync_type: fromSyncType(syncLog.syncType),
    result: fromSyncResult(syncLog.result),
    started_at: syncLog.startedAt.toISOString(),
    finished_at: syncLog.finishedAt?.toISOString() ?? null,
    total_received: syncLog.totalReceived,
    total_inserted: syncLog.totalInserted,
    total_updated: syncLog.totalUpdated,
    total_duplicate: syncLog.totalDuplicate,
    total_rejected: syncLog.totalRejected,
    error_summary: syncLog.errorSummary,
  };
}
