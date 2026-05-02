import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from "@nestjs/common";

type SafeParseResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: {
        flatten(): unknown;
      };
    };

interface SchemaLike<T> {
  safeParse(value: unknown): SafeParseResult<T>;
}

@Injectable()
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: SchemaLike<T>) {}

  transform(value: unknown, _metadata: ArgumentMetadata) {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      const formatted = result.error.flatten();
      throw new BadRequestException({
        code: "invalid_payload",
        message: "Payload is invalid",
        details: formatted,
      });
    }

    return result.data;
  }
}
