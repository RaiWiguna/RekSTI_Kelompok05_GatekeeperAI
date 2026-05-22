import { Injectable } from "@nestjs/common";
import type {
  CreateEnrollmentInput,
  EnrollmentsListQueryInput,
  UpdateEnrollmentInput,
} from "@gatekeeper/shared-validation";

import { mapPrismaError } from "../common/database/prisma-error";
import { assertFound } from "../common/database/query-helpers";
import {
  fromEnrollmentStatus,
  toEnrollmentStatus,
} from "../common/database/prisma-enum-mappers";
import { buildPaginationMeta, getPaginationParams } from "../common/http/pagination";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class EnrollmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: EnrollmentsListQueryInput) {
    const { skip, take, page, limit } = getPaginationParams(query);
    const where = {
      ...(query.student_id ? { studentId: query.student_id } : {}),
      ...(query.class_id ? { classId: query.class_id } : {}),
      ...(query.status ? { status: toEnrollmentStatus(query.status) } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.enrollment.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          student: {
            select: {
              id: true,
              nim: true,
              fullName: true,
            },
          },
          class: {
            select: {
              id: true,
              classCode: true,
              semester: true,
              academicYear: true,
            },
          },
        },
      }),
      this.prisma.enrollment.count({ where }),
    ]);

    return {
      data: items.map(mapEnrollment),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async getById(id: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            nim: true,
            fullName: true,
          },
        },
        class: {
          select: {
            id: true,
            classCode: true,
            semester: true,
            academicYear: true,
          },
        },
      },
    });

    return mapEnrollment(assertFound(enrollment, "Enrollment"));
  }

  async create(payload: CreateEnrollmentInput) {
    try {
      const enrollment = await this.prisma.enrollment.create({
        data: {
          studentId: payload.student_id,
          classId: payload.class_id,
          status: toEnrollmentStatus(payload.status),
        },
        include: {
          student: {
            select: {
              id: true,
              nim: true,
              fullName: true,
            },
          },
          class: {
            select: {
              id: true,
              classCode: true,
              semester: true,
              academicYear: true,
            },
          },
        },
      });

      return mapEnrollment(enrollment);
    } catch (error) {
      mapPrismaError(error, "Enrollment");
    }
  }

  async update(id: string, payload: UpdateEnrollmentInput) {
    try {
      const enrollment = await this.prisma.enrollment.update({
        where: { id },
        data: {
          ...(payload.student_id !== undefined ? { studentId: payload.student_id } : {}),
          ...(payload.class_id !== undefined ? { classId: payload.class_id } : {}),
          ...(payload.status !== undefined
            ? { status: toEnrollmentStatus(payload.status) }
            : {}),
        },
        include: {
          student: {
            select: {
              id: true,
              nim: true,
              fullName: true,
            },
          },
          class: {
            select: {
              id: true,
              classCode: true,
              semester: true,
              academicYear: true,
            },
          },
        },
      });

      return mapEnrollment(enrollment);
    } catch (error) {
      mapPrismaError(error, "Enrollment");
    }
  }

  async remove(id: string) {
    try {
      const enrollment = await this.prisma.enrollment.update({
        where: { id },
        data: { status: toEnrollmentStatus("inactive") },
        include: {
          student: {
            select: {
              id: true,
              nim: true,
              fullName: true,
            },
          },
          class: {
            select: {
              id: true,
              classCode: true,
              semester: true,
              academicYear: true,
            },
          },
        },
      });

      return mapEnrollment(enrollment);
    } catch (error) {
      mapPrismaError(error, "Enrollment");
    }
  }
}

function mapEnrollment(enrollment: {
  id: string;
  studentId: string;
  classId: string;
  status: Parameters<typeof fromEnrollmentStatus>[0];
  createdAt: Date;
  updatedAt: Date;
  student: {
    id: string;
    nim: string;
    fullName: string;
  };
  class: {
    id: string;
    classCode: string;
    semester: string;
    academicYear: string;
  };
}) {
  return {
    id: enrollment.id,
    student_id: enrollment.studentId,
    class_id: enrollment.classId,
    status: fromEnrollmentStatus(enrollment.status),
    student: {
      id: enrollment.student.id,
      nim: enrollment.student.nim,
      full_name: enrollment.student.fullName,
    },
    class: {
      id: enrollment.class.id,
      class_code: enrollment.class.classCode,
      semester: enrollment.class.semester,
      academic_year: enrollment.class.academicYear,
    },
    created_at: enrollment.createdAt.toISOString(),
    updated_at: enrollment.updatedAt.toISOString(),
  };
}
