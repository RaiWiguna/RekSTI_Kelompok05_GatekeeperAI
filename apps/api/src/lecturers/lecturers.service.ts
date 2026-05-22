import { BadRequestException, Injectable } from "@nestjs/common";
import { UserRole } from "@prisma/client";
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
      ...buildContainsSearchFilter(query.search, ["nidn", "fullName"]),
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
      await assertLecturerUserLink(this.prisma, payload.user_id);
      const lecturer = await this.prisma.lecturer.create({
        data: {
          nidn: payload.nidn,
          fullName: payload.full_name,
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
      await assertLecturerUserLink(this.prisma, payload.user_id);
      const lecturer = await this.prisma.lecturer.update({
        where: { id },
        data: {
          ...(payload.nidn !== undefined ? { nidn: payload.nidn } : {}),
          ...(payload.full_name !== undefined
            ? { fullName: payload.full_name }
            : {}),
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

async function assertLecturerUserLink(
  prisma: PrismaService,
  userId: string | undefined,
) {
  if (!userId) {
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
    },
  });

  if (!user) {
    throw new BadRequestException({
      code: "invalid_relation",
      message: "Referenced user for Lecturer is invalid",
    });
  }

  if (user.role !== UserRole.LECTURER) {
    throw new BadRequestException({
      code: "invalid_relation",
      message: "Lecturer profile can only be linked to a lecturer account",
    });
  }
}

function mapLecturer(lecturer: {
  id: string;
  userId: string | null;
  nidn: string;
  fullName: string;
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
    full_name: lecturer.fullName,
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
