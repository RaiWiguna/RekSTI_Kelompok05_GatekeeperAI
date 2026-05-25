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
export const attendanceStatusSchema = z.enum(["present", "left", "alpha"]);
export const attendanceSourceSchema = z.enum(["device", "student_app", "manual"]);
export const accessEventTypeSchema = z.enum(["entry", "exit", "override", "device_heartbeat", "sync_checkpoint"]);
export const accessResultSchema = z.enum(["granted", "denied"]);
export const livenessResultSchema = z.enum(["pass", "fail"]);
export const overrideActionSchema = z.enum(["unlock", "lock"]);
export const syncResultSchema = z.enum(["queued", "running", "success", "partial_success", "failed"]);
export const syncTypeSchema = z.enum(["six_schedule", "gateway_event", "gateway_reference"]);
export const isoTimeSchema = z.string().regex(/^\d{2}:\d{2}:\d{2}$/, "Expected HH:MM:SS");
export const uuidSchema = z.string().uuid();
export const optionalDateRangeQuerySchema = z.object({
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
});
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});
export const uuidParamSchema = z.object({
  id: uuidSchema,
});

export type UuidParamInput = z.infer<typeof uuidParamSchema>;
