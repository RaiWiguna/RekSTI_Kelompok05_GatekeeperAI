import { spawn } from "node:child_process";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import { SerialPort } from "serialport";

const ports = await SerialPort.list();

console.log("Available serial ports:");
if (ports.length === 0) {
  console.log("  No serial ports detected.");
} else {
  ports.forEach((port, index) => {
    const label = [
      port.path,
      port.manufacturer,
      port.friendlyName,
    ].filter(Boolean).join(" - ");
    console.log(`  ${index + 1}. ${label}`);
  });
}

const suggestedPort = ports[0]?.path ?? "";
const rl = readline.createInterface({ input, output });
const answer = await rl.question(
  `Enter ESP32 serial port${suggestedPort ? ` [${suggestedPort}]` : ""}: `,
);
rl.close();

const selectedPort = (answer.trim() || suggestedPort).trim();

if (!selectedPort) {
  console.error("No serial port selected. Connect the ESP32 and try again.");
  process.exit(1);
}

console.log(`Starting IoT gateway on ${selectedPort}...`);

const child = spawn("pnpm", ["run", "dev"], {
  cwd: new URL("..", import.meta.url),
  env: {
    ...process.env,
    ESP32_SERIAL_PORT: selectedPort,
  },
  shell: true,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
