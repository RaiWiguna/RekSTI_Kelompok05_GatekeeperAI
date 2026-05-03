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
  createUserAccountSchema,
  updateUserAccountSchema,
  updateUserPasswordSchema,
  usersListQuerySchema,
  uuidParamSchema,
  type CreateUserAccountInput,
  type UpdateUserAccountInput,
  type UpdateUserPasswordInput,
  type UsersListQueryInput,
  type UuidParamInput,
} from "@gatekeeper/shared-validation";

import { AdminRoute } from "../common/auth/admin-route.decorator";
import { successResponse } from "../common/http/api-response";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { UsersService } from "./users.service";

@Controller("users")
@AdminRoute()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async list(
    @Query(new ZodValidationPipe(usersListQuerySchema))
    query: UsersListQueryInput,
  ) {
    const result = await this.usersService.list(query);
    return successResponse(result.data, result.meta);
  }

  @Get(":id")
  async getById(
    @Param(new ZodValidationPipe(uuidParamSchema))
    params: UuidParamInput,
  ) {
    const data = await this.usersService.getById(params.id);
    return successResponse(data);
  }

  @Post()
  async create(
    @Body(new ZodValidationPipe(createUserAccountSchema))
    payload: CreateUserAccountInput,
  ) {
    const data = await this.usersService.create(payload);
    return successResponse(data);
  }

  @Patch(":id")
  async update(
    @Param(new ZodValidationPipe(uuidParamSchema))
    params: UuidParamInput,
    @Body(new ZodValidationPipe(updateUserAccountSchema))
    payload: UpdateUserAccountInput,
  ) {
    const data = await this.usersService.update(params.id, payload);
    return successResponse(data);
  }

  @Patch(":id/password")
  async updatePassword(
    @Param(new ZodValidationPipe(uuidParamSchema))
    params: UuidParamInput,
    @Body(new ZodValidationPipe(updateUserPasswordSchema))
    payload: UpdateUserPasswordInput,
  ) {
    const data = await this.usersService.updatePassword(params.id, payload);
    return successResponse(data);
  }

  @Delete(":id")
  async remove(
    @Param(new ZodValidationPipe(uuidParamSchema))
    params: UuidParamInput,
  ) {
    const data = await this.usersService.remove(params.id);
    return successResponse(data);
  }
}
