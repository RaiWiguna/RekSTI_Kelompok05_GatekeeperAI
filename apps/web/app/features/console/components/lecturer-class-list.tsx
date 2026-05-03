import type { LecturerClassCard } from "../types";
import { formatTodayScheduleSummary, formatWeeklyScheduleSummary } from "../utils/display";

type LecturerClassListProps = {
  classes: LecturerClassCard[];
  emptyMessage: string;
  scheduleMode: "today" | "weekly";
  selectedClassId: string | null;
  title: string;
  subtitle: string;
  onSelectClass: (classId: string) => void;
};

export function LecturerClassList({
  classes,
  emptyMessage,
  scheduleMode,
  selectedClassId,
  title,
  subtitle,
  onSelectClass,
}: LecturerClassListProps) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">{subtitle}</p>
          <h2>{title}</h2>
        </div>
      </div>
      <div className="panel-body">
        {classes.length === 0 ? (
          <p className="muted">{emptyMessage}</p>
        ) : (
          <div className="form-grid">
            {classes.map((classItem) => {
              const isActive = classItem.class_id === selectedClassId;

              return (
                <button
                  key={classItem.class_id}
                  className={`tab ${isActive ? "active" : ""}`}
                  type="button"
                  onClick={() => onSelectClass(classItem.class_id)}
                >
                  <strong>{classItem.course.name}</strong>
                  <br />
                  <span>
                    {classItem.class_code} - {classItem.room.name} ({classItem.room.code})
                  </span>
                  <br />
                  <span>
                    {scheduleMode === "today"
                      ? formatTodayScheduleSummary(classItem.schedules)
                      : formatWeeklyScheduleSummary(classItem.schedules)}
                  </span>
                  <br />
                  <span>{classItem.enrollments_count} enrolled students</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
