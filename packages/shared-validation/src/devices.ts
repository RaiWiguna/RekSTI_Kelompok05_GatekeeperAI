import { z } from "zod";

import {
  deviceStatusSchema,
  paginationQuerySchema,
  uuidSchema,
} from "./common";

export const createDeviceSchema = z.object({
  room_id: uuidSchema,
  device_code: z.string().trim().min(3).max(64),
  device_type: z.string().trim().min(3).max(64),
  status: deviceStatusSchema.default("offline"),
});

export const updateDeviceSchema = createDeviceSchema.partial();

export const devicesListQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().min(1).optional(),
  room_id: uuidSchema.optional(),
  status: deviceStatusSchema.optional(),
});

export type CreateDeviceInput = z.infer<typeof createDeviceSchema>;
export type UpdateDeviceInput = z.infer<typeof updateDeviceSchema>;
export type DevicesListQueryInput = z.infer<typeof devicesListQuerySchema>;
