import { useEffect, useMemo, useState } from "react";

import { apiRequest } from "../../../lib/api-client";

type DebugSchedule = {
  id: string;
  class_id: string;
  day_of_week: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  source: string;
  class: {
    class_code: string;
    semester: string;
    academic_year: string;
    room: {
      code: string;
      name: string;
    };
  } | null;
};

type AdminScheduleDebugPanelProps = {
  accessToken: string;
};

export function AdminScheduleDebugPanel({ accessToken }: AdminScheduleDebugPanelProps) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [clock, setClock] = useState(() => new Date());
  const [items, setItems] = useState<DebugSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  async function loadDebugSchedules(nextDate = date) {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const schedules = await apiRequest<DebugSchedule[]>("schedules", {
        accessToken,
        query: {
          date: nextDate,
          limit: "100",
        },
      });
      setItems(schedules);
      setMessage(`${schedules.length} jadwal dimuat untuk ${nextDate}.`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Gagal memuat jadwal debug.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel debug-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Debug Schedule</p>
          <h2>Jadwal Hari Ini untuk Testing</h2>
        </div>
        <div className="debug-clock">
          {clock.toLocaleDateString("id-ID", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
          <strong>{clock.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</strong>
        </div>
      </div>
      <div className="panel-body">
        <div className="debug-controls">
          <label>
            Tanggal uji
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </label>
          <button className="button" type="button" onClick={() => { setDate(today); void loadDebugSchedules(today); }} disabled={loading}>
            Hari Ini
          </button>
          <button className="button primary" type="button" onClick={() => void loadDebugSchedules()} disabled={loading}>
            {loading ? "Memuat..." : "Tampilkan Jadwal"}
          </button>
        </div>
        <p className="muted">
          Panel ini sengaja menampilkan semua jadwal pada tanggal uji tanpa memvalidasi apakah jam kelas sedang aktif.
        </p>
        {message ? <div className="message">{message}</div> : null}
        {error ? <div className="message error">{error}</div> : null}
        {items.length > 0 ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Kelas</th>
                  <th>Hari</th>
                  <th>Jam</th>
                  <th>Ruangan</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.class?.class_code ?? item.class_id}</td>
                    <td>{item.day_of_week}</td>
                    <td>{item.start_time} - {item.end_time}</td>
                    <td>{item.class?.room ? `${item.class.room.code} ${item.class.room.name}` : "-"}</td>
                    <td>{item.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
      <style jsx>{`
        .debug-panel {
          margin-bottom: 24px;
        }

        .debug-clock {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
          color: #475569;
          font-size: 13px;
        }

        .debug-clock strong {
          color: #112d4e;
          font-size: 18px;
        }

        .debug-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: end;
          margin-bottom: 12px;
        }

        .debug-controls label {
          display: flex;
          flex-direction: column;
          gap: 6px;
          color: #475569;
          font-size: 13px;
          font-weight: 700;
        }

        .debug-controls input {
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          padding: 10px 12px;
          min-width: 180px;
        }
      `}</style>
    </section>
  );
}
