import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawn } from "node:child_process";

const workspaceRoot = resolve(import.meta.dirname, "..");
const serviceDir = resolve(workspaceRoot, "services", "face-recognition");
const modelPath = process.env.MODEL_PATH ?? "./models/model.tflite";
const host = process.env.FACE_RECOGNITION_HOST ?? "127.0.0.1";
const port = process.env.FACE_RECOGNITION_PORT ?? "8000";
const pythonCommand = process.env.PYTHON ?? "python";

if (!existsSync(resolve(serviceDir, modelPath))) {
  console.error(`[face-recognition] Model file not found: ${resolve(serviceDir, modelPath)}`);
  process.exit(1);
}

console.log(`[face-recognition] Starting local AI service on http://${host}:${port}`);
console.log(`[face-recognition] Using model: ${modelPath}`);

const child = spawn(
  pythonCommand,
  ["-m", "uvicorn", "main:app", "--host", host, "--port", port],
  {
    cwd: serviceDir,
    env: {
      ...process.env,
      MODEL_PATH: modelPath,
    },
    stdio: "inherit",
  },
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.exit(1);
  }
  process.exit(code ?? 0);
});
