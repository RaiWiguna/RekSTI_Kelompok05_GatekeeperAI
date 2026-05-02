import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

export function mapPrismaError(error: unknown, resourceName: string): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        throw new ConflictException({
          code: "duplicate_record",
          message: `${resourceName} already exists`,
        });
      case "P2003":
        throw new BadRequestException({
          code: "invalid_relation",
          message: `Referenced relation for ${resourceName} is invalid`,
        });
      case "P2025":
        throw new NotFoundException({
          code: "not_found",
          message: `${resourceName} not found`,
        });
      default:
        throw error;
    }
  }

  throw error;
}
