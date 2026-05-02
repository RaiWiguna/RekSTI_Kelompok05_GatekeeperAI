import type { NextRequest } from "next/server";

const API_PROXY_TARGET =
  process.env.API_PROXY_TARGET?.replace(/\/$/, "") ?? "http://localhost:3001/v1";

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function OPTIONS(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

async function proxyRequest(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  const targetUrl = `${API_PROXY_TARGET}/${path.join("/")}${request.nextUrl.search}`;
  const body = shouldHaveBody(request.method) ? await request.text() : undefined;

  const response = await fetch(targetUrl, {
    method: request.method,
    headers: buildProxyHeaders(request),
    body,
    cache: "no-store",
  });

  return new Response(response.body, {
    status: response.status,
    headers: buildResponseHeaders(response),
  });
}

function shouldHaveBody(method: string) {
  return method !== "GET" && method !== "HEAD";
}

function buildProxyHeaders(request: NextRequest) {
  const headers = new Headers();
  const forwardableHeaders = ["authorization", "content-type"];

  for (const headerName of forwardableHeaders) {
    const value = request.headers.get(headerName);
    if (value) {
      headers.set(headerName, value);
    }
  }

  return headers;
}

function buildResponseHeaders(response: Response) {
  const headers = new Headers();
  const contentType = response.headers.get("content-type");

  if (contentType) {
    headers.set("content-type", contentType);
  }

  return headers;
}
