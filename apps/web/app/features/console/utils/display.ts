import type { LecturerClassSchedule, Option, ResourceItem } from "../types";

export function buildOptions(
  items: ResourceItem[],
  valueKey: string,
  primaryLabelKey: string,
  secondaryLabelKey?: string,
): Option[] {
  return items.map((item) => {
    const primary = text(item[primaryLabelKey]);
    const secondary = secondaryLabelKey ? text(item[secondaryLabelKey]) : "";

    return {
      value: text(item[valueKey]),
      label: secondary ? `${primary} (${secondary})` : primary,
    };
  });
}

export function filterResourceItems(items: ResourceItem[], query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return items;
  }

  return items.filter((item) => buildSearchIndex(item).includes(normalizedQuery));
}

export function formatScheduleWindow(startTime: string, endTime: string) {
  return `${toTimeLabel(startTime)}-${toTimeLabel(endTime)}`;
}

export function formatTodayScheduleSummary(schedules: LecturerClassSchedule[]) {
  return schedules.map((schedule) => formatScheduleWindow(schedule.start_time, schedule.end_time)).join(", ");
}

export function formatWeeklyScheduleSummary(schedules: LecturerClassSchedule[]) {
  return schedules
    .map((schedule) => `${toDayLabel(schedule.day_of_week)} ${formatScheduleWindow(schedule.start_time, schedule.end_time)}`)
    .join(", ");
}

export function text(value: unknown) {
  if (value === null || value === undefined) {
    return "-";
  }

  return String(value);
}

export function nestedText(value: unknown, key: string) {
  if (!value || typeof value !== "object") {
    return "-";
  }

  return text((value as Record<string, unknown>)[key]);
}

export function shortDate(value: unknown) {
  if (!value) {
    return "-";
  }

  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function buildSearchIndex(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (Array.isArray(value)) {
    return value.map((item) => buildSearchIndex(item)).join(" ");
  }

  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>)
      .map((item) => buildSearchIndex(item))
      .join(" ");
  }

  return String(value).toLowerCase();
}

function toTimeLabel(value: string) {
  const match = String(value).match(/\d{2}:\d{2}/);
  return match?.[0] ?? String(value);
}

function toDayLabel(value: string) {
  const normalized = value.toLowerCase();

  return (
    {
      monday: "Mon",
      tuesday: "Tue",
      wednesday: "Wed",
      thursday: "Thu",
      friday: "Fri",
      saturday: "Sat",
      sunday: "Sun",
    } satisfies Record<string, string>
  )[normalized] ?? value;
}
