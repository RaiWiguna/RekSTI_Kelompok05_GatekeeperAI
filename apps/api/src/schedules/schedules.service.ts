import { Injectable } from "@nestjs/common";
import type {
  CreateScheduleInput,
  SchedulesListQueryInput,
  UpdateScheduleInput,
} from "@gatekeeper/shared-validation";

import { getDayOfWeekFromDate } from "../common/date/day-of-week";
import { formatTimeString, parseTimeString } from "../common/date/time";
import { mapPrismaError } from "../common/database/prisma-error";
import { assertFound } from "../common/database/query-helpers";
import {
  fromDayOfWeek,
  fromScheduleSource,
  toDayOfWeek,
  toScheduleSource,
} from "../common/database/prisma-enum-mappers";
import { buildPaginationMeta, getPaginationParams } from "../common/http/pagination";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class SchedulesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: SchedulesListQueryInput) {
    const { skip, take, page, limit } = getPaginationParams(query);
    const resolvedDayOfWeek = query.date ? getDayOfWeekFromDate(query.date) : query.day_of_week;
    const where = {
      ...(query.class_id ? { classId: query.class_id } : {}),
      ...(resolvedDayOfWeek ? { dayOfWeek: toDayOfWeek(resolvedDayOfWeek) } : {}),
      ...(query.room_id ? { class: { roomId: query.room_id } } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.schedule.findMany({
        where,
        skip,
        take,
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
        include: {
          class: {
            select: {
              id: true,
              classCode: true,
              semester: true,
              academicYear: true,
              room: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.schedule.count({ where }),
    ]);

    return {
      data: items.map(mapSchedule),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async getById(id: string) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id },
      include: {
        class: {
          select: {
            id: true,
            classCode: true,
            semester: true,
            academicYear: true,
            room: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return mapSchedule(assertFound(schedule, "Schedule"));
  }

  async create(payload: CreateScheduleInput) {
    try {
      const schedule = await this.prisma.schedule.create({
        data: {
          classId: payload.class_id,
          dayOfWeek: toDayOfWeek(payload.day_of_week),
          startTime: parseTimeString(payload.start_time),
          endTime: parseTimeString(payload.end_time),
          source: toScheduleSource(payload.source),
          ...(payload.synced_at ? { syncedAt: new Date(payload.synced_at) } : {}),
        },
        include: {
          class: {
            select: {
              id: true,
              classCode: true,
              semester: true,
              academicYear: true,
              room: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      return mapSchedule(schedule);
    } catch (error) {
      mapPrismaError(error, "Schedule");
    }
  }

  async update(id: string, payload: UpdateScheduleInput) {
    try {
      const schedule = await this.prisma.schedule.update({
        where: { id },
        data: {
          ...(payload.class_id !== undefined ? { classId: payload.class_id } : {}),
          ...(payload.day_of_week !== undefined
            ? { dayOfWeek: toDayOfWeek(payload.day_of_week) }
            : {}),
          ...(payload.start_time !== undefined
            ? { startTime: parseTimeString(payload.start_time) }
            : {}),
          ...(payload.end_time !== undefined ? { endTime: parseTimeString(payload.end_time) } : {}),
          ...(payload.source !== undefined ? { source: toScheduleSource(payload.source) } : {}),
          ...(payload.synced_at !== undefined
            ? { syncedAt: payload.synced_at ? new Date(payload.synced_at) : null }
            : {}),
        },
        include: {
          class: {
            select: {
              id: true,
              classCode: true,
              semester: true,
              academicYear: true,
              room: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      return mapSchedule(schedule);
    } catch (error) {
      mapPrismaError(error, "Schedule");
    }
  }

  async remove(id: string) {
    try {
      const schedule = await this.prisma.schedule.delete({
        where: { id },
        include: {
          class: {
            select: {
              id: true,
              classCode: true,
              semester: true,
              academicYear: true,
              room: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      return mapSchedule(schedule);
    } catch (error) {
      mapPrismaError(error, "Schedule");
    }
  }
}

function mapSchedule(schedule: {
  id: string;
  classId: string;
  dayOfWeek: Parameters<typeof fromDayOfWeek>[0];
  startTime: Date;
  endTime: Date;
  source: Parameters<typeof fromScheduleSource>[0];
  syncedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  class?: {
    id: string;
    classCode: string;
    semester: string;
    academicYear: string;
    room: {
      id: string;
      code: string;
      name: string;
    };
  };
}) {
  return {
    id: schedule.id,
    class_id: schedule.classId,
    day_of_week: fromDayOfWeek(schedule.dayOfWeek),
    start_time: formatTimeString(schedule.startTime),
    end_time: formatTimeString(schedule.endTime),
    source: fromScheduleSource(schedule.source),
    class: schedule.class
      ? {
          id: schedule.class.id,
          class_code: schedule.class.classCode,
          semester: schedule.class.semester,
          academic_year: schedule.class.academicYear,
          room: schedule.class.room,
        }
      : null,
    synced_at: schedule.syncedAt?.toISOString() ?? null,
    created_at: schedule.createdAt.toISOString(),
    updated_at: schedule.updatedAt.toISOString(),
  };
}
