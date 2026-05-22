import { Injectable } from "@nestjs/common";
import type {
  ClassesListQueryInput,
  CreateClassInput,
  UpdateClassInput,
} from "@gatekeeper/shared-validation";

import { mapPrismaError } from "../common/database/prisma-error";
import { assertFound } from "../common/database/query-helpers";
import { buildPaginationMeta, getPaginationParams } from "../common/http/pagination";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class ClassesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ClassesListQueryInput) {
    const { skip, take, page, limit } = getPaginationParams(query);
    const where = {
      ...(query.semester ? { semester: query.semester } : {}),
      ...(query.academic_year ? { academicYear: query.academic_year } : {}),
      ...(query.room_id ? { roomId: query.room_id } : {}),
      ...(query.lecturer_id ? { lecturerId: query.lecturer_id } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.class.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          course: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          lecturer: {
            select: {
              id: true,
              nidn: true,
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
          _count: {
            select: {
              schedules: true,
              enrollments: true,
            },
          },
        },
      }),
      this.prisma.class.count({ where }),
    ]);

    return {
      data: items.map(mapClass),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async getById(id: string) {
    const classItem = await this.prisma.class.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        lecturer: {
          select: {
            id: true,
            nidn: true,
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
        _count: {
          select: {
            schedules: true,
            enrollments: true,
          },
        },
      },
    });

    return mapClass(assertFound(classItem, "Class"));
  }

  async create(payload: CreateClassInput) {
    try {
      const classItem = await this.prisma.class.create({
        data: {
          courseId: payload.course_id,
          lecturerId: payload.lecturer_id,
          roomId: payload.room_id,
          classCode: payload.class_code,
          semester: payload.semester,
          academicYear: payload.academic_year,
        },
        include: {
          course: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          lecturer: {
            select: {
              id: true,
              nidn: true,
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
          _count: {
            select: {
              schedules: true,
              enrollments: true,
            },
          },
        },
      });

      return mapClass(classItem);
    } catch (error) {
      mapPrismaError(error, "Class");
    }
  }

  async update(id: string, payload: UpdateClassInput) {
    try {
      const classItem = await this.prisma.class.update({
        where: { id },
        data: {
          ...(payload.course_id !== undefined ? { courseId: payload.course_id } : {}),
          ...(payload.lecturer_id !== undefined ? { lecturerId: payload.lecturer_id } : {}),
          ...(payload.room_id !== undefined ? { roomId: payload.room_id } : {}),
          ...(payload.class_code !== undefined ? { classCode: payload.class_code } : {}),
          ...(payload.semester !== undefined ? { semester: payload.semester } : {}),
          ...(payload.academic_year !== undefined
            ? { academicYear: payload.academic_year }
            : {}),
        },
        include: {
          course: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          lecturer: {
            select: {
              id: true,
              nidn: true,
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
          _count: {
            select: {
              schedules: true,
              enrollments: true,
            },
          },
        },
      });

      return mapClass(classItem);
    } catch (error) {
      mapPrismaError(error, "Class");
    }
  }

  async remove(id: string) {
    try {
      const classItem = await this.prisma.class.delete({
        where: { id },
        include: {
          course: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          lecturer: {
            select: {
              id: true,
              nidn: true,
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
          _count: {
            select: {
              schedules: true,
              enrollments: true,
            },
          },
        },
      });

      return mapClass(classItem);
    } catch (error) {
      mapPrismaError(error, "Class");
    }
  }
}

function mapClass(classItem: {
  id: string;
  courseId: string;
  lecturerId: string;
  roomId: string;
  classCode: string;
  semester: string;
  academicYear: string;
  createdAt: Date;
  updatedAt: Date;
  course: {
    id: string;
    code: string;
    name: string;
  };
  lecturer: {
    id: string;
    nidn: string;
    fullName: string;
  };
  room: {
    id: string;
    code: string;
    name: string;
  };
  _count: {
    schedules: number;
    enrollments: number;
  };
}) {
  return {
    id: classItem.id,
    course_id: classItem.courseId,
    lecturer_id: classItem.lecturerId,
    room_id: classItem.roomId,
    class_code: classItem.classCode,
    semester: classItem.semester,
    academic_year: classItem.academicYear,
    course: classItem.course,
    lecturer: {
      id: classItem.lecturer.id,
      nidn: classItem.lecturer.nidn,
      full_name: classItem.lecturer.fullName,
    },
    room: classItem.room,
    schedules_count: classItem._count.schedules,
    enrollments_count: classItem._count.enrollments,
    created_at: classItem.createdAt.toISOString(),
    updated_at: classItem.updatedAt.toISOString(),
  };
}
