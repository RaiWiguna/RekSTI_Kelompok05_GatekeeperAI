import { z } from "zod";

import {
  activeInactiveStatusSchema,
  paginationQuerySchema,
  uuidSchema,
} from "./common";

export const interactiveUserRoleSchema = z.enum(["student", "admin", "lecturer"]);
export const manageableUserRoleSchema = interactiveUserRoleSchema;
export const linkedAccountStateSchema = z.enum(["linked", "unlinked"]);

export const createUserAccountSchema = z
  .object({
    role: manageableUserRoleSchema.default("lecturer"),
    name: z.string().trim().min(3).max(120),
    email: z.string().trim().email(),
    password: z.string().min(8).max(72),
    status: activeInactiveStatusSchema.default("active"),
    student_id: uuidSchema.optional(),
    lecturer_id: uuidSchema.optional(),
  })
  .superRefine((value, context) => {
    if (value.student_id && value.role !== "student") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["student_id"],
        message: "student_id can only be assigned to student accounts",
      });
    }

    if (value.lecturer_id && value.role !== "lecturer") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["lecturer_id"],
        message: "lecturer_id can only be assigned to lecturer accounts",
      });
    }

    if (value.student_id && value.lecturer_id) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["student_id"],
        message: "Only one linked profile can be assigned to an account",
      });
    }
  });

export const updateUserAccountSchema = z.object({
  name: z.string().trim().min(3).max(120).optional(),
  email: z.string().trim().email().optional(),
  status: activeInactiveStatusSchema.optional(),
  student_id: uuidSchema.nullable().optional(),
  lecturer_id: uuidSchema.nullable().optional(),
}).superRefine((value, context) => {
  if (value.student_id && value.lecturer_id) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["student_id"],
      message: "Only one linked profile can be assigned to an account",
    });
  }
});

export const updateUserPasswordSchema = z.object({
  password: z.string().min(8).max(72),
});

export const usersListQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().min(1).optional(),
  role: manageableUserRoleSchema.optional(),
  status: activeInactiveStatusSchema.optional(),
  student_id: uuidSchema.optional(),
  lecturer_id: uuidSchema.optional(),
  linked: linkedAccountStateSchema.optional(),
});

export type CreateUserAccountInput = z.infer<typeof createUserAccountSchema>;
export type UpdateUserAccountInput = z.infer<typeof updateUserAccountSchema>;
export type UpdateUserPasswordInput = z.infer<typeof updateUserPasswordSchema>;
export type UsersListQueryInput = z.infer<typeof usersListQuerySchema>;
