import { NotFoundException } from "@nestjs/common";

export function buildContainsSearchFilter(search: string | undefined, fields: string[]) {
  if (!search) {
    return {};
  }

  return {
    OR: fields.map((field) => ({
      [field]: {
        contains: search,
        mode: "insensitive" as const,
      },
    })),
  };
}

export function assertFound<T>(value: T | null, resourceName: string): T {
  if (!value) {
    throw new NotFoundException({
      code: "not_found",
      message: `${resourceName} not found`,
    });
  }

  return value;
}
