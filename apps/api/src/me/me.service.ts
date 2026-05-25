import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { AttendanceSource, AttendanceStatus, DayOfWeek, EnrollmentStatus, OverrideAction, OverrideStatus } from "@prisma/client";
import type { CameraScanInput, UpdateUserAccountInput } from "@gatekeeper/shared-validation";
import type { TodayViewQueryInput } from "@gatekeeper/shared-validation";

import { getCurrentJakartaDate, combineDateAndTime, formatDateOnly, parseDateOnly } from "../common/date/calendar";
import { getDayOfWeekFromDate } from "../common/date/day-of-week";
import { formatTimeString } from "../common/date/time";
import { assertFound } from "../common/database/query-helpers";
import { dispatchIotGatewayCommand } from "../common/http/iot-gateway-client";
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
    const occurrenceDate = parseDateOnly(date);

    const schedules = await this.prisma.schedule.findMany({
      where: {
        dayOfWeek,
        startDate: { lte: occurrenceDate },
        endDate: { gte: occurrenceDate },
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
        attendanceRecords: {
          where: {
            studentId: linkedStudent.id,
            occurrenceDate,
          },
          select: {
            status: true,
            checkInAt: true,
            checkOutAt: true,
          },
          take: 1,
        },
      },
    });

    return schedules.map((schedule) => ({
      schedule_id: schedule.id,
      date,
      day_of_week: fromDayOfWeek(schedule.dayOfWeek),
      start_date: formatDateOnly(schedule.startDate),
      end_date: formatDateOnly(schedule.endDate),
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
      attendance_status: resolveTodayAttendanceStatus(schedule, date),
      check_in_at: schedule.attendanceRecords[0]?.checkInAt?.toISOString() ?? null,
      check_out_at: schedule.attendanceRecords[0]?.checkOutAt?.toISOString() ?? null,
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

  async getStudentClasses(user: AuthUser) {
    const student = await this.prisma.student.findFirst({
      where: { userId: user.userId },
      select: {
        id: true,
        nim: true,
        fullName: true,
      },
    });
    const linkedStudent = assertFound(student, "Student");
    const currentDate = parseDateOnly(getCurrentJakartaDate());

    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        studentId: linkedStudent.id,
        status: EnrollmentStatus.ACTIVE,
      },
      orderBy: {
        class: {
          classCode: "asc",
        },
      },
      include: {
        class: {
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
            schedules: {
              orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
            },
            attendanceRecords: {
              where: {
                studentId: linkedStudent.id,
              },
              orderBy: {
                occurrenceDate: "desc",
              },
            },
          },
        },
      },
    });

    return enrollments.map((enrollment) => {
      const expectedOccurrences = enrollment.class.schedules.flatMap((schedule) =>
        listScheduleOccurrences(schedule, currentDate),
      );
      const recordByScheduleAndDate = new Map(
        enrollment.class.attendanceRecords.map((record) => [
          `${record.scheduleId ?? ""}:${formatDateOnly(record.occurrenceDate)}`,
          record,
        ]),
      );
      const attendanceHistory = expectedOccurrences
        .map((occurrence) => {
          const record = recordByScheduleAndDate.get(`${occurrence.schedule.id}:${occurrence.date}`);
          return {
            schedule_id: occurrence.schedule.id,
            date: occurrence.date,
            day_of_week: fromDayOfWeek(occurrence.schedule.dayOfWeek),
            start_time: combineDateAndTime(occurrence.date, occurrence.schedule.startTime),
            end_time: combineDateAndTime(occurrence.date, occurrence.schedule.endTime),
            status: record ? fromAttendanceStatusForHistory(record.status) : "absent",
            check_in_at: record?.checkInAt?.toISOString() ?? null,
            check_out_at: record?.checkOutAt?.toISOString() ?? null,
          };
        })
        .sort((left, right) => right.date.localeCompare(left.date));
      const attendedCount = attendanceHistory.filter((item) => item.status === "attended").length;
      const attendancePercentage = attendanceHistory.length === 0
        ? 0
        : Math.round((attendedCount / attendanceHistory.length) * 10000) / 100;

      return {
        class_id: enrollment.class.id,
        class_code: enrollment.class.classCode,
        semester: enrollment.class.semester,
        academic_year: enrollment.class.academicYear,
        course: enrollment.class.course,
        lecturer: {
          id: enrollment.class.lecturer.id,
          nidn: enrollment.class.lecturer.nidn,
          full_name: enrollment.class.lecturer.fullName,
        },
        room: enrollment.class.room,
        schedules: enrollment.class.schedules.map((schedule) => ({
          schedule_id: schedule.id,
          day_of_week: fromDayOfWeek(schedule.dayOfWeek),
          start_date: formatDateOnly(schedule.startDate),
          end_date: formatDateOnly(schedule.endDate),
          start_time: formatTimeString(schedule.startTime),
          end_time: formatTimeString(schedule.endTime),
          source: fromScheduleSource(schedule.source),
        })),
        attendance_percentage: attendancePercentage,
        attendance_history: attendanceHistory,
      };
    });
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
    const occurrenceDate = parseDateOnly(payload.captured_at.slice(0, 10));
    const existingRecord = await this.prisma.attendanceRecord.findFirst({
      where: {
        studentId: linkedStudent.id,
        scheduleId: resolvedSchedule.id,
        occurrenceDate,
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
            occurrenceDate,
            roomId: resolvedSchedule.class.roomId,
            status: payload.action === "check_out" ? AttendanceStatus.LEFT : AttendanceStatus.PRESENT,
            source: AttendanceSource.STUDENT_APP,
            checkInAt: payload.action === "check_in" ? now : null,
            checkOutAt: payload.action === "check_out" ? now : null,
          },
    });
    const shouldUnlockRoom = payload.action === "check_in";
    const iotOverride = shouldUnlockRoom
      ? await this.dispatchStudentAttendanceUnlock({
          userId: user.userId,
          roomId: resolvedSchedule.class.roomId,
          roomCode: resolvedSchedule.class.room.code,
          studentNim: linkedStudent.nim,
          scheduleId: resolvedSchedule.id,
          attendanceRecordId: record.id,
        })
      : null;

    return {
      attendance_record_id: record.id,
      status: record.status.toLowerCase() as "present" | "left" | "alpha",
      source: "student_app" as const,
      verification_result: "matched" as const,
      face_probe_ref: payload.face_probe_ref,
      iot_override: iotOverride,
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
    const currentDate = parseDateOnly(getCurrentJakartaDate());
    return this.prisma.class.findMany({
      where: {
        lecturerId,
        ...(dayOfWeek
          ? {
              schedules: {
                some: {
                  dayOfWeek,
                  startDate: { lte: currentDate },
                  endDate: { gte: currentDate },
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
                  startDate: { lte: currentDate },
                  endDate: { gte: currentDate },
                },
              }
            : {}),
          orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
          select: {
            id: true,
            dayOfWeek: true,
            startDate: true,
            endDate: true,
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
        attendanceRecords: {
          where: {
            occurrenceDate: currentDate,
          },
          select: {
            status: true,
          },
        },
      },
    });
  }

  private async dispatchStudentAttendanceUnlock(input: {
    userId: string;
    roomId: string;
    roomCode?: string;
    studentNim: string;
    scheduleId: string;
    attendanceRecordId: string;
  }) {
    const dispatchResult = await dispatchIotGatewayCommand("unlock");

    const reason = [
      "Student camera attendance auto-unlock",
      `student_nim=${input.studentNim}`,
      `schedule_id=${input.scheduleId}`,
      `attendance_record_id=${input.attendanceRecordId}`,
      input.roomCode ? `room_code=${input.roomCode}` : null,
      `iot_status=${dispatchResult.ok ? "sent" : "failed"}`,
      `iot_url=${dispatchResult.url}`,
      dispatchResult.error ? `iot_error=${dispatchResult.error}` : null,
    ].filter(Boolean).join("; ").slice(0, 500);

    const override = await this.prisma.overrideLog.create({
      data: {
        userId: input.userId,
        roomId: input.roomId,
        action: OverrideAction.UNLOCK,
        reason,
        status: dispatchResult.ok ? OverrideStatus.SENT : OverrideStatus.FAILED,
      },
      select: {
        id: true,
        status: true,
      },
    });

    return {
      override_id: override.id,
      action: "unlock" as const,
      status: override.status.toLowerCase() as "sent" | "failed",
      iot_gateway: {
        ok: dispatchResult.ok,
        url: dispatchResult.url,
        message: dispatchResult.error ?? "Command sent to IoT gateway",
      },
    };
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
      startDate: Date;
      endDate: Date;
      startTime: Date;
      endTime: Date;
      source: Parameters<typeof fromScheduleSource>[0];
    }>;
    _count: {
      enrollments: number;
    };
    attendanceRecords: Array<{
      status: AttendanceStatus;
    }>;
  },
  lecturer: {
    id: string;
    fullName: string;
    nidn: string;
  },
  date?: string,
) {
  const presentCount = classItem.attendanceRecords.filter(
    (record) => record.status === AttendanceStatus.PRESENT || record.status === AttendanceStatus.LEFT,
  ).length;

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
      start_date: formatDateOnly(schedule.startDate),
      end_date: formatDateOnly(schedule.endDate),
      start_time: date
        ? combineDateAndTime(date, schedule.startTime)
        : formatTimeString(schedule.startTime),
      end_time: date
        ? combineDateAndTime(date, schedule.endTime)
        : formatTimeString(schedule.endTime),
      source: fromScheduleSource(schedule.source),
    })),
    enrollments_count: classItem._count.enrollments,
    present_count: presentCount,
    absent_count: Math.max(classItem._count.enrollments - presentCount, 0),
  };
}

