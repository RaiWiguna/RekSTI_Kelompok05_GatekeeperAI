import { z } from "zod";

import { paginationQuerySchema, uuidSchema } from "./common";

export const createFaceRegistrationSchema = z.object({
  student_id: uuidSchema,
  embedding_ref: z.string().trim().min(1).max(255),
  model_version: z.string().trim().min(1).max(64),
});

export const faceRegistrationsListQuerySchema = paginationQuerySchema.extend({
  student_id: uuidSchema.optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export type CreateFaceRegistrationInput = z.infer<typeof createFaceRegistrationSchema>;
export type FaceRegistrationsListQueryInput = z.infer<typeof faceRegistrationsListQuerySchema>;
