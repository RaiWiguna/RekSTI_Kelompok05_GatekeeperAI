import { buildOptions, nestedText, shortDate, text } from "../utils/display";
import type { ResourceConfig, ResourceField, ResourceForms, ResourceKey, ResourceStore } from "../types";

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const deviceStatusOptions = [
  { value: "online", label: "Online" },
  { value: "offline", label: "Offline" },
  { value: "maintenance", label: "Maintenance" },
];

const dayOptions = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

const sourceOptions = [
  { value: "manual", label: "Manual" },
  { value: "six", label: "SIX" },
];

export const resourceOrder: ResourceKey[] = [
  "users",
  "students",
  "lecturers",
  "rooms",
  "devices",
  "courses",
  "classes",
  "schedules",
  "enrollments",
];

export const resourceLabels: Record<ResourceKey, string> = {
  users: "Lecturer Accounts",
  students: "Students",
  lecturers: "Lecturers",
  rooms: "Rooms",
  devices: "Devices",
  courses: "Courses",
  classes: "Classes",
  schedules: "Schedules",
  enrollments: "Enrollments",
};

export const resourceConfigs: Record<ResourceKey, ResourceConfig> = {
  users: {
    key: "users",
    title: "Lecturer Accounts",
    singularLabel: "Lecturer Account",
    endpoint: "users",
    query: { role: "lecturer" },
    refreshTargets: ["users", "lecturers"],
    buildPayload: (values) => ({
      ...values,
      role: "lecturer",
    }),
    emptyMessage: "No lecturer account records yet.",
    deleteActionLabel: "Deactivate",
    fields: [
      {
        name: "lecturer_id",
        label: "Lecturer",
        type: "select",
        getOptions: (store) => buildOptions(store.lecturers, "id", "full_name", "nidn"),
      },
      { name: "account_name", label: "Account Name", placeholder: "dr.a.gatekeeper" },
      { name: "email", label: "Email", placeholder: "dosen@kampus.ac.id" },
      { name: "password", label: "Password", type: "password", placeholder: "Minimum 8 characters" },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: statusOptions,
      },
    ],
    columns: [
      { key: "account_name", label: "Account Name", render: (item) => text(item.account_name) },
      { key: "email", label: "Email", render: (item) => text(item.email) },
      { key: "status", label: "Status", render: (item) => text(item.status) },
      { key: "lecturer", label: "Lecturer", render: (item) => nestedText(item.lecturer, "full_name") },
      { key: "updated_at", label: "Updated", render: (item) => shortDate(item.updated_at) },
    ],
  },
  students: {
    key: "students",
    title: "Students",
    singularLabel: "Student",
    endpoint: "students",
    refreshTargets: ["students", "enrollments"],
    emptyMessage: "No student records yet.",
    fields: [
      { name: "nim", label: "NIM", placeholder: "220123456" },
      { name: "full_name", label: "Full Name", placeholder: "Budi Santoso" },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: statusOptions,
      },
    ],
    columns: [
      { key: "nim", label: "NIM", render: (item) => text(item.nim) },
      { key: "full_name", label: "Full Name", render: (item) => text(item.full_name) },
      { key: "status", label: "Status", render: (item) => text(item.status) },
      { key: "updated_at", label: "Updated", render: (item) => shortDate(item.updated_at) },
    ],
  },
  lecturers: {
    key: "lecturers",
    title: "Lecturers",
    singularLabel: "Lecturer",
    endpoint: "lecturers",
    refreshTargets: ["lecturers", "users", "classes"],
    emptyMessage: "No lecturer records yet.",
    fields: [
      { name: "nidn", label: "NIDN", placeholder: "100200300" },
      { name: "full_name", label: "Full Name", placeholder: "Dr. Andika Pratama" },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: statusOptions,
      },
    ],
    columns: [
      { key: "nidn", label: "NIDN", render: (item) => text(item.nidn) },
      { key: "full_name", label: "Full Name", render: (item) => text(item.full_name) },
      { key: "status", label: "Status", render: (item) => text(item.status) },
      {
        key: "user",
        label: "Linked User",
        render: (item) => nestedText(item.user, "email"),
      },
    ],
  },
  rooms: {
    key: "rooms",
    title: "Rooms",
    singularLabel: "Room",
    endpoint: "rooms",
    refreshTargets: ["rooms", "devices", "classes"],
    emptyMessage: "No room records yet.",
    fields: [
      { name: "code", label: "Code", placeholder: "R101" },
      { name: "name", label: "Name", placeholder: "Lab AI 1" },
      { name: "building", label: "Building", placeholder: "A" },
      { name: "floor", label: "Floor", type: "number", placeholder: "1" },
    ],
    columns: [
      { key: "code", label: "Code", render: (item) => text(item.code) },
      { key: "name", label: "Name", render: (item) => text(item.name) },
      { key: "building", label: "Building", render: (item) => text(item.building) },
      { key: "floor", label: "Floor", render: (item) => text(item.floor) },
    ],
  },
  devices: {
    key: "devices",
    title: "Devices",
    singularLabel: "Device",
    endpoint: "devices",
    refreshTargets: ["devices"],
    emptyMessage: "No device records yet.",
    fields: [
      {
        name: "room_id",
        label: "Room",
        type: "select",
        getOptions: (store) => buildOptions(store.rooms, "id", "name", "code"),
      },
      { name: "device_code", label: "Device Code", placeholder: "DEV-R101-01" },
      { name: "device_type", label: "Device Type", placeholder: "door-face-terminal" },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: deviceStatusOptions,
      },
    ],
    columns: [
      { key: "device_code", label: "Code", render: (item) => text(item.device_code) },
      { key: "device_type", label: "Type", render: (item) => text(item.device_type) },
      { key: "status", label: "Status", render: (item) => text(item.status) },
      { key: "room", label: "Room", render: (item) => nestedText(item.room, "name") },
    ],
  },
  courses: {
    key: "courses",
    title: "Courses",
    singularLabel: "Course",
    endpoint: "courses",
    refreshTargets: ["courses", "classes"],
    emptyMessage: "No course records yet.",
    fields: [
      { name: "code", label: "Code", placeholder: "IF301" },
      { name: "name", label: "Name", placeholder: "Machine Learning" },
      { name: "credits", label: "Credits", type: "number", placeholder: "3" },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: statusOptions,
      },
    ],
    columns: [
      { key: "code", label: "Code", render: (item) => text(item.code) },
      { key: "name", label: "Name", render: (item) => text(item.name) },
      { key: "credits", label: "Credits", render: (item) => text(item.credits) },
      { key: "status", label: "Status", render: (item) => text(item.status) },
    ],
  },
  classes: {
    key: "classes",
    title: "Classes",
    singularLabel: "Class",
    endpoint: "classes",
    refreshTargets: ["classes", "schedules", "enrollments"],
    emptyMessage: "No class records yet.",
    fields: [
      {
        name: "course_id",
        label: "Course",
        type: "select",
        getOptions: (store) => buildOptions(store.courses, "id", "name", "code"),
      },
      {
        name: "lecturer_id",
        label: "Lecturer",
        type: "select",
        getOptions: (store) => buildOptions(store.lecturers, "id", "full_name", "nidn"),
      },
      {
        name: "room_id",
        label: "Room",
        type: "select",
        getOptions: (store) => buildOptions(store.rooms, "id", "name", "code"),
      },
      { name: "class_code", label: "Class Code", placeholder: "IF-3A" },
      { name: "semester", label: "Semester", placeholder: "6" },
      { name: "academic_year", label: "Academic Year", placeholder: "2026" },
    ],
    columns: [
      { key: "class_code", label: "Code", render: (item) => text(item.class_code) },
      { key: "course", label: "Course", render: (item) => nestedText(item.course, "name") },
      { key: "lecturer", label: "Lecturer", render: (item) => nestedText(item.lecturer, "full_name") },
      { key: "room", label: "Room", render: (item) => nestedText(item.room, "name") },
    ],
  },
  schedules: {
    key: "schedules",
    title: "Schedules",
    singularLabel: "Schedule",
    endpoint: "schedules",
    refreshTargets: ["schedules"],
    emptyMessage: "No schedule records yet.",
    fields: [
      {
        name: "class_id",
        label: "Class",
        type: "select",
        getOptions: (store) => buildOptions(store.classes, "id", "class_code", "semester"),
      },
      {
        name: "day_of_week",
        label: "Day",
        type: "select",
        options: dayOptions,
      },
      { name: "start_time", label: "Start", placeholder: "08:00:00" },
      { name: "end_time", label: "End", placeholder: "09:40:00" },
      {
        name: "source",
        label: "Source",
        type: "select",
        options: sourceOptions,
      },
    ],
    columns: [
      { key: "class", label: "Class", render: (item) => nestedText(item.class, "class_code") },
      { key: "day_of_week", label: "Day", render: (item) => text(item.day_of_week) },
      { key: "start_time", label: "Start", render: (item) => text(item.start_time) },
      { key: "end_time", label: "End", render: (item) => text(item.end_time) },
    ],
  },
  enrollments: {
    key: "enrollments",
    title: "Enrollments",
    singularLabel: "Enrollment",
    endpoint: "enrollments",
    refreshTargets: ["enrollments"],
    emptyMessage: "No enrollment records yet.",
    fields: [
      {
        name: "student_id",
        label: "Student",
        type: "select",
        getOptions: (store) => buildOptions(store.students, "id", "full_name", "nim"),
      },
      {
        name: "class_id",
        label: "Class",
        type: "select",
        getOptions: (store) => buildOptions(store.classes, "id", "class_code", "semester"),
      },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: statusOptions,
      },
    ],
    columns: [
      { key: "student", label: "Student", render: (item) => nestedText(item.student, "full_name") },
      { key: "class", label: "Class", render: (item) => nestedText(item.class, "class_code") },
      { key: "status", label: "Status", render: (item) => text(item.status) },
      { key: "updated_at", label: "Updated", render: (item) => shortDate(item.updated_at) },
    ],
  },
};

export const initialStore = resourceOrder.reduce((accumulator, key) => {
  accumulator[key] = [];
  return accumulator;
}, {} as ResourceStore);

export function buildInitialForms() {
  return resourceOrder.reduce((accumulator, key) => {
    accumulator[key] = buildEmptyForm(resourceConfigs[key].fields);
    return accumulator;
  }, {} as ResourceForms);
}

export function buildEmptyForm(fields: ResourceField[]) {
  return fields.reduce((accumulator, field) => {
    accumulator[field.name] = "";
    return accumulator;
  }, {} as Record<string, string>);
}
