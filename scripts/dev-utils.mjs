import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

import { config as loadDotenv } from "dotenv";

const currentDir = dirname(fileURLToPath(import.meta.url));

export const workspaceRoot = resolve(currentDir, "..");
export const apiDir = resolve(workspaceRoot, "apps", "api");
export const isWindows = process.platform === "win32";
export const nodeCommand = process.execPath;
export const pnpmCommand = isWindows ? "pnpm.cmd" : "pnpm";
export const dockerCommand = isWindows ? "docker.exe" : "docker";
export const powershellCommand = isWindows
  ? "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe"
  : null;

const envCandidates = [
  resolve(workspaceRoot, ".env"),
  resolve(apiDir, ".env"),
];

export function loadWorkspaceEnv() {
  const envPath = envCandidates.find((candidate) => existsSync(candidate));

  if (envPath) {
    loadDotenv({ path: envPath });
  }

  return envPath ?? null;
}

export async function runCommand(command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: options.cwd ?? workspaceRoot,
    env: {
      ...process.env,
      ...(options.env ?? {}),
    },
    stdio: options.stdio ?? "inherit",
    shell: false,
  });

  const [exitCode, signal] = await new Promise((resolvePromise, rejectPromise) => {
    child.once("error", rejectPromise);
    child.once("exit", (code, exitSignal) => resolvePromise([code, exitSignal]));
  });

  if (exitCode !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} exited with code ${exitCode ?? "null"}${signal ? ` (${signal})` : ""}.`,
    );
  }
}

export async function runCommandCapture(command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: options.cwd ?? workspaceRoot,
    env: {
      ...process.env,
      ...(options.env ?? {}),
    },
    stdio: ["ignore", "pipe", "pipe"],
    shell: false,
  });

  let stdout = "";
  let stderr = "";

  child.stdout?.on("data", (chunk) => {
    stdout += String(chunk);
  });

  child.stderr?.on("data", (chunk) => {
    stderr += String(chunk);
  });

  const [exitCode] = await new Promise((resolvePromise, rejectPromise) => {
    child.once("error", rejectPromise);
    child.once("exit", (code, signal) => resolvePromise([code, signal]));
  });

  if (exitCode !== 0 && !options.allowFailure) {
    throw new Error(stderr.trim() || stdout.trim() || `${command} failed with exit code ${exitCode}.`);
  }

  return {
    stdout,
    stderr,
    exitCode: exitCode ?? 0,
  };
}

export async function killProcessTree(pid) {
  if (isWindows) {
    await runCommand("taskkill.exe", ["/PID", String(pid), "/T", "/F"], { stdio: "ignore" });
    return;
  }

  process.kill(pid, "SIGTERM");
}

export async function waitForUrl(url, options = {}) {
  const timeoutMs = options.timeoutMs ?? 30_000;
  const intervalMs = options.intervalMs ?? 1_000;
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (response.ok) {
        return;
      }
    } catch {
      // Keep polling until the timeout is reached.
    }

    await delay(intervalMs);
  }

  throw new Error(`Timed out waiting for ${url}.`);
}

export async function findListeningPids(port) {
  if (isWindows) {
    const { stdout } = await runCommandCapture("netstat.exe", ["-ano"], { allowFailure: true });
    const lines = stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.includes(`:${port}`) && line.includes("LISTENING"));

    return [...new Set(lines.map((line) => Number.parseInt(line.split(/\s+/).at(-1) ?? "", 10)).filter(Number.isFinite))];
  }

  const { stdout } = await runCommandCapture("lsof", ["-ti", `tcp:${port}`], { allowFailure: true });
  return [...new Set(stdout.split(/\r?\n/).map((line) => Number.parseInt(line, 10)).filter(Number.isFinite))];
}

export async function getProcessDetails(pid) {
  if (isWindows && powershellCommand) {
    const script = [
      `$process = Get-CimInstance Win32_Process -Filter "ProcessId = ${pid}" | Select-Object ProcessId, Name, CommandLine, ExecutablePath`,
      "if ($process) { $process | ConvertTo-Json -Compress }",
    ].join("; ");

    const { stdout } = await runCommandCapture(
      powershellCommand,
      ["-NoProfile", "-Command", script],
      { allowFailure: true },
    );

    const normalized = stdout.trim();
    return normalized ? JSON.parse(normalized) : null;
  }

  const { stdout } = await runCommandCapture("ps", ["-p", String(pid), "-o", "pid=,comm=,args="], {
    allowFailure: true,
  });

  const normalized = stdout.trim();
  if (!normalized) {
    return null;
  }

  const parts = normalized.split(/\s+/);
  return {
    ProcessId: pid,
    Name: parts[1] ?? "unknown",
    CommandLine: parts.slice(2).join(" "),
    ExecutablePath: parts[1] ?? null,
  };
}

export function wireChildLifecycle(children) {
  const shutdown = async () => {
    await Promise.all(
      children
        .filter((child) => child && child.pid)
        .map((child) => killProcessTree(child.pid).catch(() => undefined)),
    );
  };

  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, () => {
      void shutdown().finally(() => process.exit(0));
    });
  }

  process.on("exit", () => {
    for (const child of children) {
      if (child?.pid) {
        try {
          child.kill();
        } catch {
          // Ignore shutdown cleanup errors.
        }
      }
    }
  });
}
