import { ForbiddenException, Injectable } from "@nestjs/common";
import type { AttendanceRecordsListQueryInput } from "@gatekeeper/shared-validation";

import type { AuthUser } from "../common/auth/auth-user.interface";
import { formatDateOnly } from "../common/date/calendar";
import { assertFound } from "../common/database/query-helpers";
import {
  fromAttendanceSource,
  fromAttendanceStatus,
  toAttendanceSource,
  toAttendanceStatus,
} from "../common/database/prisma-enum-mappers";
import { buildPaginationMeta, getPaginationParams } from "../common/http/pagination";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class AttendanceRecordsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(user: AuthUser, query: AttendanceRecordsListQueryInput) {
    const { skip, take, page, limit } = getPaginationParams(query);
    const scopedWhere = await this.buildScopedWhere(user);
    const where = {
      ...scopedWhere,
      ...(query.student_id ? { studentId: query.student_id } : {}),
      ...(query.class_id ? { classId: query.class_id } : {}),
      ...(query.room_id ? { roomId: query.room_id } : {}),
      ...(query.status ? { status: toAttendanceStatus(query.status) } : {}),
      ...(query.source ? { source: toAttendanceSource(query.source) } : {}),
      ...(query.date_from || query.date_to
        ? {
            occurrenceDate: {
              ...(query.date_from ? { gte: new Date(query.date_from) } : {}),
              ...(query.date_to ? { lte: new Date(query.date_to) } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.attendanceRecord.findMany({
        where,
        skip,
        take,
        orderBy: { updatedAt: "desc" },
        include: attendanceRecordInclude,
      }),
      this.prisma.attendanceRecord.count({ where }),
    ]);

    return {
      data: items.map(mapAttendanceRecord),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async getById(user: AuthUser, id: string) {
    const scopedWhere = await this.buildScopedWhere(user);
    const record = await this.prisma.attendanceRecord.findFirst({
      where: {
        id,
        ...scopedWhere,
      },
      include: attendanceRecordInclude,
    });

    return mapAttendanceRecord(assertFound(record, "Attendance record"));
  }

  async recalculate(id: string) {
    const record = await this.prisma.attendanceRecord.findUnique({
      where: { id },
      include: attendanceRecordInclude,
    });

    return {
      ...mapAttendanceRecord(assertFound(record, "Attendance record")),
      recalculated: true,
    };
  }

  private async buildScopedWhere(user: AuthUser) {
    if (user.role === "admin" || user.role === "system") {
      return {};
    }

    if (user.role === "student") {
      const student = await this.prisma.student.findFirst({
        where: { userId: user.userId },
        select: { id: true },
      });

      if (!student) {
        throw new ForbiddenException({
          code: "forbidden_role",
          message: "Student profile is not linked to this account",
        });
      }

      return { studentId: student.id };
    }

    if (user.role === "lecturer") {
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
        class: {
          lecturerId: lecturer.id,
        },
      };
    }

    throw new ForbiddenException({
      code: "forbidden_role",
      message: "You do not have permission to access attendance records",
    });
  }
}

const attendanceRecordInclude = {
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
      course: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
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

function mapAttendanceRecord(record: {
  id: string;
  studentId: string;
  classId: string;
  scheduleId: string | null;
  occurrenceDate: Date;
  roomId: string | null;
  status: Parameters<typeof fromAttendanceStatus>[0];
  source: Parameters<typeof fromAttendanceSource>[0];
  checkInAt: Date | null;
  checkOutAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  student?: {
    id: string;
    nim: string;
    fullName: string;
  };
  class?: {
    id: string;
    classCode: string;
    course: {
      id: string;
      code: string;
      name: string;
    };
  };
  room?: {
    id: string;
    code: string;
    name: string;
  } | null;
}) {
  return {
    id: record.id,
    student_id: record.studentId,
    class_id: record.classId,
    schedule_id: record.scheduleId,
    occurrence_date: formatDateOnly(record.occurrenceDate),
    room_id: record.roomId,
    status: fromAttendanceStatus(record.status),
    source: fromAttendanceSource(record.source),
    check_in_at: record.checkInAt?.toISOString() ?? null,
    check_out_at: record.checkOutAt?.toISOString() ?? null,
    student: record.student
      ? {
          id: record.student.id,
          nim: record.student.nim,
          full_name: record.student.fullName,
        }
      : null,
    class: record.class
      ? {
          id: record.class.id,
          class_code: record.class.classCode,
          course: record.class.course,
        }
      : null,
    room: record.room ?? null,
    created_at: record.createdAt.toISOString(),
    updated_at: record.updatedAt.toISOString(),
  };
}
