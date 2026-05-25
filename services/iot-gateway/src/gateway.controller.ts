import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Post,
} from "@nestjs/common";

import { SerialService } from "./serial.service";

@Controller("gateway")
export class GatewayController {
  private readonly logger = new Logger(GatewayController.name);

  constructor(private readonly serial: SerialService) {}

  @Post("unlock")
  unlock() {
    return this.send("UNLOCK", () => this.serial.sendUnlock());
  }

  @Post("lock")
  lock() {
    return this.send("LOCK", () => this.serial.sendLock());
  }

  @Post("ping")
  ping() {
    return this.send("PING", () => this.serial.sendPing());
  }

  @Post("status/refresh")
  refreshStatus() {
    return this.send("STATUS", () => this.serial.sendStatus());
  }

  @Get("status")
  status() {
    return this.serial.getState();
  }

  private send(command: string, fn: () => void) {
    try {
      this.logger.log(`HTTP command received: ${command}`);
      fn();
      return { ok: true, command };
    } catch (err) {
      throw new HttpException(
        { ok: false, command, error: (err as Error).message },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
