import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const gatewayEventSchema = z.object({
  event_id: z.string().uuid(),
  device_id: z.string().min(1),
  event_type: z.enum(["entry", "exit", "override", "device_heartbeat", "sync_checkpoint"]),
  event_at: z.string().datetime(),
  access_result: z.enum(["granted", "denied"]),
});

