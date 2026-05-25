import { z } from "zod";

import {
  accessEventTypeSchema,
  accessResultSchema,
  optionalDateRangeQuerySchema,
  paginationQuerySchema,
  uuidSchema,
} from "./common";

export const accessLogsListQuerySchema = paginationQuerySchema
  .merge(optionalDateRangeQuerySchema)
  .extend({
    student_id: uuidSchema.optional(),
    device_id: uuidSchema.optional(),
    room_id: uuidSchema.optional(),
    event_type: accessEventTypeSchema.optional(),
    access_result: accessResultSchema.optional(),
  });

export type AccessLogsListQueryInput = z.infer<typeof accessLogsListQuerySchema>;
