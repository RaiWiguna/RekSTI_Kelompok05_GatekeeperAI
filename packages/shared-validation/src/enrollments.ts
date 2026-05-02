import { z } from "zod";

import {
  activeInactiveStatusSchema,
  paginationQuerySchema,
  uuidSchema,
} from "./common";

export const createEnrollmentSchema = z.object({
  student_id: uuidSchema,
  class_id: uuidSchema,
  status: activeInactiveStatusSchema.default("active"),
});

export const updateEnrollmentSchema = createEnrollmentSchema.partial();

export const enrollmentsListQuerySchema = paginationQuerySchema.extend({
  student_id: uuidSchema.optional(),
  class_id: uuidSchema.optional(),
  status: activeInactiveStatusSchema.optional(),
});

export type CreateEnrollmentInput = z.infer<typeof createEnrollmentSchema>;
export type UpdateEnrollmentInput = z.infer<typeof updateEnrollmentSchema>;
export type EnrollmentsListQueryInput = z.infer<typeof enrollmentsListQuerySchema>;
