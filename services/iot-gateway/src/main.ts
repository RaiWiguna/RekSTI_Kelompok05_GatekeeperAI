import "reflect-metadata";

import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";

import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  app.setGlobalPrefix("v1");

  const port = Number(process.env.IOT_GATEWAY_PORT ?? 3002);
  await app.listen(port, "0.0.0.0");
}

void bootstrap();

