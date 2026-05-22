import {
  networkInterfaces,
} from "node:os";

import {
  dockerCommand,
  isWindows,
  killProcessTree,
  loadWorkspaceEnv,
  pnpmCommand,
  runCommandCapture,
  runCommand,
  spawnCommand,
  waitForUrl,
  wireChildLifecycle,
  workspaceRoot,
} from "./dev-utils.mjs";

const target = process.argv[2];
const mobileMode = process.argv[3] ?? process.env.MOBILE_API_TARGET ?? "android";

if (!target || !["web", "mobile"].includes(target)) {
  console.error("Usage: node scripts/dev-stack.mjs <web|mobile> [android|device|localhost]");
  process.exit(1);
}

if (target === "mobile" && !["android", "device", "localhost"].includes(mobileMode)) {
  console.error("Mobile mode must be one of: android, device, localhost.");
  process.exit(1);
}

const envPath = loadWorkspaceEnv();
const apiPort = Number.parseInt(process.env.API_PORT ?? "3001", 10);
const skipDocker = process.env.SKIP_DOCKER === "1";
const postgresPort = parsePort(process.env.POSTGRES_PORT, 55432);
const redisPort = parsePort(process.env.REDIS_PORT, 56379);
const composeArgs = [
  "compose",
  ...(envPath ? ["--env-file", envPath] : []),
  "-f",
  "infra/docker/docker-compose.yml",
];
const mobileApiBaseUrl = resolveMobileApiBaseUrl(apiPort, mobileMode);
const frontendCommand =
  target === "web"
    ? [pnpmCommand, ["--filter", "@gatekeeper/web", "dev"], process.env]
    : [
        pnpmCommand,
        ["--filter", "@gatekeeper/mobile", "dev"],
        {
          ...process.env,
          EXPO_NO_DEPENDENCY_VALIDATION: process.env.EXPO_NO_DEPENDENCY_VALIDATION ?? "1",
          EXPO_PUBLIC_API_BASE_URL: mobileApiBaseUrl,
        },
      ];

