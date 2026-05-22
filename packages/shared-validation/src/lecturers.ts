import { z } from "zod";

import {
  activeInactiveStatusSchema,
  paginationQuerySchema,
  uuidSchema,
} from "./common";

export const createLecturerSchema = z.object({
  nidn: z.string().trim().min(3).max(32),
  full_name: z.string().trim().min(3).max(120),
  status: activeInactiveStatusSchema.default("active"),
  user_id: uuidSchema.optional(),
});

export const updateLecturerSchema = createLecturerSchema.partial();

export const lecturersListQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().min(1).optional(),
  status: activeInactiveStatusSchema.optional(),
});

export type CreateLecturerInput = z.infer<typeof createLecturerSchema>;
export type UpdateLecturerInput = z.infer<typeof updateLecturerSchema>;
export type LecturersListQueryInput = z.infer<typeof lecturersListQuerySchema>;
