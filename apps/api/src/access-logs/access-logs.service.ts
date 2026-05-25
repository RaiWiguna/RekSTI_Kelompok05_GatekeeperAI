import { ForbiddenException, Injectable } from "@nestjs/common";
import type { AccessLogsListQueryInput } from "@gatekeeper/shared-validation";

import type { AuthUser } from "../common/auth/auth-user.interface";
import { assertFound } from "../common/database/query-helpers";
import {
  fromAccessEventType,
  fromAccessResult,
  fromLivenessResult,
  toAccessEventType,
  toAccessResult,
} from "../common/database/prisma-enum-mappers";
import { buildPaginationMeta, getPaginationParams } from "../common/http/pagination";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class AccessLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(user: AuthUser, query: AccessLogsListQueryInput) {
    const { skip, take, page, limit } = getPaginationParams(query);
    const scopedWhere = await this.buildScopedWhere(user);
    const where = {
      ...scopedWhere,
      ...(query.student_id ? { studentId: query.student_id } : {}),
      ...(query.device_id ? { deviceId: query.device_id } : {}),
      ...(query.room_id ? { roomId: query.room_id } : {}),
      ...(query.event_type ? { eventType: toAccessEventType(query.event_type) } : {}),
      ...(query.access_result ? { accessResult: toAccessResult(query.access_result) } : {}),
      ...(query.date_from || query.date_to
        ? {
            eventAt: {
              ...(query.date_from ? { gte: new Date(query.date_from) } : {}),
              ...(query.date_to ? { lte: new Date(query.date_to) } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.accessLog.findMany({
        where,
        skip,
        take,
        orderBy: { eventAt: "desc" },
        include: accessLogInclude,
      }),
      this.prisma.accessLog.count({ where }),
    ]);

    return {
      data: items.map(mapAccessLog),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async getById(user: AuthUser, id: string) {
    const scopedWhere = await this.buildScopedWhere(user);
    const log = await this.prisma.accessLog.findFirst({
      where: {
        id,
        ...scopedWhere,
      },
      include: accessLogInclude,
    });

    return mapAccessLog(assertFound(log, "Access log"));
  }

  private async buildScopedWhere(user: AuthUser) {
    if (user.role === "admin") {
      return {};
    }

    const lecturer = await this.prisma.lecturer.findFirst({
      where: { userId: user.userId },
      select: { id: true },
    });

    if (!lecturer) {
      throw new ForbiddenException({
        code: "forbidden_role",
        message: "Lecturer profile is not linked to this account",
      });
    }

    return {
      schedule: {
        class: {
          lecturerId: lecturer.id,
        },
      },
    };
  }
}

const accessLogInclude = {
  device: {
    select: {
      id: true,
      deviceCode: true,
    },
  },
  student: {
    select: {
      id: true,
      nim: true,
      fullName: true,
    },
  },
  room: {
    select: {
      id: true,
      code: true,
      name: true,
    },
  },
};

export function mapAccessLog(log: {
  id: string;
  eventId: string;
  deviceId: string | null;
  deviceCode: string | null;
  studentId: string | null;
  studentNim: string | null;
  roomId: string | null;
  roomCode: string | null;
  scheduleId: string | null;
  scheduleRef: string | null;
  eventType: Parameters<typeof fromAccessEventType>[0];
  accessResult: Parameters<typeof fromAccessResult>[0];
  livenessResult: Parameters<typeof fromLivenessResult>[0] | null;
  confidenceScore: number | null;
  gatewayId: string | null;
  syncVersion: number | null;
  isSynced: boolean;
  eventAt: Date;
  receivedAt: Date;
  device?: {
    id: string;
    deviceCode: string;
  } | null;
  student?: {
    id: string;
    nim: string;
    fullName: string;
  } | null;
  room?: {
    id: string;
    code: string;
    name: string;
  } | null;
}) {
  return {
    id: log.id,
    event_id: log.eventId,
    device_id: log.deviceId,
    device_code: log.device?.deviceCode ?? log.deviceCode,
    student_id: log.studentId,
    student_nim: log.student?.nim ?? log.studentNim,
    room_id: log.roomId,
    room_code: log.room?.code ?? log.roomCode,
    schedule_id: log.scheduleId,
    schedule_ref: log.scheduleRef,
    event_type: fromAccessEventType(log.eventType),
    access_result: fromAccessResult(log.accessResult),
    liveness_result: log.livenessResult ? fromLivenessResult(log.livenessResult) : null,
    confidence_score: log.confidenceScore,
    gateway_id: log.gatewayId,
    sync_version: log.syncVersion,
    is_synced: log.isSynced,
    event_at: log.eventAt.toISOString(),
    received_at: log.receivedAt.toISOString(),
  };
}
