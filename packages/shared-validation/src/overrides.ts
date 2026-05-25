import { z } from "zod";

import {
  optionalDateRangeQuerySchema,
  overrideActionSchema,
  paginationQuerySchema,
  uuidSchema,
} from "./common";

export const createOverrideSchema = z.object({
  room_id: uuidSchema,
  action: overrideActionSchema,
  reason: z.string().trim().min(3).max(500),
});

export const overridesListQuerySchema = paginationQuerySchema
  .merge(optionalDateRangeQuerySchema)
  .extend({
    room_id: uuidSchema.optional(),
    user_id: uuidSchema.optional(),
    action: overrideActionSchema.optional(),
  });

export type CreateOverrideInput = z.infer<typeof createOverrideSchema>;
export type OverridesListQueryInput = z.infer<typeof overridesListQuerySchema>;
