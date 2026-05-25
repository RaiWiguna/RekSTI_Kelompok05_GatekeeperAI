export function buildIotGatewayCommandUrl(baseUrl: string, action: "unlock" | "lock") {
  return buildIotGatewayUrl(baseUrl, `gateway/${action}`);
}

export function buildIotGatewayUrl(baseUrl: string, path: string) {
  const normalizedBaseUrl = baseUrl
    .replace(/\/+$/, "")
    .replace(/\/v1$/i, "");
  const normalizedPath = path.replace(/^\/+/, "");

  return `${normalizedBaseUrl}/v1/${normalizedPath}`;
}
