import { z } from "zod";

import { activeInactiveStatusSchema, paginationQuerySchema } from "./common";

export const createCourseSchema = z.object({
  code: z.string().trim().min(2).max(32),
  name: z.string().trim().min(3).max(160),
  credits: z.coerce.number().int().min(1).max(12),
  status: activeInactiveStatusSchema.default("active"),
});

export const updateCourseSchema = createCourseSchema.partial();

export const coursesListQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().min(1).optional(),
  status: activeInactiveStatusSchema.optional(),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type CoursesListQueryInput = z.infer<typeof coursesListQuerySchema>;
