import { BadRequestException, Injectable } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import type {
  CreateStudentInput,
  StudentsListQueryInput,
  UpdateStudentInput,
} from "@gatekeeper/shared-validation";

import { mapPrismaError } from "../common/database/prisma-error";
import { assertFound, buildContainsSearchFilter } from "../common/database/query-helpers";
import {
  fromStudentStatus,
  toStudentStatus,
} from "../common/database/prisma-enum-mappers";
import { buildPaginationMeta, getPaginationParams } from "../common/http/pagination";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: StudentsListQueryInput) {
    const { skip, take, page, limit } = getPaginationParams(query);
    const where = {
      ...(query.status ? { status: toStudentStatus(query.status) } : {}),
      ...buildContainsSearchFilter(query.search, ["nim", "fullName"]),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.student.findMany({
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
      this.prisma.student.count({ where }),
    ]);

    return {
      data: items.map(mapStudent),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async getById(id: string) {
    const student = await this.prisma.student.findUnique({
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
    return mapStudent(assertFound(student, "Student"));
  }

  async create(payload: CreateStudentInput) {
    try {
      await assertStudentUserLink(this.prisma, payload.user_id);
      const student = await this.prisma.student.create({
        data: {
          nim: payload.nim,
          fullName: payload.full_name,
          status: toStudentStatus(payload.status),
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

      return mapStudent(student);
    } catch (error) {
      mapPrismaError(error, "Student");
    }
  }

  async update(id: string, payload: UpdateStudentInput) {
    try {
      await assertStudentUserLink(this.prisma, payload.user_id);
      const student = await this.prisma.student.update({
        where: { id },
        data: {
          ...(payload.nim !== undefined ? { nim: payload.nim } : {}),
          ...(payload.full_name !== undefined
            ? { fullName: payload.full_name }
            : {}),
          ...(payload.status !== undefined
            ? { status: toStudentStatus(payload.status) }
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

      return mapStudent(student);
    } catch (error) {
      mapPrismaError(error, "Student");
    }
  }

  async remove(id: string) {
    try {
      const student = await this.prisma.student.update({
        where: { id },
        data: { status: toStudentStatus("inactive") },
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

      return mapStudent(student);
    } catch (error) {
      mapPrismaError(error, "Student");
    }
  }
}

async function assertStudentUserLink(
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
      message: "Referenced user for Student is invalid",
    });
  }

  if (user.role !== UserRole.STUDENT) {
    throw new BadRequestException({
      code: "invalid_relation",
      message: "Student profile can only be linked to a student account",
    });
  }
}

function mapStudent(student: {
  id: string;
  userId: string | null;
  nim: string;
  fullName: string;
  status: Parameters<typeof fromStudentStatus>[0];
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
    id: student.id,
    user_id: student.userId,
    nim: student.nim,
    full_name: student.fullName,
    status: fromStudentStatus(student.status),
    user: student.user
      ? {
          id: student.user.id,
          email: student.user.email,
          role: student.user.role.toLowerCase(),
          status: student.user.status.toLowerCase(),
        }
      : null,
    created_at: student.createdAt.toISOString(),
    updated_at: student.updatedAt.toISOString(),
  };
}
