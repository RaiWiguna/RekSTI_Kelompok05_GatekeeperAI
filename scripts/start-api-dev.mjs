import { spawn } from "node:child_process";
import { resolve } from "node:path";

import {
  apiDir,
  findListeningPids,
  getProcessDetails,
  killProcessTree,
  loadWorkspaceEnv,
  nodeCommand,
  pnpmCommand,
  runCommand,
  workspaceRoot,
  wireChildLifecycle,
} from "./dev-utils.mjs";

const envPath = loadWorkspaceEnv();
const apiPort = Number.parseInt(process.env.API_PORT ?? "3001", 10);

async function main() {
  await ensureApiPortIsAvailable(apiPort);
  await runCommand(pnpmCommand, ["--dir", workspaceRoot, "db:generate"], { stdio: "inherit" });

  const child = spawn(
    nodeCommand,
    ["--watch", "-r", "ts-node/register", "src/main.ts"],
    {
      cwd: apiDir,
      env: process.env,
      stdio: "inherit",
      shell: false,
    },
  );

  wireChildLifecycle([child]);

  child.once("exit", (code) => {
    process.exit(code ?? 0);
  });
}

async function ensureApiPortIsAvailable(port) {
  const pids = await findListeningPids(port);

  if (pids.length === 0) {
    return;
  }

  for (const pid of pids) {
    const details = await getProcessDetails(pid);

    if (isWorkspaceApiProcess(details)) {
      console.log(
        `[api-dev] Port ${port} is occupied by a previous Gatekeeper API process (PID ${pid}). Stopping it first...`,
      );
      await killProcessTree(pid);
      continue;
    }

    const processLabel = details?.Name ?? "unknown";
    const commandLine = details?.CommandLine ?? "[command line unavailable]";
    throw new Error(
      [
        `Port ${port} is already in use by PID ${pid} (${processLabel}).`,
        `Command line: ${commandLine}`,
        "Stop that process manually or change API_PORT in .env before running the API dev server.",
      ].join(" "),
    );
  }
}

function isWorkspaceApiProcess(details) {
  if (!details) {
    return false;
  }

  const commandLine = String(details.CommandLine ?? "").toLowerCase();
  const executablePath = String(details.ExecutablePath ?? "").toLowerCase();
  const workspaceMarker = resolve(workspaceRoot).toLowerCase();

  return (
    (String(details.Name ?? "").toLowerCase() === "node.exe" ||
      String(details.Name ?? "").toLowerCase() === "node") &&
    (commandLine.includes("src/main.ts") || commandLine.includes("start-api-dev.mjs")) &&
    (commandLine.includes("apps\\api") ||
      commandLine.includes("apps/api") ||
      commandLine.includes(workspaceMarker) ||
      executablePath.includes("node"))
  );
}

main().catch((error) => {
  console.error(`[api-dev] ${error instanceof Error ? error.message : String(error)}`);
  if (envPath) {
    console.error(`[api-dev] Loaded environment from ${envPath}`);
  }
  process.exit(1);
});
