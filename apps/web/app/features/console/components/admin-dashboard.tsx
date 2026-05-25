import { useMemo, useState } from "react";
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
  onUpdate: (id: string, values: Record<string, string>) => void;
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
  onUpdate,
}: AdminDashboardProps) {
  const [editingItem, setEditingItem] = useState<ResourceItem | null>(null);
  const [editingValues, setEditingValues] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const isEditing = Boolean(editingItem);
  const canCreate = config.canCreate ?? true;
  const canDelete = config.canDelete ?? true;
  const effectiveValues = isEditing ? editingValues : formValues;
  const selectedRole = effectiveValues.role;
  const selectedStudentId = effectiveValues.student_id;
  const selectedLecturerId = effectiveValues.lecturer_id;
  const linkedAccountForSelectedProfile = useMemo(() => {
    if (config.key !== "users") {
      return null;
    }

    if (selectedRole === "student" && selectedStudentId) {
      return records.users.find((item) => item.student_id === selectedStudentId) ?? null;
    }

    if (selectedRole === "lecturer" && selectedLecturerId) {
      return records.users.find((item) => item.lecturer_id === selectedLecturerId) ?? null;
    }

    return null;
  }, [config.key, records.users, selectedLecturerId, selectedRole, selectedStudentId]);

  function startEdit(item: ResourceItem) {
    const values = config.fields.reduce((accumulator, field) => {
      accumulator[field.name] = field.name === "password" ? "" : String(item[field.name] ?? "");
      return accumulator;
    }, {} as Record<string, string>);

    setEditingItem(item);
    setEditingValues(values);
    setShowPassword(false);
  }

  function cancelEdit() {
    setEditingItem(null);
    setEditingValues({});
    setShowPassword(false);
  }

  function handleValueChange(fieldName: string, value: string) {
    if (isEditing) {
      setEditingValues((current) => ({
        ...current,
        [fieldName]: value,
      }));
      return;
    }

    onFormChange(fieldName, value);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (!isEditing) {
      if (!canCreate) {
        event.preventDefault();
        return;
      }

      onCreate(event);
      return;
    }

    event.preventDefault();
    const id = String(editingItem?.id ?? "");
    if (id) {
      onUpdate(id, editingValues);
    }
  }

  return (
    <div className="grid two">
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">{config.title}</p>
            <h2>{isEditing ? config.updateTitle ?? `Update ${config.singularLabel}` : config.createTitle ?? "Create Record"}</h2>
          </div>
          {isEditing ? (
            <button className="button ghost" type="button" onClick={cancelEdit}>
              Cancel
            </button>
          ) : null}
        </div>
        <div className="panel-body">
          {config.formHelp ? <p className="form-note">{config.formHelp}</p> : null}
          {!canCreate && !isEditing ? (
            <div className="message">
              Select a record from the table to update it.
            </div>
          ) : null}
          {config.key === "users" && !isEditing && linkedAccountForSelectedProfile ? (
            <div className="message">
              This profile already has an account. Select the account row to update it.
            </div>
          ) : null}
          <form className="form-grid" onSubmit={handleSubmit}>
            {config.fields.map((field) => {
              const options = field.getOptions ? field.getOptions(records) : field.options;
              const fieldValue = effectiveValues[field.name] ?? "";
              const inputType =
                field.type === "number"
                  ? "number"
                  : field.type === "password" && !showPassword
                    ? "password"
                    : "text";

              return (
                <div className="field" key={field.name}>
                  <label htmlFor={`${config.key}-${field.name}`}>{field.label}</label>
                  {field.type === "select" ? (
                    <select
                      id={`${config.key}-${field.name}`}
                      value={fieldValue}
                      onChange={(event) => handleValueChange(field.name, event.target.value)}
                    >
                      <option value="">Select...</option>
                      {(options ?? []).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : field.type === "password" ? (
                    <div className="input-action">
                      <input
                        id={`${config.key}-${field.name}`}
                        type={inputType}
                        placeholder={isEditing ? "Leave blank to keep current password" : field.placeholder}
                        value={fieldValue}
                        onChange={(event) => handleValueChange(field.name, event.target.value)}
                      />
                      <button className="button ghost" type="button" onClick={() => setShowPassword((value) => !value)}>
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                  ) : (
                    <input
                      id={`${config.key}-${field.name}`}
                      type={inputType}
                      placeholder={field.placeholder}
                      value={fieldValue}
                      onChange={(event) => handleValueChange(field.name, event.target.value)}
                    />
                  )}
                </div>
              );
            })}

            {error ? <div className="message error">{error}</div> : null}
            {message ? <div className="message">{message}</div> : null}

            {isEditing || canCreate ? (
              <button className="button primary" disabled={submitting}>
                {submitting
                  ? "Saving..."
                  : isEditing
                    ? `Update ${config.singularLabel}`
                    : `Create ${config.singularLabel}`}
              </button>
            ) : null}
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
                          <div className="row-actions">
                            <button
                              className="button"
                              type="button"
                              onClick={() => startEdit(item)}
                              disabled={loading}
                            >
                              Edit
                            </button>
                            {canDelete ? (
                              <button
                                className="button danger"
                                type="button"
                                onClick={() => onDelete(id)}
                                disabled={loading}
                              >
                                {config.deleteActionLabel ?? "Delete"}
                              </button>
                            ) : null}
                          </div>
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
