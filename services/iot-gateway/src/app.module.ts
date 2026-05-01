import { Module } from "@nestjs/common";

import { GatewayHealthController } from "./health.controller";

@Module({
  controllers: [GatewayHealthController],
})
export class AppModule {}

