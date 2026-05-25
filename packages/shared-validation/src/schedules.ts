import { z } from "zod";

import {
  dayOfWeekSchema,
  isoTimeSchema,
  paginationQuerySchema,
  scheduleSourceSchema,
  uuidSchema,
} from "./common";

const createScheduleBaseSchema = z.object({
  class_id: uuidSchema,
  day_of_week: dayOfWeekSchema,
  start_date: z.string().date(),
  end_date: z.string().date(),
  start_time: isoTimeSchema,
  end_time: isoTimeSchema,
  source: scheduleSourceSchema.default("manual"),
  synced_at: z.string().datetime().optional(),
});

export const createScheduleSchema = createScheduleBaseSchema.refine(
  (data) => data.start_time < data.end_time,
  {
    message: "start_time must be before end_time",
    path: ["end_time"],
  },
).refine(
  (data) => data.start_date <= data.end_date,
  {
    message: "start_date must be before or equal to end_date",
    path: ["end_date"],
  },
);

export const updateScheduleSchema = createScheduleBaseSchema.partial();

export const schedulesListQuerySchema = paginationQuerySchema.extend({
  room_id: uuidSchema.optional(),
  class_id: uuidSchema.optional(),
  day_of_week: dayOfWeekSchema.optional(),
  date: z.string().date().optional(),
});

export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;
export type SchedulesListQueryInput = z.infer<typeof schedulesListQuerySchema>;
