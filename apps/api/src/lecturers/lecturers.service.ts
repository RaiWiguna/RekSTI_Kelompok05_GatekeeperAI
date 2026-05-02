import { Injectable } from "@nestjs/common";
import type {
  CreateLecturerInput,
  LecturersListQueryInput,
  UpdateLecturerInput,
} from "@gatekeeper/shared-validation";

import { mapPrismaError } from "../common/database/prisma-error";
import { assertFound, buildContainsSearchFilter } from "../common/database/query-helpers";
import {
  fromLecturerStatus,
  toLecturerStatus,
} from "../common/database/prisma-enum-mappers";
import { buildPaginationMeta, getPaginationParams } from "../common/http/pagination";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class LecturersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: LecturersListQueryInput) {
    const { skip, take, page, limit } = getPaginationParams(query);
    const where = {
      ...(query.status ? { status: toLecturerStatus(query.status) } : {}),
      ...buildContainsSearchFilter(query.search, ["nidn", "name"]),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.lecturer.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.lecturer.count({ where }),
    ]);

    return {
      data: items.map(mapLecturer),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async getById(id: string) {
    const lecturer = await this.prisma.lecturer.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            status: true,
          },
        },
      },
    });

    return mapLecturer(assertFound(lecturer, "Lecturer"));
  }

  async create(payload: CreateLecturerInput) {
    try {
      const lecturer = await this.prisma.lecturer.create({
        data: {
          nidn: payload.nidn,
          name: payload.name,
          status: toLecturerStatus(payload.status),
          ...(payload.user_id ? { userId: payload.user_id } : {}),
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              status: true,
            },
          },
        },
      });

      return mapLecturer(lecturer);
    } catch (error) {
      mapPrismaError(error, "Lecturer");
    }
  }

  async update(id: string, payload: UpdateLecturerInput) {
    try {
      const lecturer = await this.prisma.lecturer.update({
        where: { id },
        data: {
          ...(payload.nidn !== undefined ? { nidn: payload.nidn } : {}),
          ...(payload.name !== undefined ? { name: payload.name } : {}),
          ...(payload.status !== undefined
            ? { status: toLecturerStatus(payload.status) }
            : {}),
          ...(payload.user_id !== undefined ? { userId: payload.user_id } : {}),
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              status: true,
            },
          },
        },
      });

      return mapLecturer(lecturer);
    } catch (error) {
      mapPrismaError(error, "Lecturer");
    }
  }

  async remove(id: string) {
    try {
      const lecturer = await this.prisma.lecturer.update({
        where: { id },
        data: { status: toLecturerStatus("inactive") },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              status: true,
            },
          },
        },
      });

      return mapLecturer(lecturer);
    } catch (error) {
      mapPrismaError(error, "Lecturer");
    }
  }
}

function mapLecturer(lecturer: {
  id: string;
  userId: string | null;
  nidn: string;
  name: string;
  status: Parameters<typeof fromLecturerStatus>[0];
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    email: string;
    role: string;
    status: string;
  } | null;
}) {
  return {
    id: lecturer.id,
    user_id: lecturer.userId,
    nidn: lecturer.nidn,
    name: lecturer.name,
    status: fromLecturerStatus(lecturer.status),
    user: lecturer.user
      ? {
          id: lecturer.user.id,
          email: lecturer.user.email,
          role: lecturer.user.role.toLowerCase(),
          status: lecturer.user.status.toLowerCase(),
        }
      : null,
    created_at: lecturer.createdAt.toISOString(),
    updated_at: lecturer.updatedAt.toISOString(),
  };
}
