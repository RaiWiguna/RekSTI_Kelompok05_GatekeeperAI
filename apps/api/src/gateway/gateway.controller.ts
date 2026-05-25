import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import {
  gatewayAuthSchema,
  gatewayEventSchema,
  gatewayEventsBatchSchema,
  gatewayHeartbeatSchema,
  gatewayReferenceAckSchema,
  gatewayReferenceQuerySchema,
  type GatewayAuthInput,
  type GatewayEventInput,
  type GatewayEventsBatchInput,
  type GatewayHeartbeatInput,
  type GatewayReferenceAckInput,
  type GatewayReferenceQueryInput,
} from "@gatekeeper/shared-validation";

import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { Roles } from "../common/auth/roles.decorator";
import { RolesGuard } from "../common/auth/roles.guard";
import { successResponse } from "../common/http/api-response";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { GatewayService } from "./gateway.service";

@Controller("gateway")
export class GatewayController {
  constructor(private readonly gatewayService: GatewayService) {}

  @Post("auth")
  async auth(
    @Body(new ZodValidationPipe(gatewayAuthSchema))
    payload: GatewayAuthInput,
  ) {
    const data = await this.gatewayService.auth(payload);
    return successResponse(data);
  }

  @Post("events")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("gateway")
  async uploadEvent(
    @Body(new ZodValidationPipe(gatewayEventSchema))
    payload: GatewayEventInput,
  ) {
    const data = await this.gatewayService.uploadEvent(payload);
    return successResponse(data);
  }

  @Post("events/batch")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("gateway")
  async uploadBatch(
    @Body(new ZodValidationPipe(gatewayEventsBatchSchema))
    payload: GatewayEventsBatchInput,
  ) {
    const data = await this.gatewayService.uploadBatch(payload);
    return successResponse(data);
  }

  @Post("heartbeat")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("gateway")
  async heartbeat(
    @Body(new ZodValidationPipe(gatewayHeartbeatSchema))
    payload: GatewayHeartbeatInput,
  ) {
    const data = await this.gatewayService.heartbeat(payload);
    return successResponse(data);
  }

  @Get("reference/version")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("gateway")
  async referenceVersion(
    @Query(new ZodValidationPipe(gatewayReferenceQuerySchema))
    query: GatewayReferenceQueryInput,
  ) {
    const data = await this.gatewayService.referenceVersion(query);
    return successResponse(data);
  }

  @Get("reference/snapshot")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("gateway")
  async referenceSnapshot(
    @Query(new ZodValidationPipe(gatewayReferenceQuerySchema))
    query: GatewayReferenceQueryInput,
  ) {
    const data = await this.gatewayService.referenceSnapshot(query);
    return successResponse(data);
  }

  @Get("reference/delta")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("gateway")
  async referenceDelta(
    @Query(new ZodValidationPipe(gatewayReferenceQuerySchema))
    query: GatewayReferenceQueryInput,
  ) {
    const data = await this.gatewayService.referenceSnapshot(query);
    return successResponse(data);
  }

  @Post("reference/ack")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("gateway")
  async referenceAck(
    @Body(new ZodValidationPipe(gatewayReferenceAckSchema))
    payload: GatewayReferenceAckInput,
  ) {
    const data = await this.gatewayService.referenceAck(payload);
    return successResponse(data);
  }
}
