import { z } from "zod";

import { activeInactiveStatusSchema, paginationQuerySchema, uuidSchema } from "./common";

export const createStudentSchema = z.object({
  nim: z.string().trim().min(3).max(32),
  name: z.string().trim().min(3).max(120),
  status: activeInactiveStatusSchema.default("active"),
  user_id: uuidSchema.optional(),
});

export const updateStudentSchema = createStudentSchema.partial();

export const studentsListQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().min(1).optional(),
  status: activeInactiveStatusSchema.optional(),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type StudentsListQueryInput = z.infer<typeof studentsListQuerySchema>;
