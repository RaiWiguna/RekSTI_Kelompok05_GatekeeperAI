import { Injectable } from "@nestjs/common";
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
      ...buildContainsSearchFilter(query.search, ["nim", "name"]),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.student.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.student.count({ where }),
    ]);

    return {
      data: items.map(mapStudent),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async getById(id: string) {
    const student = await this.prisma.student.findUnique({ where: { id } });
    return mapStudent(assertFound(student, "Student"));
  }

  async create(payload: CreateStudentInput) {
    try {
      const student = await this.prisma.student.create({
        data: {
          nim: payload.nim,
          name: payload.name,
          status: toStudentStatus(payload.status),
        },
      });

      return mapStudent(student);
    } catch (error) {
      mapPrismaError(error, "Student");
    }
  }

  async update(id: string, payload: UpdateStudentInput) {
    try {
      const student = await this.prisma.student.update({
        where: { id },
        data: {
          ...(payload.nim !== undefined ? { nim: payload.nim } : {}),
          ...(payload.name !== undefined ? { name: payload.name } : {}),
          ...(payload.status !== undefined
            ? { status: toStudentStatus(payload.status) }
            : {}),
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
      });

      return mapStudent(student);
    } catch (error) {
      mapPrismaError(error, "Student");
    }
  }
}

function mapStudent(student: {
  id: string;
  nim: string;
  name: string;
  status: Parameters<typeof fromStudentStatus>[0];
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: student.id,
    nim: student.nim,
    name: student.name,
    status: fromStudentStatus(student.status),
    created_at: student.createdAt.toISOString(),
    updated_at: student.updatedAt.toISOString(),
  };
}
