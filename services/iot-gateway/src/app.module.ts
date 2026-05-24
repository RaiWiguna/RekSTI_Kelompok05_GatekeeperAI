import { Module } from "@nestjs/common";

import { GatewayController } from "./gateway.controller";
import { GatewayHealthController } from "./health.controller";
import { SerialService } from "./serial.service";

@Module({
  controllers: [GatewayHealthController, GatewayController],
  providers: [SerialService],
})
export class AppModule {}
