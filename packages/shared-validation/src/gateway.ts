import { z } from "zod";

import {
  accessEventTypeSchema,
  accessResultSchema,
  deviceStatusSchema,
  livenessResultSchema,
} from "./common";

export const gatewayAuthSchema = z.object({
  gateway_id: z.string().trim().min(1).max(191),
  secret: z.string().min(1).max(255),
});

export const gatewayEventSchema = z.object({
  event_id: z.string().uuid(),
  device_id: z.string().min(1),
  room_code: z.string().trim().min(1).optional(),
  student_nim: z.string().trim().min(1).optional(),
  event_type: accessEventTypeSchema,
  event_at: z.string().datetime(),
  access_result: accessResultSchema,
  liveness_result: livenessResultSchema.optional(),
  confidence_score: z.number().min(0).max(1).optional(),
  schedule_ref: z.string().trim().min(1).max(120).optional(),
  gateway_id: z.string().trim().min(1).optional(),
  sync_version: z.number().int().min(1).optional(),
});

export const gatewayEventsBatchSchema = z.object({
  batch_id: z.string().trim().min(1).max(120),
  events: z.array(gatewayEventSchema).min(1).max(500),
});

export const gatewayHeartbeatSchema = z.object({
  gateway_id: z.string().trim().min(1).max(64),
  device_id: z.string().trim().min(1).max(64),
  status: deviceStatusSchema,
  queued_events: z.number().int().min(0).default(0),
  sent_at: z.string().datetime(),
});

export const gatewayReferenceQuerySchema = z.object({
  device_id: z.string().trim().min(1).max(64),
  since: z.string().datetime().optional(),
});

export const gatewayReferenceAckSchema = z.object({
  device_id: z.string().trim().min(1).max(64),
  dataset_name: z.string().trim().min(1).max(80),
  dataset_version: z.string().trim().min(1).max(120),
  checksum: z.string().trim().min(1).max(160).optional(),
  applied_at: z.string().datetime(),
});

export type GatewayAuthInput = z.infer<typeof gatewayAuthSchema>;
export type GatewayEventInput = z.infer<typeof gatewayEventSchema>;
export type GatewayEventsBatchInput = z.infer<typeof gatewayEventsBatchSchema>;
export type GatewayHeartbeatInput = z.infer<typeof gatewayHeartbeatSchema>;
export type GatewayReferenceQueryInput = z.infer<typeof gatewayReferenceQuerySchema>;
export type GatewayReferenceAckInput = z.infer<typeof gatewayReferenceAckSchema>;
