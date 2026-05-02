CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'LECTURER', 'GATEWAY', 'SYSTEM');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "StudentStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "LecturerStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "CourseStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "DeviceStatus" AS ENUM ('ONLINE', 'OFFLINE', 'MAINTENANCE');
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');
CREATE TYPE "ScheduleSource" AS ENUM ('MANUAL', 'SIX');

CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "role" "UserRole" NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(191) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "students" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nim" VARCHAR(32) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "status" "StudentStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lecturers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "nidn" VARCHAR(32) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "status" "LecturerStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lecturers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "courses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(32) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "credits" INTEGER NOT NULL,
    "status" "CourseStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "rooms" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(32) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "building" VARCHAR(64) NOT NULL,
    "floor" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "devices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "room_id" UUID NOT NULL,
    "device_code" VARCHAR(64) NOT NULL,
    "device_type" VARCHAR(64) NOT NULL,
    "status" "DeviceStatus" NOT NULL DEFAULT 'OFFLINE',
    "last_seen_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "classes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "course_id" UUID NOT NULL,
    "lecturer_id" UUID NOT NULL,
    "room_id" UUID NOT NULL,
    "class_code" VARCHAR(32) NOT NULL,
    "semester" VARCHAR(16) NOT NULL,
    "academic_year" VARCHAR(16) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "schedules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "class_id" UUID NOT NULL,
    "day_of_week" "DayOfWeek" NOT NULL,
    "start_time" TIME(0) NOT NULL,
    "end_time" TIME(0) NOT NULL,
    "source" "ScheduleSource" NOT NULL DEFAULT 'MANUAL',
    "synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "enrollments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" UUID NOT NULL,
    "class_id" UUID NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_role_idx" ON "users"("role");
CREATE INDEX "users_status_idx" ON "users"("status");

CREATE UNIQUE INDEX "students_nim_key" ON "students"("nim");
CREATE INDEX "students_name_idx" ON "students"("name");
CREATE INDEX "students_status_idx" ON "students"("status");

CREATE UNIQUE INDEX "lecturers_user_id_key" ON "lecturers"("user_id");
CREATE UNIQUE INDEX "lecturers_nidn_key" ON "lecturers"("nidn");
CREATE INDEX "lecturers_name_idx" ON "lecturers"("name");
CREATE INDEX "lecturers_status_idx" ON "lecturers"("status");

CREATE UNIQUE INDEX "courses_code_key" ON "courses"("code");
CREATE INDEX "courses_name_idx" ON "courses"("name");
CREATE INDEX "courses_status_idx" ON "courses"("status");

CREATE UNIQUE INDEX "rooms_code_key" ON "rooms"("code");
CREATE INDEX "rooms_building_idx" ON "rooms"("building");
CREATE INDEX "rooms_name_idx" ON "rooms"("name");

CREATE UNIQUE INDEX "devices_device_code_key" ON "devices"("device_code");
CREATE INDEX "devices_room_id_idx" ON "devices"("room_id");
CREATE INDEX "devices_status_idx" ON "devices"("status");

CREATE UNIQUE INDEX "classes_class_code_semester_academic_year_key" ON "classes"("class_code", "semester", "academic_year");
CREATE INDEX "classes_course_id_idx" ON "classes"("course_id");
CREATE INDEX "classes_lecturer_id_idx" ON "classes"("lecturer_id");
CREATE INDEX "classes_room_id_idx" ON "classes"("room_id");

CREATE UNIQUE INDEX "schedules_class_id_day_of_week_start_time_end_time_key" ON "schedules"("class_id", "day_of_week", "start_time", "end_time");
CREATE INDEX "schedules_day_of_week_idx" ON "schedules"("day_of_week");
CREATE INDEX "schedules_source_idx" ON "schedules"("source");

CREATE UNIQUE INDEX "enrollments_student_id_class_id_key" ON "enrollments"("student_id", "class_id");
CREATE INDEX "enrollments_class_id_idx" ON "enrollments"("class_id");
CREATE INDEX "enrollments_status_idx" ON "enrollments"("status");

ALTER TABLE "lecturers"
ADD CONSTRAINT "lecturers_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "devices"
ADD CONSTRAINT "devices_room_id_fkey"
FOREIGN KEY ("room_id") REFERENCES "rooms"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "classes"
ADD CONSTRAINT "classes_course_id_fkey"
FOREIGN KEY ("course_id") REFERENCES "courses"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "classes"
ADD CONSTRAINT "classes_lecturer_id_fkey"
FOREIGN KEY ("lecturer_id") REFERENCES "lecturers"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "classes"
ADD CONSTRAINT "classes_room_id_fkey"
FOREIGN KEY ("room_id") REFERENCES "rooms"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "schedules"
ADD CONSTRAINT "schedules_class_id_fkey"
FOREIGN KEY ("class_id") REFERENCES "classes"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "enrollments"
ADD CONSTRAINT "enrollments_student_id_fkey"
FOREIGN KEY ("student_id") REFERENCES "students"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "enrollments"
ADD CONSTRAINT "enrollments_class_id_fkey"
FOREIGN KEY ("class_id") REFERENCES "classes"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
