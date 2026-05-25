import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { appEnv } from "../config/app-env";
import { GatewayController } from "./gateway.controller";
import { GatewayService } from "./gateway.service";

@Module({
  imports: [
    JwtModule.register({
      secret: appEnv.JWT_SECRET,
    }),
  ],
  controllers: [GatewayController],
  providers: [GatewayService],
})
export class GatewayModule {}
