import {
  AccessEventType,
  AccessResult,
  AttendanceSource,
  AttendanceStatus,
  CourseStatus,
  DayOfWeek,
  DeviceStatus,
  EnrollmentStatus,
  FaceEmbeddingStatus,
  LivenessResult,
  LecturerStatus,
  OverrideAction,
  OverrideStatus,
  ScheduleSource,
  StudentStatus,
  SyncResult,
  SyncType,
  UserRole,
  UserStatus,
} from "@prisma/client";

export function toStudentStatus(value: "active" | "inactive") {
  return value === "active" ? StudentStatus.ACTIVE : StudentStatus.INACTIVE;
}

export function fromStudentStatus(value: StudentStatus) {
  return value.toLowerCase() as "active" | "inactive";
}

export function toLecturerStatus(value: "active" | "inactive") {
  return value === "active" ? LecturerStatus.ACTIVE : LecturerStatus.INACTIVE;
}

export function fromLecturerStatus(value: LecturerStatus) {
  return value.toLowerCase() as "active" | "inactive";
}

export function toCourseStatus(value: "active" | "inactive") {
  return value === "active" ? CourseStatus.ACTIVE : CourseStatus.INACTIVE;
}

export function fromCourseStatus(value: CourseStatus) {
  return value.toLowerCase() as "active" | "inactive";
}

export function toEnrollmentStatus(value: "active" | "inactive") {
  return value === "active" ? EnrollmentStatus.ACTIVE : EnrollmentStatus.INACTIVE;
}

export function fromEnrollmentStatus(value: EnrollmentStatus) {
  return value.toLowerCase() as "active" | "inactive";
}

export function toDeviceStatus(value: "online" | "offline" | "maintenance") {
  switch (value) {
    case "online":
      return DeviceStatus.ONLINE;
    case "maintenance":
      return DeviceStatus.MAINTENANCE;
    default:
      return DeviceStatus.OFFLINE;
  }
}

export function fromDeviceStatus(value: DeviceStatus) {
  return value.toLowerCase() as "online" | "offline" | "maintenance";
}

export function toDayOfWeek(
  value:
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday",
) {
  return value.toUpperCase() as DayOfWeek;
}

export function fromDayOfWeek(value: DayOfWeek) {
  return value.toLowerCase() as
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday";
}

export function toScheduleSource(value: "manual" | "six") {
  return value.toUpperCase() as ScheduleSource;
}

export function fromScheduleSource(value: ScheduleSource) {
  return value.toLowerCase() as "manual" | "six";
}

export function toAttendanceStatus(value: "present" | "left" | "alpha") {
  return value.toUpperCase() as AttendanceStatus;
}

export function fromAttendanceStatus(value: AttendanceStatus) {
  return value.toLowerCase() as "present" | "left" | "alpha";
}

export function toAttendanceSource(value: "device" | "student_app" | "manual") {
  return value.toUpperCase() as AttendanceSource;
}

export function fromAttendanceSource(value: AttendanceSource) {
  return value.toLowerCase() as "device" | "student_app" | "manual";
}

export function toAccessEventType(
  value: "entry" | "exit" | "override" | "device_heartbeat" | "sync_checkpoint",
) {
  return value.toUpperCase() as AccessEventType;
}

export function fromAccessEventType(value: AccessEventType) {
  return value.toLowerCase() as
    | "entry"
    | "exit"
    | "override"
    | "device_heartbeat"
    | "sync_checkpoint";
}

export function toAccessResult(value: "granted" | "denied") {
  return value.toUpperCase() as AccessResult;
}

export function fromAccessResult(value: AccessResult) {
  return value.toLowerCase() as "granted" | "denied";
}

export function toLivenessResult(value: "pass" | "fail") {
  return value.toUpperCase() as LivenessResult;
}

export function fromLivenessResult(value: LivenessResult) {
  return value.toLowerCase() as "pass" | "fail";
}

export function toOverrideAction(value: "unlock" | "lock") {
  return value.toUpperCase() as OverrideAction;
}

export function fromOverrideAction(value: OverrideAction) {
  return value.toLowerCase() as "unlock" | "lock";
}

export function fromOverrideStatus(value: OverrideStatus) {
  return value.toLowerCase() as "sent" | "failed";
}

export function toFaceEmbeddingStatus(value: "active" | "inactive") {
  return value.toUpperCase() as FaceEmbeddingStatus;
}

export function fromFaceEmbeddingStatus(value: FaceEmbeddingStatus) {
  return value.toLowerCase() as "active" | "inactive";
}

export function fromSyncType(value: SyncType) {
  return value.toLowerCase() as "six_schedule" | "gateway_event" | "gateway_reference";
}

export function fromSyncResult(value: SyncResult) {
  return value.toLowerCase() as "queued" | "running" | "success" | "partial_success" | "failed";
}

export function fromUserRole(value: UserRole) {
  return value.toLowerCase() as "student" | "admin" | "lecturer" | "gateway" | "system";
}

export function toUserRole(
  value: "student" | "admin" | "lecturer" | "gateway" | "system",
) {
  return value.toUpperCase() as UserRole;
}

export function fromUserStatus(value: UserStatus) {
  return value.toLowerCase() as "active" | "inactive";
}

export function toUserStatus(value: "active" | "inactive") {
  return value === "active" ? UserStatus.ACTIVE : UserStatus.INACTIVE;
}
