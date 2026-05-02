import { Injectable } from "@nestjs/common";
import type {
  CreateRoomInput,
  RoomsListQueryInput,
  UpdateRoomInput,
} from "@gatekeeper/shared-validation";

import { mapPrismaError } from "../common/database/prisma-error";
import { assertFound, buildContainsSearchFilter } from "../common/database/query-helpers";
import { buildPaginationMeta, getPaginationParams } from "../common/http/pagination";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: RoomsListQueryInput) {
    const { skip, take, page, limit } = getPaginationParams(query);
    const where = {
      ...(query.building
        ? { building: { contains: query.building, mode: "insensitive" as const } }
        : {}),
      ...buildContainsSearchFilter(query.search, ["code", "name"]),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.room.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              classes: true,
              devices: true,
            },
          },
        },
      }),
      this.prisma.room.count({ where }),
    ]);

    return {
      data: items.map(mapRoom),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async getById(id: string) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            classes: true,
            devices: true,
          },
        },
      },
    });

    return mapRoom(assertFound(room, "Room"));
  }

  async create(payload: CreateRoomInput) {
    try {
      const room = await this.prisma.room.create({
        data: payload,
        include: {
          _count: {
            select: {
              classes: true,
              devices: true,
            },
          },
        },
      });

      return mapRoom(room);
    } catch (error) {
      mapPrismaError(error, "Room");
    }
  }

  async update(id: string, payload: UpdateRoomInput) {
    try {
      const room = await this.prisma.room.update({
        where: { id },
        data: payload,
        include: {
          _count: {
            select: {
              classes: true,
              devices: true,
            },
          },
        },
      });

      return mapRoom(room);
    } catch (error) {
      mapPrismaError(error, "Room");
    }
  }

  async remove(id: string) {
    try {
      const room = await this.prisma.room.delete({
        where: { id },
      });

      return mapRoom({
        ...room,
        _count: {
          classes: 0,
          devices: 0,
        },
      });
    } catch (error) {
      mapPrismaError(error, "Room");
    }
  }
}

function mapRoom(room: {
  id: string;
  code: string;
  name: string;
  building: string;
  floor: number;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    classes: number;
    devices: number;
  };
}) {
  return {
    id: room.id,
    code: room.code,
    name: room.name,
    building: room.building,
    floor: room.floor,
    classes_count: room._count.classes,
    devices_count: room._count.devices,
    created_at: room.createdAt.toISOString(),
    updated_at: room.updatedAt.toISOString(),
  };
}
