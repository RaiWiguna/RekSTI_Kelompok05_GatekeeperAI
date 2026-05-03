import {
  BadRequestException,
  ConflictException,
  Injectable,
} from "@nestjs/common";
import * as argon2 from "argon2";
import type { Prisma } from "@prisma/client";
import type {
  CreateUserAccountInput,
  UpdateUserAccountInput,
  UpdateUserPasswordInput,
  UsersListQueryInput,
} from "@gatekeeper/shared-validation";

import { mapPrismaError } from "../common/database/prisma-error";
import { assertFound } from "../common/database/query-helpers";
import {
  fromStudentStatus,
  fromLecturerStatus,
  fromUserRole,
  fromUserStatus,
  toUserRole,
  toUserStatus,
} from "../common/database/prisma-enum-mappers";
import { buildPaginationMeta, getPaginationParams } from "../common/http/pagination";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: UsersListQueryInput) {
    const { skip, take, page, limit } = getPaginationParams(query);
    const where = {
      ...(query.role ? { role: toUserRole(query.role) } : {}),
      ...(query.status ? { status: toUserStatus(query.status) } : {}),
      ...(query.student_id
        ? {
            studentProfile: {
              is: { id: query.student_id },
            },
          }
        : {}),
      ...(query.lecturer_id
        ? {
            lecturerProfile: {
              is: { id: query.lecturer_id },
            },
          }
        : {}),
      ...(query.linked === "linked"
        ? {
            OR: [
              {
                studentProfile: {
                  isNot: null,
                },
              },
              {
                lecturerProfile: {
                  isNot: null,
                },
              },
            ],
          }
        : {}),
      ...(query.linked === "unlinked"
        ? {
            studentProfile: {
              is: null,
            },
            lecturerProfile: {
              is: null,
            },
          }
        : {}),
      ...buildUserSearchFilter(query.search),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          studentProfile: {
            select: {
              id: true,
              nim: true,
              name: true,
              status: true,
            },
          },
          lecturerProfile: {
            select: {
              id: true,
              nidn: true,
              name: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: items.map(mapUserAccount),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async getById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        studentProfile: {
          select: {
            id: true,
            nim: true,
            name: true,
            status: true,
          },
        },
        lecturerProfile: {
          select: {
            id: true,
            nidn: true,
            name: true,
            status: true,
          },
        },
      },
    });

    return mapUserAccount(assertFound(user, "User"));
  }

  async create(payload: CreateUserAccountInput) {
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const passwordHash = await argon2.hash(payload.password);
        const user = await transaction.user.create({
          data: {
            role: toUserRole(payload.role),
            name: payload.name,
            email: payload.email,
            passwordHash,
            status: toUserStatus(payload.status),
          },
        });

        await syncLecturerLink(transaction, {
          userId: user.id,
          role: payload.role,
          currentStudentId: null,
          currentLecturerId: null,
          nextStudentId: payload.student_id ?? undefined,
          nextLecturerId: payload.lecturer_id ?? undefined,
        });

        const createdUser = await transaction.user.findUnique({
          where: { id: user.id },
          include: {
            studentProfile: {
              select: {
                id: true,
                nim: true,
                name: true,
                status: true,
              },
            },
            lecturerProfile: {
              select: {
                id: true,
                nidn: true,
                name: true,
                status: true,
              },
            },
          },
        });

        return mapUserAccount(assertFound(createdUser, "User"));
      });
    } catch (error) {
      mapPrismaError(error, "User");
    }
  }

  async update(id: string, payload: UpdateUserAccountInput) {
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const existing = await transaction.user.findUnique({
          where: { id },
          include: {
            studentProfile: {
              select: {
                id: true,
              },
            },
            lecturerProfile: {
              select: {
                id: true,
              },
            },
          },
        });

        const user = assertFound(existing, "User");
        const role = fromUserRole(user.role);

        await transaction.user.update({
          where: { id },
          data: {
            ...(payload.name !== undefined ? { name: payload.name } : {}),
            ...(payload.email !== undefined ? { email: payload.email } : {}),
            ...(payload.status !== undefined
              ? { status: toUserStatus(payload.status) }
              : {}),
          },
        });

        await syncLecturerLink(transaction, {
          userId: id,
          role,
          currentStudentId: user.studentProfile?.id ?? null,
          currentLecturerId: user.lecturerProfile?.id ?? null,
          nextStudentId: payload.student_id,
          nextLecturerId: payload.lecturer_id,
        });

        const updatedUser = await transaction.user.findUnique({
          where: { id },
          include: {
            studentProfile: {
              select: {
                id: true,
                nim: true,
                name: true,
                status: true,
              },
            },
            lecturerProfile: {
              select: {
                id: true,
                nidn: true,
                name: true,
                status: true,
              },
            },
          },
        });

        return mapUserAccount(assertFound(updatedUser, "User"));
      });
    } catch (error) {
      mapPrismaError(error, "User");
    }
  }

  async updatePassword(id: string, payload: UpdateUserPasswordInput) {
    try {
      const passwordHash = await argon2.hash(payload.password);
      const user = await this.prisma.user.update({
        where: { id },
        data: {
          passwordHash,
        },
        include: {
          studentProfile: {
            select: {
              id: true,
              nim: true,
              name: true,
              status: true,
            },
          },
          lecturerProfile: {
            select: {
              id: true,
              nidn: true,
              name: true,
              status: true,
            },
          },
        },
      });

      return mapUserAccount(user);
    } catch (error) {
      mapPrismaError(error, "User");
    }
  }

  async remove(id: string) {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: {
          status: toUserStatus("inactive"),
        },
        include: {
          studentProfile: {
            select: {
              id: true,
              nim: true,
              name: true,
              status: true,
            },
          },
          lecturerProfile: {
            select: {
              id: true,
              nidn: true,
              name: true,
              status: true,
            },
          },
        },
      });

      return mapUserAccount(user);
    } catch (error) {
      mapPrismaError(error, "User");
    }
  }
}

