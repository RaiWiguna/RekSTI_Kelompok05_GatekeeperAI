import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";

import { errorResponse } from "../http/api-response";

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();
      const message =
        typeof payload === "object" && payload !== null && "message" in payload
          ? Array.isArray(payload.message)
            ? payload.message.join(", ")
            : String(payload.message)
          : exception.message;

      const code =
        typeof payload === "object" && payload !== null && "code" in payload
          ? String(payload.code)
          : mapStatusToCode(status);

      response.status(status).json(errorResponse(code, message));
      return;
    }

    this.logger.error(
      "Unhandled API exception",
      exception instanceof Error ? exception.stack : String(exception),
    );

    response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json(errorResponse("internal_error", "Internal server error"));
  }
}

function mapStatusToCode(status: number) {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return "invalid_payload";
    case HttpStatus.UNAUTHORIZED:
      return "invalid_auth";
    case HttpStatus.FORBIDDEN:
      return "forbidden_role";
    case HttpStatus.NOT_FOUND:
      return "not_found";
    case HttpStatus.CONFLICT:
      return "conflict";
    case HttpStatus.UNPROCESSABLE_ENTITY:
      return "invalid_payload";
    default:
      return "http_error";
  }
}
