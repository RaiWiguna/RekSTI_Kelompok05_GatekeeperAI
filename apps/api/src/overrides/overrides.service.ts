import { ForbiddenException, Injectable, Logger } from "@nestjs/common";
import { OverrideStatus } from "@prisma/client";
import type { CreateOverrideInput, OverridesListQueryInput } from "@gatekeeper/shared-validation";

import type { AuthUser } from "../common/auth/auth-user.interface";
import { mapPrismaError } from "../common/database/prisma-error";
import {
  fromOverrideAction,
  fromOverrideStatus,
  toOverrideAction,
} from "../common/database/prisma-enum-mappers";
import { buildPaginationMeta, getPaginationParams } from "../common/http/pagination";
import { diagnoseIotGateway, dispatchIotGatewayCommand } from "../common/http/iot-gateway-client";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class OverridesService {
  private readonly logger = new Logger(OverridesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(user: AuthUser, payload: CreateOverrideInput) {
    await this.assertCanOverrideRoom(user, payload.room_id);
    const room = await this.prisma.room.findUnique({
      where: { id: payload.room_id },
      include: {
        devices: {
          orderBy: { createdAt: "asc" },
          take: 1,
        },
      },
    });
    const action = toOverrideAction(payload.action);
    const dispatchResult = await dispatchIotGatewayCommand(payload.action);
    this.logger.log(
      JSON.stringify({
        action: "iot_override_dispatch",
        overrideAction: payload.action,
        roomId: payload.room_id,
        ok: dispatchResult.ok,
        url: dispatchResult.url,
        error: dispatchResult.error,
      }),
    );

    try {
      const override = await this.prisma.overrideLog.create({
        data: {
          userId: user.userId,
          roomId: payload.room_id,
          action,
          reason: buildOverrideReason(payload.reason, {
            gatewayStatus: dispatchResult.ok ? "sent" : "failed",
            gatewayUrl: dispatchResult.url,
            gatewayError: dispatchResult.error,
            roomCode: room?.code,
            deviceCode: room?.devices[0]?.deviceCode,
          }),
          status: dispatchResult.ok ? OverrideStatus.SENT : OverrideStatus.FAILED,
        },
        include: overrideInclude,
      });

      return {
        override_id: override.id,
        room_id: override.roomId,
        action: fromOverrideAction(override.action),
        status: fromOverrideStatus(override.status),
        iot_gateway: {
          ok: dispatchResult.ok,
          url: dispatchResult.url,
          message: dispatchResult.error ?? "Command sent to IoT gateway",
        },
      };
    } catch (error) {
      mapPrismaError(error, "Override");
    }
  }

  diagnoseGateway() {
    return diagnoseIotGateway();
  }

  async list(user: AuthUser, query: OverridesListQueryInput) {
    const { skip, take, page, limit } = getPaginationParams(query);
    const scopedWhere = await this.buildScopedWhere(user);
    const where = {
      ...scopedWhere,
      ...(query.room_id ? { roomId: query.room_id } : {}),
      ...(query.user_id ? { userId: query.user_id } : {}),
      ...(query.action ? { action: toOverrideAction(query.action) } : {}),
      ...(query.date_from || query.date_to
        ? {
            createdAt: {
              ...(query.date_from ? { gte: new Date(query.date_from) } : {}),
              ...(query.date_to ? { lte: new Date(query.date_to) } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.overrideLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: overrideInclude,
      }),
      this.prisma.overrideLog.count({ where }),
    ]);

    return {
      data: items.map(mapOverride),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  private async assertCanOverrideRoom(user: AuthUser, roomId: string) {
    if (user.role === "admin") {
      return;
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

    const classCount = await this.prisma.class.count({
      where: {
        lecturerId: lecturer.id,
        roomId,
      },
    });

    if (classCount === 0) {
      throw new ForbiddenException({
        code: "forbidden_role",
        message: "Lecturer can only override rooms used by their classes",
      });
    }
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
      room: {
        classes: {
          some: {
            lecturerId: lecturer.id,
          },
        },
      },
    };
  }
}

function buildOverrideReason(
  reason: string,
  metadata: {
    gatewayStatus: "sent" | "failed";
    gatewayUrl: string;
    gatewayError: string | null;
    roomCode?: string;
    deviceCode?: string;
  },
) {
  const suffix = [
    `iot_status=${metadata.gatewayStatus}`,
    `iot_url=${metadata.gatewayUrl}`,
    metadata.roomCode ? `room_code=${metadata.roomCode}` : null,
    metadata.deviceCode ? `device_code=${metadata.deviceCode}` : null,
    metadata.gatewayError ? `iot_error=${metadata.gatewayError}` : null,
  ].filter(Boolean).join("; ");

  return `${reason} [${suffix}]`.slice(0, 500);
}

const overrideInclude = {
  user: {
    select: {
      id: true,
      accountName: true,
      email: true,
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

function mapOverride(override: {
  id: string;
  userId: string;
  roomId: string;
  action: Parameters<typeof fromOverrideAction>[0];
  reason: string;
  status: Parameters<typeof fromOverrideStatus>[0];
  createdAt: Date;
  user?: {
    id: string;
    accountName: string;
    email: string;
  };
  room?: {
    id: string;
    code: string;
    name: string;
  };
}) {
  return {
    id: override.id,
    override_id: override.id,
    user_id: override.userId,
    room_id: override.roomId,
    action: fromOverrideAction(override.action),
    reason: override.reason,
    status: fromOverrideStatus(override.status),
    user: override.user
      ? {
          id: override.user.id,
          account_name: override.user.accountName,
          email: override.user.email,
        }
      : null,
    room: override.room ?? null,
    created_at: override.createdAt.toISOString(),
  };
}
