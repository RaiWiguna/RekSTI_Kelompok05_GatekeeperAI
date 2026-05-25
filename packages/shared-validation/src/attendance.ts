import { z } from "zod";

import {
  attendanceSourceSchema,
  attendanceStatusSchema,
  optionalDateRangeQuerySchema,
  paginationQuerySchema,
  uuidSchema,
} from "./common";

export const attendanceRecordsListQuerySchema = paginationQuerySchema
  .merge(optionalDateRangeQuerySchema)
  .extend({
    student_id: uuidSchema.optional(),
    class_id: uuidSchema.optional(),
    room_id: uuidSchema.optional(),
    status: attendanceStatusSchema.optional(),
    source: attendanceSourceSchema.optional(),
  });

export const cameraScanSchema = z.object({
  schedule_id: uuidSchema,
  action: z.enum(["check_in", "check_out"]),
  captured_at: z.string().datetime(),
  face_probe_ref: z.string().trim().min(1).max(255),
});

export const updateAttendanceRecordSchema = z
  .object({
    occurrence_date: z.string().date().optional(),
    room_id: uuidSchema.optional(),
    status: attendanceStatusSchema.optional(),
    source: attendanceSourceSchema.optional(),
    check_in_at: z.string().datetime().optional(),
    check_out_at: z.string().datetime().optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "At least one field must be provided",
  });

export type AttendanceRecordsListQueryInput = z.infer<typeof attendanceRecordsListQuerySchema>;
export type CameraScanInput = z.infer<typeof cameraScanSchema>;
export type UpdateAttendanceRecordInput = z.infer<typeof updateAttendanceRecordSchema>;
