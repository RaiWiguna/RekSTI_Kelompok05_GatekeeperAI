import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import {
  createRoomSchema,
  roomsListQuerySchema,
  updateRoomSchema,
  uuidParamSchema,
  type CreateRoomInput,
  type RoomsListQueryInput,
  type UpdateRoomInput,
  type UuidParamInput,
} from "@gatekeeper/shared-validation";

import { AdminRoute } from "../common/auth/admin-route.decorator";
import { successResponse } from "../common/http/api-response";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { RoomsService } from "./rooms.service";

@Controller("rooms")
@AdminRoute()
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  async list(
    @Query(new ZodValidationPipe(roomsListQuerySchema))
    query: RoomsListQueryInput,
  ) {
    const result = await this.roomsService.list(query);
    return successResponse(result.data, result.meta);
  }

  @Get(":id")
  async getById(
    @Param(new ZodValidationPipe(uuidParamSchema))
    params: UuidParamInput,
  ) {
    const data = await this.roomsService.getById(params.id);
    return successResponse(data);
  }

  @Post()
  async create(
    @Body(new ZodValidationPipe(createRoomSchema))
    payload: CreateRoomInput,
  ) {
    const data = await this.roomsService.create(payload);
    return successResponse(data);
  }

  @Patch(":id")
  async update(
    @Param(new ZodValidationPipe(uuidParamSchema))
    params: UuidParamInput,
    @Body(new ZodValidationPipe(updateRoomSchema))
    payload: UpdateRoomInput,
  ) {
    const data = await this.roomsService.update(params.id, payload);
    return successResponse(data);
  }

  @Delete(":id")
  async remove(
    @Param(new ZodValidationPipe(uuidParamSchema))
    params: UuidParamInput,
  ) {
    const data = await this.roomsService.remove(params.id);
    return successResponse(data);
  }
}
