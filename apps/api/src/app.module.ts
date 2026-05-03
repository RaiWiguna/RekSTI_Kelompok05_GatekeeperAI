import { Module } from "@nestjs/common";

import { AuthModule } from "./auth/auth.module";
import { ClassesModule } from "./classes/classes.module";
import { CoursesModule } from "./courses/courses.module";
import { DatabaseModule } from "./database/database.module";
import { DevicesModule } from "./devices/devices.module";
import { EnrollmentsModule } from "./enrollments/enrollments.module";
import { HealthController } from "./health.controller";
import { LecturersModule } from "./lecturers/lecturers.module";
import { MeModule } from "./me/me.module";
import { RoomsModule } from "./rooms/rooms.module";
import { SchedulesModule } from "./schedules/schedules.module";
import { StudentsModule } from "./students/students.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    MeModule,
    UsersModule,
    StudentsModule,
    LecturersModule,
    RoomsModule,
    DevicesModule,
    CoursesModule,
    ClassesModule,
    SchedulesModule,
    EnrollmentsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
