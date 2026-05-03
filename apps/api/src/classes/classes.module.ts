import { Module } from "@nestjs/common";

import { MeModule } from "../me/me.module";
import { ClassesController } from "./classes.controller";
import { ClassesService } from "./classes.service";

@Module({
  imports: [MeModule],
  controllers: [ClassesController],
  providers: [ClassesService],
})
export class ClassesModule {}
