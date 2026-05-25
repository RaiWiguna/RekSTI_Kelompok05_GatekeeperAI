import { Module } from "@nestjs/common";

import { AccessLogsModule } from "./access-logs/access-logs.module";
import { AttendanceRecordsModule } from "./attendance-records/attendance-records.module";
import { AuthModule } from "./auth/auth.module";
import { ClassesModule } from "./classes/classes.module";
import { CoursesModule } from "./courses/courses.module";
import { DatabaseModule } from "./database/database.module";
import { DevicesModule } from "./devices/devices.module";
import { EnrollmentsModule } from "./enrollments/enrollments.module";
import { FaceRegistrationsModule } from "./face-registrations/face-registrations.module";
import { GatewayModule } from "./gateway/gateway.module";
import { HealthController } from "./health.controller";
import { LecturersModule } from "./lecturers/lecturers.module";
import { MeModule } from "./me/me.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { OverridesModule } from "./overrides/overrides.module";
import { RoomsModule } from "./rooms/rooms.module";
import { SchedulesModule } from "./schedules/schedules.module";
import { StudentsModule } from "./students/students.module";
import { SyncModule } from "./sync/sync.module";
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
    AttendanceRecordsModule,
    AccessLogsModule,
    OverridesModule,
    NotificationsModule,
    FaceRegistrationsModule,
    SyncModule,
    GatewayModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
