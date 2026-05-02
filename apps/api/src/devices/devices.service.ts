import { Injectable } from "@nestjs/common";
import type {
  CreateDeviceInput,
  DevicesListQueryInput,
  UpdateDeviceInput,
} from "@gatekeeper/shared-validation";

import { mapPrismaError } from "../common/database/prisma-error";
import { assertFound, buildContainsSearchFilter } from "../common/database/query-helpers";
import {
  fromDeviceStatus,
  toDeviceStatus,
} from "../common/database/prisma-enum-mappers";
import { buildPaginationMeta, getPaginationParams } from "../common/http/pagination";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class DevicesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: DevicesListQueryInput) {
    const { skip, take, page, limit } = getPaginationParams(query);
    const where = {
      ...(query.room_id ? { roomId: query.room_id } : {}),
      ...(query.status ? { status: toDeviceStatus(query.status) } : {}),
      ...buildContainsSearchFilter(query.search, ["deviceCode", "deviceType"]),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.device.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          room: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.device.count({ where }),
    ]);

    return {
      data: items.map(mapDevice),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async getById(id: string) {
    const device = await this.prisma.device.findUnique({
      where: { id },
      include: {
        room: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    return mapDevice(assertFound(device, "Device"));
  }

  async create(payload: CreateDeviceInput) {
    try {
      const device = await this.prisma.device.create({
        data: {
          roomId: payload.room_id,
          deviceCode: payload.device_code,
          deviceType: payload.device_type,
          status: toDeviceStatus(payload.status),
        },
        include: {
          room: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      });

      return mapDevice(device);
    } catch (error) {
      mapPrismaError(error, "Device");
    }
  }

  async update(id: string, payload: UpdateDeviceInput) {
    try {
      const device = await this.prisma.device.update({
        where: { id },
        data: {
          ...(payload.room_id !== undefined ? { roomId: payload.room_id } : {}),
          ...(payload.device_code !== undefined ? { deviceCode: payload.device_code } : {}),
          ...(payload.device_type !== undefined ? { deviceType: payload.device_type } : {}),
          ...(payload.status !== undefined ? { status: toDeviceStatus(payload.status) } : {}),
        },
        include: {
          room: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      });

      return mapDevice(device);
    } catch (error) {
      mapPrismaError(error, "Device");
    }
  }

  async remove(id: string) {
    try {
      const device = await this.prisma.device.delete({
        where: { id },
        include: {
          room: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      });

      return mapDevice(device);
    } catch (error) {
      mapPrismaError(error, "Device");
    }
  }
}

function mapDevice(device: {
  id: string;
  roomId: string;
  deviceCode: string;
  deviceType: string;
  status: Parameters<typeof fromDeviceStatus>[0];
  lastSeenAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  room?: {
    id: string;
    code: string;
    name: string;
  };
}) {
  return {
    id: device.id,
    room_id: device.roomId,
    device_code: device.deviceCode,
    device_type: device.deviceType,
    status: fromDeviceStatus(device.status),
    room: device.room
      ? {
          id: device.room.id,
          code: device.room.code,
          name: device.room.name,
        }
      : null,
    last_seen_at: device.lastSeenAt?.toISOString() ?? null,
    created_at: device.createdAt.toISOString(),
    updated_at: device.updatedAt.toISOString(),
  };
}
