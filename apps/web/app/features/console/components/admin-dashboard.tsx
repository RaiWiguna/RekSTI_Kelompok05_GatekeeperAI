import type { FormEvent } from "react";

import type { ResourceConfig, ResourceForms, ResourceItem, ResourceStore } from "../types";

type AdminDashboardProps = {
  config: ResourceConfig;
  error: string | null;
  filteredItems: ResourceItem[];
  formValues: ResourceForms[keyof ResourceForms];
  loading: boolean;
  message: string | null;
  records: ResourceStore;
  query: string;
  submitting: boolean;
  onCreate: (event: FormEvent<HTMLFormElement>) => void;
  onDelete: (id: string) => void;
  onFormChange: (fieldName: string, value: string) => void;
  onQueryChange: (value: string) => void;
  onRefresh: () => void;
};

export function AdminDashboard({
  config,
  error,
  filteredItems,
  formValues,
  loading,
  message,
  records,
  query,
  submitting,
  onCreate,
  onDelete,
  onFormChange,
  onQueryChange,
  onRefresh,
}: AdminDashboardProps) {
  return (
    <div className="grid two">
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">{config.title}</p>
            <h2>Create Record</h2>
          </div>
        </div>
        <div className="panel-body">
          <form className="form-grid" onSubmit={onCreate}>
            {config.fields.map((field) => {
              const options = field.getOptions ? field.getOptions(records) : field.options;
              const fieldValue = formValues[field.name] ?? "";

              return (
                <div className="field" key={field.name}>
                  <label htmlFor={`${config.key}-${field.name}`}>{field.label}</label>
                  {field.type === "select" ? (
                    <select
                      id={`${config.key}-${field.name}`}
                      value={fieldValue}
                      onChange={(event) => onFormChange(field.name, event.target.value)}
                    >
                      <option value="">Select...</option>
                      {(options ?? []).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={`${config.key}-${field.name}`}
                      type={
                        field.type === "number"
                          ? "number"
                          : field.type === "password"
                            ? "password"
                            : "text"
                      }
                      placeholder={field.placeholder}
                      value={fieldValue}
                      onChange={(event) => onFormChange(field.name, event.target.value)}
                    />
                  )}
                </div>
              );
            })}

            {error ? <div className="message error">{error}</div> : null}
            {message ? <div className="message">{message}</div> : null}

            <button className="button primary" disabled={submitting}>
              {submitting ? "Saving..." : `Create ${config.singularLabel}`}
            </button>
          </form>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">{config.title}</p>
            <h3>Records</h3>
          </div>
          <div className="toolbar">
            <input
              className="search"
              placeholder={`Search ${config.title.toLowerCase()}...`}
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
            />
            <button className="button" type="button" onClick={onRefresh} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        <div className="panel-body">
          {filteredItems.length === 0 ? (
            <p className="muted">{config.emptyMessage}</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    {config.columns.map((column) => (
                      <th key={column.key}>{column.label}</th>
                    ))}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => {
                    const id = String(item.id ?? "");

                    return (
                      <tr key={id}>
                        {config.columns.map((column) => (
                          <td key={column.key}>{column.render(item)}</td>
                        ))}
                        <td>
                          <button
                            className="button danger"
                            type="button"
                            onClick={() => onDelete(id)}
                            disabled={loading}
                          >
                            {config.deleteActionLabel ?? "Delete"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
