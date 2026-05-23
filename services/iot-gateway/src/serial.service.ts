import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { SerialPort } from "serialport";
import { ReadlineParser } from "@serialport/parser-readline";

const DEFAULT_SERIAL_PATH = "COM5";
const BAUD_RATE = 115200;
const RECONNECT_DELAY_MS = 3000;

type LockState = "LOCKED" | "UNLOCKED" | "UNKNOWN";
type DoorState = "DOOR_OPENED" | "DOOR_CLOSED" | "UNKNOWN";

export interface GatewayState {
  port: string;
  connected: boolean;
  lock: LockState;
  door: DoorState;
  lastEventAt: string | null;
  lastEvent: string | null;
}

@Injectable()
export class SerialService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger("SerialService");
  private readonly path = process.env.ESP32_SERIAL_PORT ?? DEFAULT_SERIAL_PATH;
  private port: SerialPort | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private state: GatewayState = {
    port: this.path,
    connected: false,
    lock: "UNKNOWN",
    door: "UNKNOWN",
    lastEventAt: null,
    lastEvent: null,
  };

  onModuleInit() {
    this.open();
  }

  onModuleDestroy() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.port?.isOpen) this.port.close();
  }

  private open() {
    this.logger.log(`Opening ${this.path} @ ${BAUD_RATE}`);

    const port = new SerialPort({
      path: this.path,
      baudRate: BAUD_RATE,
      autoOpen: false,
    });
    const parser = port.pipe(new ReadlineParser({ delimiter: "\n" }));

    port.open((err) => {
      if (err) {
        this.logger.error(`Open failed (${this.path}): ${err.message}`);
        this.state.connected = false;
        this.scheduleReconnect();
        return;
      }
      this.state.connected = true;
      this.logger.log(`Connected to ${this.path}`);
    });

    port.on("error", (err) => {
      this.logger.error(`Serial error: ${err.message}`);
      this.state.connected = false;
    });

    port.on("close", () => {
      this.logger.warn(`Serial closed: ${this.path}`);
      this.state.connected = false;
      this.scheduleReconnect();
    });

    parser.on("data", (raw: string) => {
      const line = raw.trim();
      if (line.length > 0) this.handleEvent(line);
    });

    this.port = port;
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.open();
    }, RECONNECT_DELAY_MS);
  }

  private handleEvent(line: string) {
    // Sesuai docs/iot-serial-protocol.md §3 — semua event dari ESP32 muncul di sini.
    this.logger.log(`<-- ${line}`);
    this.state.lastEventAt = new Date().toISOString();
    this.state.lastEvent = line;

    if (line === "LOCKED" || line === "UNLOCKED") {
      this.state.lock = line;
    } else if (line === "DOOR_OPENED" || line === "DOOR_CLOSED") {
      this.state.door = line;
    }
    // READY, ACK:*, PONG, ERR:* hanya dicatat di lastEvent.
  }

  private write(command: string) {
    if (!this.port || !this.state.connected) {
      throw new Error(`Serial port ${this.path} not connected`);
    }
    this.logger.log(`--> ${command}`);
    this.port.write(`${command}\n`);
  }

  sendUnlock() {
    this.write("UNLOCK");
  }

  sendLock() {
    this.write("LOCK");
  }

  sendPing() {
    this.write("PING");
  }

  sendStatus() {
    this.write("STATUS");
  }

  getState(): GatewayState {
    return { ...this.state };
  }
}