async function main() {
  console.log(`[dev-stack] Preparing ${target} stack...`);

  if (skipDocker) {
    console.log("[dev-stack] SKIP_DOCKER=1 detected. Skipping docker compose setup.");
  } else {
    await ensureDockerPortsAvailable();
    await ensureDockerReady();
    await runCommand(dockerCommand, [...composeArgs, "up", "-d"], {
      cwd: workspaceRoot,
    });
  }

  await runCommand(pnpmCommand, ["db:generate"], { cwd: workspaceRoot });
  await runCommand(pnpmCommand, ["db:migrate:deploy"], { cwd: workspaceRoot });

  const apiProcess = spawnCommand(pnpmCommand, ["--filter", "@gatekeeper/api", "dev"], {
    cwd: workspaceRoot,
    env: {
      ...process.env,
      SKIP_API_PREDEV: "1",
    },
    stdio: "inherit",
  });

  const managedChildren = [apiProcess];
  wireChildLifecycle(managedChildren);
  const apiExitPromise = new Promise((resolvePromise, rejectPromise) => {
    apiProcess.once("error", rejectPromise);
    apiProcess.once("exit", (code, signal) => {
      rejectPromise(
        new Error(
          `API process exited before becoming healthy (code ${code ?? "null"}${signal ? `, signal ${signal}` : ""}).`,
        ),
      );
    });
  });

  await Promise.race([
    waitForUrl(`http://localhost:${apiPort}/v1/health`, {
      timeoutMs: 45_000,
    }),
    apiExitPromise,
  ]);

  console.log(`[dev-stack] API is ready on http://localhost:${apiPort}/v1`);
  if (envPath) {
    console.log(`[dev-stack] Environment loaded from ${envPath}`);
  }

  if (target === "mobile") {
    console.log(`[dev-stack] Mobile API target mode: ${mobileMode}`);
    console.log(
      `[dev-stack] Mobile API base URL: ${frontendCommand[2].EXPO_PUBLIC_API_BASE_URL}`,
    );

    if (mobileMode === "device") {
      console.log("[dev-stack] Use this mode for Expo Go on a physical device connected to the same network.");
    }
  }

  const frontendProcess = spawnCommand(frontendCommand[0], frontendCommand[1], {
    cwd: workspaceRoot,
    env: frontendCommand[2],
    stdio: "inherit",
  });

  managedChildren.push(frontendProcess);

  frontendProcess.once("exit", async (code) => {
    if (apiProcess.pid) {
      await killProcessTree(apiProcess.pid).catch(() => undefined);
    }

    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  console.error(`[dev-stack] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});

async function ensureDockerReady() {
  const dockerInfo = await runCommandCapture(dockerCommand, ["info"], { allowFailure: true });
  if (dockerInfo.exitCode === 0) {
    return;
  }

  const details = (dockerInfo.stderr || dockerInfo.stdout).trim();
  const guidance = [
    "Docker daemon is not reachable.",
    "Start Docker Desktop, wait until the engine status is Running, then retry.",
    "If PostgreSQL and Redis are already available outside Docker, run with SKIP_DOCKER=1.",
    "Windows PowerShell example: $env:SKIP_DOCKER='1'; pnpm dev:mobile:stack",
  ].join("\n");

  throw new Error(details ? `${guidance}\n\nDocker output:\n${details}` : guidance);
}

async function ensureDockerPortsAvailable() {
  if (!isWindows) {
    return;
  }

  const excludedRanges = await getWindowsExcludedPortRanges();
  const blockedPorts = [
    ["POSTGRES_PORT", postgresPort],
    ["REDIS_PORT", redisPort],
  ].filter(([, port]) => isPortExcluded(port, excludedRanges));

  if (blockedPorts.length === 0) {
    return;
  }

  const details = blockedPorts.map(([name, port]) => `${name}=${port}`).join(", ");
  const guidance = [
    `Windows excluded port range blocks: ${details}.`,
    "Choose a different host port (for example POSTGRES_PORT=56432) and update related URLs.",
    "If POSTGRES_PORT changes, DATABASE_URL must use the same new port.",
    "PowerShell example:",
    "$env:POSTGRES_PORT='56432'",
    "$env:DATABASE_URL='postgresql://postgres:postgres@localhost:56432/gatekeeper?schema=public'",
    "pnpm dev:web:stack",
  ].join("\n");

  throw new Error(guidance);
}

async function getWindowsExcludedPortRanges() {
  const { stdout } = await runCommandCapture("netsh", ["int", "ipv4", "show", "excludedportrange", "protocol=tcp"], {
    allowFailure: true,
  });

  return stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .map((line) => line.match(/^(\d+)\s+(\d+)/))
    .filter(Boolean)
    .map((match) => ({
      start: Number.parseInt(match[1], 10),
      end: Number.parseInt(match[2], 10),
    }))
    .filter((range) => Number.isFinite(range.start) && Number.isFinite(range.end));
}

function isPortExcluded(port, ranges) {
  return ranges.some((range) => port >= range.start && port <= range.end);
}

function parsePort(rawValue, fallback) {
  const parsed = Number.parseInt(rawValue ?? String(fallback), 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return parsed;
}

function resolveMobileApiBaseUrl(port, mode) {
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL.replace(/\/$/, "");
  }

  if (mode === "localhost") {
    return `http://localhost:${port}/v1`;
  }

  if (mode === "device") {
    return `http://${getLanAddress()}:${port}/v1`;
  }

  return `http://10.0.2.2:${port}/v1`;
}

function getLanAddress() {
  const interfaces = networkInterfaces();

  for (const entries of Object.values(interfaces)) {
    for (const entry of entries ?? []) {
      if (entry.family === "IPv4" && !entry.internal) {
        return entry.address;
      }
    }
  }

  throw new Error(
    "Unable to detect a LAN IPv4 address for mobile device mode. Set EXPO_PUBLIC_API_BASE_URL manually.",
  );
}
