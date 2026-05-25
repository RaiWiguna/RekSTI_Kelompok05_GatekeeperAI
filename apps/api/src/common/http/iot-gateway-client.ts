import { appEnv } from "../../config/app-env";
import { buildIotGatewayCommandUrl, buildIotGatewayUrl } from "./iot-gateway-url";

type IotGatewayCommand = "unlock" | "lock";

export type IotGatewayDispatchResult = {
  ok: boolean;
  url: string;
  status: number | null;
  message: string;
  error: string | null;
};

export type IotGatewayDiagnosticResult = {
  configured_base_url: string;
  health: IotGatewayProbeResult;
  status: IotGatewayProbeResult;
};

type IotGatewayProbeResult = {
  ok: boolean;
  url: string;
  status: number | null;
  message: string;
  body: unknown;
};

export async function dispatchIotGatewayCommand(action: IotGatewayCommand) {
  const url = buildIotGatewayCommandUrl(appEnv.IOT_GATEWAY_BASE_URL, action);
  const response = await requestIotGateway(url, { method: "POST" });

  return {
    ok: response.ok,
    url,
    status: response.status,
    message: response.ok ? "Command sent to IoT gateway" : response.message,
    error: response.ok ? null : response.message,
  } satisfies IotGatewayDispatchResult;
}

export async function diagnoseIotGateway() {
  const [health, status] = await Promise.all([
    probeIotGateway(buildIotGatewayUrl(appEnv.IOT_GATEWAY_BASE_URL, "health")),
    probeIotGateway(buildIotGatewayUrl(appEnv.IOT_GATEWAY_BASE_URL, "gateway/status")),
  ]);

  return {
    configured_base_url: appEnv.IOT_GATEWAY_BASE_URL,
    health,
    status,
  } satisfies IotGatewayDiagnosticResult;
}

async function probeIotGateway(url: string) {
  const response = await requestIotGateway(url, { method: "GET" });

  return {
    ok: response.ok,
    url,
    status: response.status,
    message: response.message,
    body: response.body,
  } satisfies IotGatewayProbeResult;
}

async function requestIotGateway(url: string, init: RequestInit) {
  const controller = new AbortController();
  const timeoutMs = getIotGatewayTimeoutMs();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: "no-store",
    });
    const body = await readResponseBody(response);

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        body,
        message: `IoT gateway returned HTTP ${response.status}${formatGatewayBody(body)}`,
      };
    }

    return {
      ok: true,
      status: response.status,
      body,
      message: "IoT gateway is reachable",
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      body: null,
      message: toIotGatewayErrorMessage(error, timeoutMs),
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function readResponseBody(response: Response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function formatGatewayBody(body: unknown) {
  if (!body) {
    return "";
  }

  if (typeof body === "string") {
    return `: ${body.slice(0, 200)}`;
  }

  return `: ${JSON.stringify(body).slice(0, 200)}`;
}

function getIotGatewayTimeoutMs() {
  const parsed = Number(appEnv.IOT_GATEWAY_REQUEST_TIMEOUT_MS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 5000;
}

function toIotGatewayErrorMessage(error: unknown, timeoutMs: number) {
  if (error instanceof Error && error.name === "AbortError") {
    return `IoT gateway request timed out after ${Math.round(timeoutMs / 1000)} seconds`;
  }

  return error instanceof Error ? error.message : "Unable to reach IoT gateway";
}
