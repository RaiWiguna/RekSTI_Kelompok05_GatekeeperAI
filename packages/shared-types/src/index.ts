export const USER_ROLES = ["student", "admin", "lecturer", "gateway", "system"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ["active", "inactive"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const STUDENT_STATUSES = ["active", "inactive"] as const;
export type StudentStatus = (typeof STUDENT_STATUSES)[number];

export const LECTURER_STATUSES = ["active", "inactive"] as const;
export type LecturerStatus = (typeof LECTURER_STATUSES)[number];

export const COURSE_STATUSES = ["active", "inactive"] as const;
export type CourseStatus = (typeof COURSE_STATUSES)[number];

export const ENROLLMENT_STATUSES = ["active", "inactive"] as const;
export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];

export const DEVICE_STATUSES = ["online", "offline", "maintenance"] as const;
export type DeviceStatus = (typeof DEVICE_STATUSES)[number];

export const DAY_OF_WEEK_VALUES = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;
export type DayOfWeek = (typeof DAY_OF_WEEK_VALUES)[number];

export const SCHEDULE_SOURCES = ["manual", "six"] as const;
export type ScheduleSource = (typeof SCHEDULE_SOURCES)[number];

export const ATTENDANCE_STATUSES = ["present", "left", "alpha"] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export const ACCESS_RESULTS = ["granted", "denied"] as const;
export type AccessResult = (typeof ACCESS_RESULTS)[number];

export const LIVENESS_RESULTS = ["pass", "fail"] as const;
export type LivenessResult = (typeof LIVENESS_RESULTS)[number];
