import {
  CourseStatus,
  DayOfWeek,
  DeviceStatus,
  EnrollmentStatus,
  LecturerStatus,
  ScheduleSource,
  StudentStatus,
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
