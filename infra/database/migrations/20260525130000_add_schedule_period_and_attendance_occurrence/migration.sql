ALTER TABLE "schedules"
  ADD COLUMN "start_date" DATE NOT NULL DEFAULT DATE '2026-02-01',
  ADD COLUMN "end_date" DATE NOT NULL DEFAULT DATE '2026-06-30';

ALTER TABLE "attendance_records"
  ADD COLUMN "occurrence_date" DATE NOT NULL DEFAULT CURRENT_DATE;

ALTER TABLE "schedules"
  DROP CONSTRAINT IF EXISTS "schedules_class_id_day_of_week_start_time_end_time_key";

ALTER TABLE "attendance_records"
  DROP CONSTRAINT IF EXISTS "attendance_records_student_id_schedule_id_key";

CREATE UNIQUE INDEX "schedules_class_period_day_time_key"
  ON "schedules"("class_id", "day_of_week", "start_date", "end_date", "start_time", "end_time");

CREATE INDEX "schedules_start_date_end_date_idx"
  ON "schedules"("start_date", "end_date");

CREATE UNIQUE INDEX "attendance_records_student_schedule_date_key"
  ON "attendance_records"("student_id", "schedule_id", "occurrence_date");

CREATE INDEX "attendance_records_occurrence_date_idx"
  ON "attendance_records"("occurrence_date");
