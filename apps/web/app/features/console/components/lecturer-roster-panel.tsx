import type { LecturerClassRoster } from "../types";

type LecturerRosterPanelProps = {
  lecturerRoster: LecturerClassRoster | null;
};

export function LecturerRosterPanel({ lecturerRoster }: LecturerRosterPanelProps) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Class Roster</p>
          <h3>
            {lecturerRoster
              ? `${lecturerRoster.course.name} - ${lecturerRoster.class_code}`
              : "Select a Class"}
          </h3>
        </div>
      </div>
      <div className="panel-body">
        {!lecturerRoster ? (
          <p className="muted">
            Select one of your classes to see the student roster and enrollment status.
          </p>
        ) : lecturerRoster.students.length === 0 ? (
          <p className="muted">This class does not have enrolled students yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>NIM</th>
                  <th>Name</th>
                  <th>Enrollment</th>
                  <th>Student Status</th>
                </tr>
              </thead>
              <tbody>
                {lecturerRoster.students.map((item) => (
                  <tr key={item.enrollment_id}>
                    <td>{item.student.nim}</td>
                    <td>{item.student.name}</td>
                    <td>{item.status}</td>
                    <td>{item.student.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
