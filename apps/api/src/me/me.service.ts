import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { AttendanceSource, AttendanceStatus, DayOfWeek, EnrollmentStatus } from "@prisma/client";
import type { CameraScanInput, UpdateUserAccountInput } from "@gatekeeper/shared-validation";
import type { TodayViewQueryInput } from "@gatekeeper/shared-validation";

import { getCurrentJakartaDate, combineDateAndTime } from "../common/date/calendar";
import { getDayOfWeekFromDate } from "../common/date/day-of-week";
import { formatTimeString } from "../common/date/time";
import { assertFound } from "../common/database/query-helpers";
import {
  fromDayOfWeek,
  fromScheduleSource,
  fromUserRole,
  toDayOfWeek,
} from "../common/database/prisma-enum-mappers";
import type { AuthUser } from "../common/auth/auth-user.interface";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class MeService {
  constructor(private readonly prisma: PrismaService) {}

  async getStudentTodaySchedules(user: AuthUser, query: TodayViewQueryInput) {
    const student = await this.prisma.student.findFirst({
      where: {
        userId: user.userId,
      },
      select: {
        id: true,
        fullName: true,
        nim: true,
      },
    });

    const linkedStudent = assertFound(student, "Student");
    const date = query.date ?? getCurrentJakartaDate();
    const dayOfWeek = toDayOfWeek(getDayOfWeekFromDate(date));

    const schedules = await this.prisma.schedule.findMany({
      where: {
        dayOfWeek,
        class: {
          enrollments: {
            some: {
              studentId: linkedStudent.id,
              status: EnrollmentStatus.ACTIVE,
            },
          },
        },
      },
      orderBy: [{ startTime: "asc" }, { endTime: "asc" }],
      include: {
        class: {
          select: {
            id: true,
            classCode: true,
            semester: true,
            academicYear: true,
            course: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
            room: {
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
          },
        },
      },
    });

    return schedules.map((schedule) => ({
      schedule_id: schedule.id,
      date,
      day_of_week: fromDayOfWeek(schedule.dayOfWeek),
      start_time: combineDateAndTime(date, schedule.startTime),
      end_time: combineDateAndTime(date, schedule.endTime),
      source: fromScheduleSource(schedule.source),
      student: {
        id: linkedStudent.id,
        nim: linkedStudent.nim,
        full_name: linkedStudent.fullName,
      },
      class_id: schedule.class.id,
      class_code: schedule.class.classCode,
      semester: schedule.class.semester,
      academic_year: schedule.class.academicYear,
      course: schedule.class.course,
      room: schedule.class.room,
      lecturer: {
        id: schedule.class.lecturer.id,
        nidn: schedule.class.lecturer.nidn,
        full_name: schedule.class.lecturer.fullName,
      },
      attendance_status: "not_checked_in",
    }));
  }

  async getLecturerTodayClasses(user: AuthUser, query: TodayViewQueryInput) {
    const linkedLecturer = await this.getLinkedLecturer(user);
    const date = query.date ?? getCurrentJakartaDate();
    const dayOfWeek = toDayOfWeek(getDayOfWeekFromDate(date));

    const classes = await this.listLecturerClasses(linkedLecturer.id, dayOfWeek);

    return classes.map((classItem) => ({
      ...mapLecturerClassSummary(classItem, linkedLecturer, date),
      date,
    }));
  }

  async getLecturerClasses(user: AuthUser) {
    const linkedLecturer = await this.getLinkedLecturer(user);
    const classes = await this.listLecturerClasses(linkedLecturer.id);

    return classes.map((classItem) => mapLecturerClassSummary(classItem, linkedLecturer));
  }

  async submitCameraScan(user: AuthUser, payload: CameraScanInput) {
    const student = await this.prisma.student.findFirst({
      where: { userId: user.userId },
      select: {
        id: true,
        nim: true,
        fullName: true,
      },
    });
    const linkedStudent = assertFound(student, "Student");

    const schedule = await this.prisma.schedule.findUnique({
      where: { id: payload.schedule_id },
      include: {
        class: {
          include: {
            room: true,
            enrollments: {
              where: {
                studentId: linkedStudent.id,
                status: EnrollmentStatus.ACTIVE,
              },
              select: { id: true },
            },
          },
        },
      },
    });
    const resolvedSchedule = assertFound(schedule, "Schedule");

    if (resolvedSchedule.class.enrollments.length === 0) {
      throw new ForbiddenException({
        code: "invalid_schedule",
        message: "Student is not enrolled in this schedule",
      });
    }

    const now = new Date(payload.captured_at);
    const existingRecord = await this.prisma.attendanceRecord.findFirst({
      where: {
        studentId: linkedStudent.id,
        scheduleId: resolvedSchedule.id,
      },
      select: { id: true },
    });

    const record = existingRecord
      ? await this.prisma.attendanceRecord.update({
          where: { id: existingRecord.id },
          data:
            payload.action === "check_out"
              ? {
                  status: AttendanceStatus.LEFT,
                  checkOutAt: now,
                }
              : {
                  status: AttendanceStatus.PRESENT,
                  source: AttendanceSource.STUDENT_APP,
                  checkInAt: now,
                },
        })
      : await this.prisma.attendanceRecord.create({
          data: {
            studentId: linkedStudent.id,
            classId: resolvedSchedule.classId,
            scheduleId: resolvedSchedule.id,
            roomId: resolvedSchedule.class.roomId,
            status: payload.action === "check_out" ? AttendanceStatus.LEFT : AttendanceStatus.PRESENT,
            source: AttendanceSource.STUDENT_APP,
            checkInAt: payload.action === "check_in" ? now : null,
            checkOutAt: payload.action === "check_out" ? now : null,
          },
    });

    return {
      attendance_record_id: record.id,
      status: record.status.toLowerCase() as "present" | "left" | "alpha",
      source: "student_app" as const,
      verification_result: "matched" as const,
      face_probe_ref: payload.face_probe_ref,
    };
  }

  async updateProfile(user: AuthUser, payload: UpdateUserAccountInput) {
    const nextName = payload.account_name?.trim();
    if (!nextName) {
      throw new BadRequestException({
        code: "invalid_payload",
        message: "account_name is required",
      });
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.userId },
      data: {
        accountName: nextName,
      },
      select: {
        id: true,
        email: true,
        accountName: true,
        role: true,
      },
    });

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      account_name: updatedUser.accountName,
      role: fromUserRole(updatedUser.role) as "student" | "lecturer" | "admin",
    };
  }

  async getClassRosterForUser(classId: string, user: AuthUser) {
    const classItem = await this.prisma.class.findUnique({
      where: { id: classId },
      include: {
        lecturer: {
          select: {
            id: true,
            userId: true,
            fullName: true,
            nidn: true,
          },
        },
        course: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        room: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        enrollments: {
          orderBy: {
            student: {
              fullName: "asc",
            },
          },
          include: {
            student: {
              select: {
                id: true,
                nim: true,
                fullName: true,
                status: true,
              },
            },
          },
        },
      },
    });

    const resolvedClass = assertFound(classItem, "Class");
    if (
      user.role === "lecturer" &&
      resolvedClass.lecturer.userId !== user.userId
    ) {
      throw new ForbiddenException({
        code: "forbidden_role",
        message: "You do not have permission to access this class roster",
      });
    }

    return {
      class_id: resolvedClass.id,
      class_code: resolvedClass.classCode,
      semester: resolvedClass.semester,
      academic_year: resolvedClass.academicYear,
      course: resolvedClass.course,
      room: resolvedClass.room,
      lecturer: {
        id: resolvedClass.lecturer.id,
        user_id: resolvedClass.lecturer.userId,
        nidn: resolvedClass.lecturer.nidn,
        full_name: resolvedClass.lecturer.fullName,
      },
      students: resolvedClass.enrollments.map((enrollment) => ({
        enrollment_id: enrollment.id,
        status: enrollment.status.toLowerCase(),
        student: {
          id: enrollment.student.id,
          nim: enrollment.student.nim,
          full_name: enrollment.student.fullName,
          status: enrollment.student.status.toLowerCase(),
        },
      })),
    };
  }

  private async getLinkedLecturer(user: AuthUser) {
    const lecturer = await this.prisma.lecturer.findFirst({
      where: {
        userId: user.userId,
      },
      select: {
        id: true,
        fullName: true,
        nidn: true,
      },
    });

    return assertFound(lecturer, "Lecturer");
  }

  private async listLecturerClasses(lecturerId: string, dayOfWeek?: DayOfWeek) {
    return this.prisma.class.findMany({
      where: {
        lecturerId,
        ...(dayOfWeek
          ? {
              schedules: {
                some: {
                  dayOfWeek,
                },
              },
            }
          : {}),
      },
      orderBy: [
        { academicYear: "desc" },
        { semester: "desc" },
        { classCode: "asc" },
      ],
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        room: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        schedules: {
          ...(dayOfWeek
            ? {
                where: {
                  dayOfWeek,
                },
              }
            : {}),
          orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
          select: {
            id: true,
            dayOfWeek: true,
            startTime: true,
            endTime: true,
            source: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });
  }
}

function mapLecturerClassSummary(
  classItem: {
    id: string;
    classCode: string;
    semester: string;
    academicYear: string;
    course: {
      id: string;
      code: string;
      name: string;
    };
    room: {
      id: string;
      code: string;
      name: string;
    };
    schedules: Array<{
      id: string;
      dayOfWeek: DayOfWeek;
      startTime: Date;
      endTime: Date;
      source: Parameters<typeof fromScheduleSource>[0];
    }>;
    _count: {
      enrollments: number;
    };
  },
  lecturer: {
    id: string;
    fullName: string;
    nidn: string;
  },
  date?: string,
) {
  return {
    class_id: classItem.id,
    class_code: classItem.classCode,
    semester: classItem.semester,
    academic_year: classItem.academicYear,
    lecturer: {
      id: lecturer.id,
      nidn: lecturer.nidn,
      full_name: lecturer.fullName,
    },
    course: classItem.course,
    room: classItem.room,
    schedules: classItem.schedules.map((schedule) => ({
      schedule_id: schedule.id,
      day_of_week: fromDayOfWeek(schedule.dayOfWeek),
      start_time: date
        ? combineDateAndTime(date, schedule.startTime)
        : formatTimeString(schedule.startTime),
      end_time: date
        ? combineDateAndTime(date, schedule.endTime)
        : formatTimeString(schedule.endTime),
      source: fromScheduleSource(schedule.source),
    })),
    enrollments_count: classItem._count.enrollments,
  };
}
