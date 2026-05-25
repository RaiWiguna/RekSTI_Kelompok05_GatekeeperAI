CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'LEFT', 'ALPHA');
CREATE TYPE "AttendanceSource" AS ENUM ('DEVICE', 'STUDENT_APP', 'MANUAL');
CREATE TYPE "AccessEventType" AS ENUM ('ENTRY', 'EXIT', 'OVERRIDE', 'DEVICE_HEARTBEAT', 'SYNC_CHECKPOINT');
CREATE TYPE "AccessResult" AS ENUM ('GRANTED', 'DENIED');
CREATE TYPE "LivenessResult" AS ENUM ('PASS', 'FAIL');
CREATE TYPE "OverrideAction" AS ENUM ('UNLOCK', 'LOCK');
CREATE TYPE "OverrideStatus" AS ENUM ('SENT', 'FAILED');
CREATE TYPE "FaceEmbeddingStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "FaceRegistrationAction" AS ENUM ('REGISTER', 'UPDATE', 'REVOKE');
CREATE TYPE "FaceRegistrationResult" AS ENUM ('SUCCESS', 'FAILED');
CREATE TYPE "SyncType" AS ENUM ('SIX_SCHEDULE', 'GATEWAY_EVENT', 'GATEWAY_REFERENCE');
CREATE TYPE "SyncResult" AS ENUM ('QUEUED', 'RUNNING', 'SUCCESS', 'PARTIAL_SUCCESS', 'FAILED');

CREATE TABLE "attendance_records" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" UUID NOT NULL,
    "class_id" UUID NOT NULL,
    "schedule_id" UUID,
    "room_id" UUID,
    "status" "AttendanceStatus" NOT NULL,
    "source" "AttendanceSource" NOT NULL,
    "check_in_at" TIMESTAMP(3),
    "check_out_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "access_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" VARCHAR(96) NOT NULL,
    "device_id" UUID,
    "device_code" VARCHAR(64),
    "student_id" UUID,
    "student_nim" VARCHAR(32),
    "room_id" UUID,
    "room_code" VARCHAR(32),
    "schedule_id" UUID,
    "schedule_ref" VARCHAR(120),
    "event_type" "AccessEventType" NOT NULL,
    "access_result" "AccessResult" NOT NULL,
    "liveness_result" "LivenessResult",
    "confidence_score" DOUBLE PRECISION,
    "gateway_id" VARCHAR(64),
    "sync_version" INTEGER,
    "is_synced" BOOLEAN NOT NULL DEFAULT false,
    "event_at" TIMESTAMP(3) NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "override_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "room_id" UUID NOT NULL,
    "action" "OverrideAction" NOT NULL,
    "reason" VARCHAR(500) NOT NULL,
    "status" "OverrideStatus" NOT NULL DEFAULT 'SENT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "override_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "message" VARCHAR(1000) NOT NULL,
    "type" VARCHAR(64) NOT NULL DEFAULT 'info',
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "face_embeddings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" UUID NOT NULL,
    "embedding_ref" VARCHAR(255) NOT NULL,
    "model_version" VARCHAR(64) NOT NULL,
    "status" "FaceEmbeddingStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "face_embeddings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "face_registration_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" UUID NOT NULL,
    "action" "FaceRegistrationAction" NOT NULL,
    "result" "FaceRegistrationResult" NOT NULL,
    "embedding_ref" VARCHAR(255),
    "model_version" VARCHAR(64),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "face_registration_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sync_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sync_run_id" VARCHAR(96) NOT NULL,
    "user_id" UUID,
    "sync_type" "SyncType" NOT NULL,
    "source" VARCHAR(64) NOT NULL,
    "target" VARCHAR(64),
    "result" "SyncResult" NOT NULL,
    "total_received" INTEGER NOT NULL DEFAULT 0,
    "total_inserted" INTEGER NOT NULL DEFAULT 0,
    "total_updated" INTEGER NOT NULL DEFAULT 0,
    "total_duplicate" INTEGER NOT NULL DEFAULT 0,
    "total_rejected" INTEGER NOT NULL DEFAULT 0,
    "error_summary" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),

    CONSTRAINT "sync_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "gateway_reference_acks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "device_id" UUID NOT NULL,
    "dataset_name" VARCHAR(80) NOT NULL,
    "dataset_version" VARCHAR(120) NOT NULL,
    "checksum" VARCHAR(160),
    "applied_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gateway_reference_acks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "attendance_records_student_id_schedule_id_key" ON "attendance_records"("student_id", "schedule_id");
CREATE INDEX "attendance_records_class_id_idx" ON "attendance_records"("class_id");
CREATE INDEX "attendance_records_room_id_idx" ON "attendance_records"("room_id");
CREATE INDEX "attendance_records_status_idx" ON "attendance_records"("status");
CREATE INDEX "attendance_records_source_idx" ON "attendance_records"("source");
CREATE INDEX "attendance_records_check_in_at_idx" ON "attendance_records"("check_in_at");

