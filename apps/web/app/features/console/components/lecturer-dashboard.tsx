import type {
  LecturerClassRoster,
  LecturerManagedClass,
  LecturerTodayClass,
} from "../types";
import { LecturerClassList } from "./lecturer-class-list";
import { LecturerRosterPanel } from "./lecturer-roster-panel";

type LecturerDashboardProps = {
  error: string | null;
  lecturerManagedClasses: LecturerManagedClass[];
  lecturerTodayClasses: LecturerTodayClass[];
  lecturerRoster: LecturerClassRoster | null;
  selectedLecturerClassId: string | null;
  onSelectClass: (classId: string) => void;
};

export function LecturerDashboard({
  error,
  lecturerManagedClasses,
  lecturerTodayClasses,
  lecturerRoster,
  selectedLecturerClassId,
  onSelectClass,
}: LecturerDashboardProps) {
  return (
    <div className="grid">
      {error ? <div className="message error">{error}</div> : null}

      <div className="grid two">
        <LecturerClassList
          classes={lecturerTodayClasses}
          emptyMessage="No classes are assigned to your lecturer account for today."
          scheduleMode="today"
          selectedClassId={selectedLecturerClassId}
          subtitle="Today's Classes"
          title="Teaching Schedule"
          onSelectClass={onSelectClass}
        />

        <LecturerClassList
          classes={lecturerManagedClasses}
          emptyMessage="No classes are assigned to your lecturer account yet."
          scheduleMode="weekly"
          selectedClassId={selectedLecturerClassId}
          subtitle="All Assigned Classes"
          title="Weekly Teaching Load"
          onSelectClass={onSelectClass}
        />
      </div>

      <LecturerRosterPanel lecturerRoster={lecturerRoster} />
    </div>
  );
}
