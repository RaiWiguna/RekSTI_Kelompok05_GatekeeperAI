import { Injectable } from "@nestjs/common";
import type {
  CoursesListQueryInput,
  CreateCourseInput,
  UpdateCourseInput,
} from "@gatekeeper/shared-validation";

import { mapPrismaError } from "../common/database/prisma-error";
import { assertFound, buildContainsSearchFilter } from "../common/database/query-helpers";
import {
  fromCourseStatus,
  toCourseStatus,
} from "../common/database/prisma-enum-mappers";
import { buildPaginationMeta, getPaginationParams } from "../common/http/pagination";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: CoursesListQueryInput) {
    const { skip, take, page, limit } = getPaginationParams(query);
    const where = {
      ...(query.status ? { status: toCourseStatus(query.status) } : {}),
      ...buildContainsSearchFilter(query.search, ["code", "name"]),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.course.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              classes: true,
            },
          },
        },
      }),
      this.prisma.course.count({ where }),
    ]);

    return {
      data: items.map(mapCourse),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async getById(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            classes: true,
          },
        },
      },
    });

    return mapCourse(assertFound(course, "Course"));
  }

  async create(payload: CreateCourseInput) {
    try {
      const course = await this.prisma.course.create({
        data: {
          code: payload.code,
          name: payload.name,
          credits: payload.credits,
          status: toCourseStatus(payload.status),
        },
        include: {
          _count: {
            select: {
              classes: true,
            },
          },
        },
      });

      return mapCourse(course);
    } catch (error) {
      mapPrismaError(error, "Course");
    }
  }

  async update(id: string, payload: UpdateCourseInput) {
    try {
      const course = await this.prisma.course.update({
        where: { id },
        data: {
          ...(payload.code !== undefined ? { code: payload.code } : {}),
          ...(payload.name !== undefined ? { name: payload.name } : {}),
          ...(payload.credits !== undefined ? { credits: payload.credits } : {}),
          ...(payload.status !== undefined ? { status: toCourseStatus(payload.status) } : {}),
        },
        include: {
          _count: {
            select: {
              classes: true,
            },
          },
        },
      });

      return mapCourse(course);
    } catch (error) {
      mapPrismaError(error, "Course");
    }
  }

  async remove(id: string) {
    try {
      const course = await this.prisma.course.update({
        where: { id },
        data: { status: toCourseStatus("inactive") },
        include: {
          _count: {
            select: {
              classes: true,
            },
          },
        },
      });

      return mapCourse(course);
    } catch (error) {
      mapPrismaError(error, "Course");
    }
  }
}

function mapCourse(course: {
  id: string;
  code: string;
  name: string;
  credits: number;
  status: Parameters<typeof fromCourseStatus>[0];
  createdAt: Date;
  updatedAt: Date;
  _count: {
    classes: number;
  };
}) {
  return {
    id: course.id,
    code: course.code,
    name: course.name,
    credits: course.credits,
    status: fromCourseStatus(course.status),
    classes_count: course._count.classes,
    created_at: course.createdAt.toISOString(),
    updated_at: course.updatedAt.toISOString(),
  };
}
