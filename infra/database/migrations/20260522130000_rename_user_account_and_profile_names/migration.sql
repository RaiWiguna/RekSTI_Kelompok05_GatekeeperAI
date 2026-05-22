-- Clarify identity naming:
-- users.name -> users.account_name (display/account identity)
-- students.name -> students.full_name (official student identity)
-- lecturers.name -> lecturers.full_name (official lecturer identity)

ALTER TABLE "users"
RENAME COLUMN "name" TO "account_name";

ALTER TABLE "students"
RENAME COLUMN "name" TO "full_name";

ALTER TABLE "lecturers"
RENAME COLUMN "name" TO "full_name";

ALTER INDEX IF EXISTS "students_name_idx"
RENAME TO "students_full_name_idx";

ALTER INDEX IF EXISTS "lecturers_name_idx"
RENAME TO "lecturers_full_name_idx";
