import { spawn } from "node:child_process";

import {
  dockerCommand,
  killProcessTree,
  loadWorkspaceEnv,
  pnpmCommand,
  runCommand,
  waitForUrl,
  wireChildLifecycle,
  workspaceRoot,
} from "./dev-utils.mjs";

const target = process.argv[2];

if (!target || !["web", "mobile"].includes(target)) {
  console.error("Usage: node scripts/dev-stack.mjs <web|mobile>");
  process.exit(1);
}

const envPath = loadWorkspaceEnv();
const apiPort = Number.parseInt(process.env.API_PORT ?? "3001", 10);
const frontendCommand =
  target === "web"
    ? [pnpmCommand, ["--filter", "@gatekeeper/web", "dev"], process.env]
    : [
        pnpmCommand,
        ["--filter", "@gatekeeper/mobile", "dev"],
        {
          ...process.env,
          EXPO_PUBLIC_API_BASE_URL:
            process.env.EXPO_PUBLIC_API_BASE_URL ?? `http://10.0.2.2:${apiPort}/v1`,
        },
      ];

async function main() {
  console.log(`[dev-stack] Preparing ${target} stack...`);

  await runCommand(dockerCommand, ["compose", "-f", "infra/docker/docker-compose.yml", "up", "-d"], {
    cwd: workspaceRoot,
  });
  await runCommand(pnpmCommand, ["db:generate"], { cwd: workspaceRoot });
  await runCommand(pnpmCommand, ["db:migrate:deploy"], { cwd: workspaceRoot });

  const apiProcess = spawn(pnpmCommand, ["--filter", "@gatekeeper/api", "dev"], {
    cwd: workspaceRoot,
    env: process.env,
    stdio: "inherit",
    shell: false,
  });

  const managedChildren = [apiProcess];
  wireChildLifecycle(managedChildren);

  await waitForUrl(`http://localhost:${apiPort}/v1/health`, {
    timeoutMs: 45_000,
  });

  console.log(`[dev-stack] API is ready on http://localhost:${apiPort}/v1`);
  if (envPath) {
    console.log(`[dev-stack] Environment loaded from ${envPath}`);
  }

  if (target === "mobile") {
    console.log(
      `[dev-stack] Mobile default API base URL: ${frontendCommand[2].EXPO_PUBLIC_API_BASE_URL}`,
    );
  }

  const frontendProcess = spawn(frontendCommand[0], frontendCommand[1], {
    cwd: workspaceRoot,
    env: frontendCommand[2],
    stdio: "inherit",
    shell: false,
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
