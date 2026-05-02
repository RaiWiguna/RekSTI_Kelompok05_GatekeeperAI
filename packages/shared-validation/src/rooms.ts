import { z } from "zod";

import { paginationQuerySchema } from "./common";

export const createRoomSchema = z.object({
  code: z.string().trim().min(2).max(32),
  name: z.string().trim().min(3).max(120),
  building: z.string().trim().min(1).max(64),
  floor: z.coerce.number().int().min(0).max(100),
});

export const updateRoomSchema = createRoomSchema.partial();

export const roomsListQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().min(1).optional(),
  building: z.string().trim().min(1).optional(),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
export type RoomsListQueryInput = z.infer<typeof roomsListQuerySchema>;
