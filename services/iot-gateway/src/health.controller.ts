import { Controller, Get } from "@nestjs/common";

@Controller("health")
export class GatewayHealthController {
  @Get()
  health() {
    return {
      service: "iot-gateway",
      status: "ok",
    };
  }
}

