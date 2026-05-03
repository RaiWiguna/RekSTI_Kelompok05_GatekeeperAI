import type { LecturerClassCard } from "../types";

export function resolvePreferredLecturerClassId(
  selectedClassId: string | null,
  todayClasses: LecturerClassCard[],
  managedClasses: LecturerClassCard[],
) {
  const availableClassIds = new Set(
    [...todayClasses, ...managedClasses].map((classItem) => classItem.class_id),
  );

  if (selectedClassId && availableClassIds.has(selectedClassId)) {
    return selectedClassId;
  }

  return todayClasses[0]?.class_id ?? managedClasses[0]?.class_id ?? null;
}
