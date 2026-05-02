import { z } from "zod";

export const activeInactiveStatusSchema = z.enum(["active", "inactive"]);
export const deviceStatusSchema = z.enum(["online", "offline", "maintenance"]);
export const dayOfWeekSchema = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);
export const scheduleSourceSchema = z.enum(["manual", "six"]);
export const isoTimeSchema = z.string().regex(/^\d{2}:\d{2}:\d{2}$/, "Expected HH:MM:SS");
export const uuidSchema = z.string().uuid();
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});
export const uuidParamSchema = z.object({
  id: uuidSchema,
});

export type UuidParamInput = z.infer<typeof uuidParamSchema>;
