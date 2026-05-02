export function successResponse<T>(data: T, meta: Record<string, unknown> = {}) {
  return {
    success: true as const,
    data,
    meta,
  };
}

export function errorResponse(code: string, message: string) {
  return {
    success: false as const,
    error: {
      code,
      message,
    },
  };
}
