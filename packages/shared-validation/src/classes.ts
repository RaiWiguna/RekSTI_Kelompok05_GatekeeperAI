import { z } from "zod";

import { paginationQuerySchema, uuidSchema } from "./common";

export const createClassSchema = z.object({
  course_id: uuidSchema,
  lecturer_id: uuidSchema,
  room_id: uuidSchema,
  class_code: z.string().trim().min(2).max(32),
  semester: z.string().trim().min(1).max(16),
  academic_year: z.string().trim().min(4).max(16),
});

export const updateClassSchema = createClassSchema.partial();

export const classesListQuerySchema = paginationQuerySchema.extend({
  semester: z.string().trim().min(1).optional(),
  academic_year: z.string().trim().min(1).optional(),
  room_id: uuidSchema.optional(),
  lecturer_id: uuidSchema.optional(),
});

export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;
export type ClassesListQueryInput = z.infer<typeof classesListQuerySchema>;