CREATE UNIQUE INDEX "access_logs_event_id_key" ON "access_logs"("event_id");
CREATE INDEX "access_logs_device_id_idx" ON "access_logs"("device_id");
CREATE INDEX "access_logs_student_id_idx" ON "access_logs"("student_id");
CREATE INDEX "access_logs_room_id_idx" ON "access_logs"("room_id");
CREATE INDEX "access_logs_schedule_id_idx" ON "access_logs"("schedule_id");
CREATE INDEX "access_logs_event_type_idx" ON "access_logs"("event_type");
CREATE INDEX "access_logs_access_result_idx" ON "access_logs"("access_result");
CREATE INDEX "access_logs_event_at_idx" ON "access_logs"("event_at");
CREATE INDEX "access_logs_gateway_id_idx" ON "access_logs"("gateway_id");

CREATE INDEX "override_logs_user_id_idx" ON "override_logs"("user_id");
CREATE INDEX "override_logs_room_id_idx" ON "override_logs"("room_id");
CREATE INDEX "override_logs_action_idx" ON "override_logs"("action");
CREATE INDEX "override_logs_created_at_idx" ON "override_logs"("created_at");

CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");
CREATE INDEX "notifications_type_idx" ON "notifications"("type");
CREATE INDEX "notifications_read_at_idx" ON "notifications"("read_at");
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

CREATE UNIQUE INDEX "face_embeddings_embedding_ref_key" ON "face_embeddings"("embedding_ref");
CREATE INDEX "face_embeddings_student_id_idx" ON "face_embeddings"("student_id");
CREATE INDEX "face_embeddings_status_idx" ON "face_embeddings"("status");

CREATE INDEX "face_registration_logs_student_id_idx" ON "face_registration_logs"("student_id");
CREATE INDEX "face_registration_logs_action_idx" ON "face_registration_logs"("action");
CREATE INDEX "face_registration_logs_result_idx" ON "face_registration_logs"("result");
CREATE INDEX "face_registration_logs_created_at_idx" ON "face_registration_logs"("created_at");

CREATE UNIQUE INDEX "sync_logs_sync_run_id_key" ON "sync_logs"("sync_run_id");
CREATE INDEX "sync_logs_user_id_idx" ON "sync_logs"("user_id");
CREATE INDEX "sync_logs_sync_type_idx" ON "sync_logs"("sync_type");
CREATE INDEX "sync_logs_result_idx" ON "sync_logs"("result");
CREATE INDEX "sync_logs_started_at_idx" ON "sync_logs"("started_at");

CREATE UNIQUE INDEX "gateway_reference_acks_device_dataset_version_key" ON "gateway_reference_acks"("device_id", "dataset_name", "dataset_version");
CREATE INDEX "gateway_reference_acks_dataset_name_idx" ON "gateway_reference_acks"("dataset_name");
CREATE INDEX "gateway_reference_acks_applied_at_idx" ON "gateway_reference_acks"("applied_at");

ALTER TABLE "attendance_records"
ADD CONSTRAINT "attendance_records_student_id_fkey"
FOREIGN KEY ("student_id") REFERENCES "students"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "attendance_records"
ADD CONSTRAINT "attendance_records_class_id_fkey"
FOREIGN KEY ("class_id") REFERENCES "classes"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "attendance_records"
ADD CONSTRAINT "attendance_records_schedule_id_fkey"
FOREIGN KEY ("schedule_id") REFERENCES "schedules"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "attendance_records"
ADD CONSTRAINT "attendance_records_room_id_fkey"
FOREIGN KEY ("room_id") REFERENCES "rooms"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "access_logs"
ADD CONSTRAINT "access_logs_device_id_fkey"
FOREIGN KEY ("device_id") REFERENCES "devices"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "access_logs"
ADD CONSTRAINT "access_logs_student_id_fkey"
FOREIGN KEY ("student_id") REFERENCES "students"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "access_logs"
ADD CONSTRAINT "access_logs_room_id_fkey"
FOREIGN KEY ("room_id") REFERENCES "rooms"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "access_logs"
ADD CONSTRAINT "access_logs_schedule_id_fkey"
FOREIGN KEY ("schedule_id") REFERENCES "schedules"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "override_logs"
ADD CONSTRAINT "override_logs_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "override_logs"
ADD CONSTRAINT "override_logs_room_id_fkey"
FOREIGN KEY ("room_id") REFERENCES "rooms"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "notifications"
ADD CONSTRAINT "notifications_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "face_embeddings"
ADD CONSTRAINT "face_embeddings_student_id_fkey"
FOREIGN KEY ("student_id") REFERENCES "students"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "face_registration_logs"
ADD CONSTRAINT "face_registration_logs_student_id_fkey"
FOREIGN KEY ("student_id") REFERENCES "students"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "sync_logs"
ADD CONSTRAINT "sync_logs_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "gateway_reference_acks"
ADD CONSTRAINT "gateway_reference_acks_device_id_fkey"
FOREIGN KEY ("device_id") REFERENCES "devices"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
