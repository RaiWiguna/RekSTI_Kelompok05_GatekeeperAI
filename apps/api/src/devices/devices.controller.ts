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
  createDeviceSchema,
  devicesListQuerySchema,
  updateDeviceSchema,
  uuidParamSchema,
  type CreateDeviceInput,
  type DevicesListQueryInput,
  type UpdateDeviceInput,
  type UuidParamInput,
} from "@gatekeeper/shared-validation";

import { AdminRoute } from "../common/auth/admin-route.decorator";
import { successResponse } from "../common/http/api-response";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { DevicesService } from "./devices.service";

@Controller("devices")
@AdminRoute()
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get()
  async list(
    @Query(new ZodValidationPipe(devicesListQuerySchema))
    query: DevicesListQueryInput,
  ) {
    const result = await this.devicesService.list(query);
    return successResponse(result.data, result.meta);
  }

  @Get(":id")
  async getById(
    @Param(new ZodValidationPipe(uuidParamSchema))
    params: UuidParamInput,
  ) {
    const data = await this.devicesService.getById(params.id);
    return successResponse(data);
  }

  @Post()
  async create(
    @Body(new ZodValidationPipe(createDeviceSchema))
    payload: CreateDeviceInput,
  ) {
    const data = await this.devicesService.create(payload);
    return successResponse(data);
  }

  @Patch(":id")
  async update(
    @Param(new ZodValidationPipe(uuidParamSchema))
    params: UuidParamInput,
    @Body(new ZodValidationPipe(updateDeviceSchema))
    payload: UpdateDeviceInput,
  ) {
    const data = await this.devicesService.update(params.id, payload);
    return successResponse(data);
  }

  @Delete(":id")
  async remove(
    @Param(new ZodValidationPipe(uuidParamSchema))
    params: UuidParamInput,
  ) {
    const data = await this.devicesService.remove(params.id);
    return successResponse(data);
  }
}
