import { Injectable } from "@nestjs/common";
import { FaceRegistrationAction, FaceRegistrationResult } from "@prisma/client";
import type {
  CreateFaceRegistrationInput,
  FaceRegistrationsListQueryInput,
} from "@gatekeeper/shared-validation";

import { mapPrismaError } from "../common/database/prisma-error";
import {
  fromFaceEmbeddingStatus,
  toFaceEmbeddingStatus,
} from "../common/database/prisma-enum-mappers";
import { buildPaginationMeta, getPaginationParams } from "../common/http/pagination";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class FaceRegistrationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(payload: CreateFaceRegistrationInput) {
    try {
      const result = await this.prisma.$transaction(async (transaction) => {
        const embedding = await transaction.faceEmbedding.create({
          data: {
            studentId: payload.student_id,
            embeddingRef: payload.embedding_ref,
            modelVersion: payload.model_version,
          },
          include: faceEmbeddingInclude,
        });

        const log = await transaction.faceRegistrationLog.create({
          data: {
            studentId: payload.student_id,
            action: FaceRegistrationAction.REGISTER,
            result: FaceRegistrationResult.SUCCESS,
            embeddingRef: payload.embedding_ref,
            modelVersion: payload.model_version,
          },
        });

        return { embedding, log };
      });

      return {
        ...mapFaceEmbedding(result.embedding),
        registration_log_id: result.log.id,
      };
    } catch (error) {
      mapPrismaError(error, "Face registration");
    }
  }

  async list(query: FaceRegistrationsListQueryInput) {
    const { skip, take, page, limit } = getPaginationParams(query);
    const where = {
      ...(query.student_id ? { studentId: query.student_id } : {}),
      ...(query.status ? { status: toFaceEmbeddingStatus(query.status) } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.faceEmbedding.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: faceEmbeddingInclude,
      }),
      this.prisma.faceEmbedding.count({ where }),
    ]);

    return {
      data: items.map(mapFaceEmbedding),
      meta: buildPaginationMeta(page, limit, total),
    };
  }
}

const faceEmbeddingInclude = {
  student: {
    select: {
      id: true,
      nim: true,
      fullName: true,
    },
  },
};

function mapFaceEmbedding(embedding: {
  id: string;
  studentId: string;
  embeddingRef: string;
  modelVersion: string;
  status: Parameters<typeof fromFaceEmbeddingStatus>[0];
  createdAt: Date;
  updatedAt: Date;
  student?: {
    id: string;
    nim: string;
    fullName: string;
  };
}) {
  return {
    id: embedding.id,
    student_id: embedding.studentId,
    embedding_ref: embedding.embeddingRef,
    model_version: embedding.modelVersion,
    status: fromFaceEmbeddingStatus(embedding.status),
    student: embedding.student
      ? {
          id: embedding.student.id,
          nim: embedding.student.nim,
          full_name: embedding.student.fullName,
        }
      : null,
    created_at: embedding.createdAt.toISOString(),
    updated_at: embedding.updatedAt.toISOString(),
  };
}