function resolveTodayAttendanceStatus(
  schedule: {
    endTime: Date;
    attendanceRecords: Array<{
      status: AttendanceStatus;
    }>;
  },
  date: string,
) {
  const record = schedule.attendanceRecords[0];
  if (record) {
    return fromAttendanceStatusForHistory(record.status);
  }

  const endAt = new Date(combineDateAndTime(date, schedule.endTime));
  return new Date() > endAt ? "absent" : "not_yet";
}

function fromAttendanceStatusForHistory(status: AttendanceStatus) {
  return status === AttendanceStatus.PRESENT || status === AttendanceStatus.LEFT
    ? "attended"
    : "absent";
}

function listScheduleOccurrences(
  schedule: {
    id: string;
    dayOfWeek: DayOfWeek;
    startDate: Date;
    endDate: Date;
    startTime: Date;
    endTime: Date;
  },
  currentDate: Date,
) {
  const endDate = schedule.endDate < currentDate ? schedule.endDate : currentDate;
  const occurrences: Array<{
    date: string;
    schedule: typeof schedule;
  }> = [];
  const cursor = new Date(schedule.startDate);

  while (cursor <= endDate) {
    if (toDayOfWeek(getDayOfWeekFromDate(formatDateOnly(cursor))) === schedule.dayOfWeek) {
      occurrences.push({
        date: formatDateOnly(cursor),
        schedule,
      });
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return occurrences;
}
