import { z } from "zod";

export const gatewayEventSchema = z.object({
  event_id: z.string().uuid(),
  device_id: z.string().min(1),
  room_code: z.string().trim().min(1).optional(),
  student_nim: z.string().trim().min(1).optional(),
  event_type: z.enum(["entry", "exit", "override", "device_heartbeat", "sync_checkpoint"]),
  event_at: z.string().datetime(),
  access_result: z.enum(["granted", "denied"]),
  liveness_result: z.enum(["pass", "fail"]).optional(),
  confidence_score: z.number().min(0).max(1).optional(),
  gateway_id: z.string().trim().min(1).optional(),
  sync_version: z.number().int().min(1).optional(),
});

export type GatewayEventInput = z.infer<typeof gatewayEventSchema>;
