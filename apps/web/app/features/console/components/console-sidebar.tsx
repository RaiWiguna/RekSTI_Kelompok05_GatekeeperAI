import type { SessionUser } from "../../../lib/api-client";
import { resourceLabels, resourceOrder } from "../config/resources";
import type { ResourceKey } from "../types";

type ConsoleSidebarProps = {
  activeResource: ResourceKey;
  loading: boolean;
  user: SessionUser;
  onLogout: () => void;
  onRefreshAdmin: () => void;
  onRefreshLecturer: () => void;
  onSelectResource: (resourceKey: ResourceKey) => void;
};

export function ConsoleSidebar({
  activeResource,
  loading,
  user,
  onLogout,
  onRefreshAdmin,
  onRefreshLecturer,
  onSelectResource,
}: ConsoleSidebarProps) {
  return (
    <aside className="sidebar">
      <div>
        <p className="eyebrow">Gatekeeper AI</p>
        <h1 className="title">{user.role === "lecturer" ? "Lecturer Console" : "Admin Console"}</h1>
        <p className="subtitle">
          {user.role === "lecturer"
            ? "Review classes you teach today and monitor students in each roster."
            : "Login, inspect session state, and input master data for Sprint 1."}
        </p>
      </div>

      <div className="session">
        <span className="session-label">Signed In As</span>
        <span className="session-value">{user.account_name}</span>
        <span className="muted">{user.email}</span>
        <span className="badge">{user.role}</span>
      </div>

      <div className="actions">
        {user.role === "admin" ? (
          <button className="button ghost" type="button" onClick={onRefreshAdmin} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh All"}
          </button>
        ) : null}
        {user.role === "lecturer" ? (
          <button className="button ghost" type="button" onClick={onRefreshLecturer} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh Today"}
          </button>
        ) : null}
        <button className="button danger" type="button" onClick={onLogout}>
          Logout
        </button>
      </div>

      {user.role === "admin" ? (
        <div className="tab-list">
          {resourceOrder.map((resourceKey) => (
            <button
              key={resourceKey}
              className={`tab ${activeResource === resourceKey ? "active" : ""}`}
              type="button"
              onClick={() => onSelectResource(resourceKey)}
            >
              {resourceLabels[resourceKey]}
            </button>
          ))}
        </div>
      ) : null}
    </aside>
  );
}