function buildUserSearchFilter(search: string | undefined) {
  if (!search) {
    return {};
  }

  return {
    OR: [
      {
        name: {
          contains: search,
          mode: "insensitive" as const,
        },
      },
      {
        email: {
          contains: search,
          mode: "insensitive" as const,
        },
      },
      {
        studentProfile: {
          is: {
            name: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
        },
      },
      {
        studentProfile: {
          is: {
            nim: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
        },
      },
      {
        lecturerProfile: {
          is: {
            name: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
        },
      },
      {
        lecturerProfile: {
          is: {
            nidn: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
        },
      },
    ],
  };
}

async function syncLecturerLink(
  transaction: Prisma.TransactionClient,
  input: {
    userId: string;
    role: "student" | "admin" | "lecturer" | "gateway" | "system";
    currentStudentId: string | null;
    currentLecturerId: string | null;
    nextStudentId: string | null | undefined;
    nextLecturerId: string | null | undefined;
  },
) {
  if (input.nextStudentId === undefined && input.nextLecturerId === undefined) {
    return;
  }

  if (input.nextStudentId && input.role !== "student") {
    throw new BadRequestException({
      code: "invalid_relation",
      message: "Only student accounts can be linked to student data",
    });
  }

  if (input.nextLecturerId && input.role !== "lecturer") {
    throw new BadRequestException({
      code: "invalid_relation",
      message: "Only lecturer accounts can be linked to lecturer data",
    });
  }

  if (input.nextStudentId && input.nextLecturerId) {
    throw new BadRequestException({
      code: "invalid_relation",
      message: "An account cannot be linked to student and lecturer data at the same time",
    });
  }

  if (
    input.currentStudentId &&
    input.currentStudentId !== input.nextStudentId
  ) {
    await transaction.student.update({
      where: { id: input.currentStudentId },
      data: { userId: null },
    });
  }

  if (
    input.currentLecturerId &&
    input.currentLecturerId !== input.nextLecturerId
  ) {
    await transaction.lecturer.update({
      where: { id: input.currentLecturerId },
      data: { userId: null },
    });
  }

  if (input.nextStudentId && input.nextStudentId !== input.currentStudentId) {
    const student = await transaction.student.findUnique({
      where: { id: input.nextStudentId },
      select: {
        id: true,
        name: true,
        userId: true,
      },
    });

    const linkedStudent = assertFound(student, "Student");
    if (linkedStudent.userId) {
      throw new ConflictException({
        code: "duplicate_record",
        message: `Student ${linkedStudent.name} is already linked to another account`,
      });
    }

    await transaction.student.update({
      where: { id: input.nextStudentId },
      data: { userId: input.userId },
    });
  }

  if (!input.nextLecturerId || input.nextLecturerId === input.currentLecturerId) {
    return;
  }

  const lecturer = await transaction.lecturer.findUnique({
    where: { id: input.nextLecturerId },
    select: {
      id: true,
      name: true,
      userId: true,
    },
  });

  const linkedLecturer = assertFound(lecturer, "Lecturer");
  if (linkedLecturer.userId && linkedLecturer.userId !== input.userId) {
    throw new ConflictException({
      code: "duplicate_record",
      message: `Lecturer ${linkedLecturer.name} is already linked to another account`,
    });
  }

  await transaction.lecturer.update({
    where: { id: input.nextLecturerId },
    data: { userId: input.userId },
  });
}

function mapUserAccount(user: {
  id: string;
  role: Parameters<typeof fromUserRole>[0];
  name: string;
  email: string;
  status: Parameters<typeof fromUserStatus>[0];
  createdAt: Date;
  updatedAt: Date;
  studentProfile?: {
    id: string;
    nim: string;
    name: string;
    status: Parameters<typeof fromStudentStatus>[0];
  } | null;
  lecturerProfile?: {
    id: string;
    nidn: string;
    name: string;
    status: Parameters<typeof fromLecturerStatus>[0];
  } | null;
}) {
  return {
    id: user.id,
    role: fromUserRole(user.role),
    name: user.name,
    email: user.email,
    status: fromUserStatus(user.status),
    student_id: user.studentProfile?.id ?? null,
    student: user.studentProfile
      ? {
          id: user.studentProfile.id,
          nim: user.studentProfile.nim,
          name: user.studentProfile.name,
          status: fromStudentStatus(user.studentProfile.status),
        }
      : null,
    lecturer_id: user.lecturerProfile?.id ?? null,
    lecturer: user.lecturerProfile
      ? {
          id: user.lecturerProfile.id,
          nidn: user.lecturerProfile.nidn,
          name: user.lecturerProfile.name,
          status: fromLecturerStatus(user.lecturerProfile.status),
        }
      : null,
    created_at: user.createdAt.toISOString(),
    updated_at: user.updatedAt.toISOString(),
  };
}
