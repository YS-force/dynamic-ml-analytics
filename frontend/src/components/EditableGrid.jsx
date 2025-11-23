import React, { useState } from "react";
import "../styles/EditableGrid.css";

function EditableGrid({
  schema,
  records,
  loading,
  onCreate,
  onUpdate,
  onDelete,
  onBulkDelete
}) {
  const columns = schema?.columns || [];
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [newRow, setNewRow] = useState({});
  const [selected, setSelected] = useState([]);

  // ───────────────────────────────
  // Selection
  // ───────────────────────────────
  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selected.length === records.length) {
      setSelected([]);
    } else {
      setSelected(records.map((r) => r.id));
    }
  };

  // ───────────────────────────────
  // Edit
  // ───────────────────────────────
  const handleEditClick = (record) => {
    setEditingId(record.id);
    setEditForm({ ...record.data });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async (id) => {
    await onUpdate(id, editForm);
    setEditingId(null);
    setEditForm({});
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  // ───────────────────────────────
  // Create
  // ───────────────────────────────
  const handleNewChange = (e) => {
    const { name, value } = e.target;
    setNewRow((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async () => {
    await onCreate(newRow);
    setNewRow({});
  };

  // ───────────────────────────────
  // UI
  // ───────────────────────────────
  return (
    <div className="grid-wrapper">

      {/* Add Record Card */}
      {schema && (
        <div className="grid-add-wrapper">
          <div className="grid-add-form">
            {columns.map((col) => (
              <div className="grid-add-field" key={col}>
                <label>{col}</label>
                <input
                  name={col}
                  type="text"
                  value={newRow[col] || ""}
                  onChange={handleNewChange}
                />
              </div>
            ))}
          </div>

          <div className="grid-add-button">
            <button className="btn btn-primary btn-sm" onClick={handleCreate}>
              Add record
            </button>
          </div>
        </div>
      )}

      {/* Bulk Delete */}
      <div className="grid-bulk-actions">
        <button
          className="btn btn-danger btn-sm"
          disabled={selected.length === 0}
          onClick={() => onBulkDelete(selected)}
        >
          Delete Selected ({selected.length})
        </button>
      </div>

      {loading && <div className="grid-loading">Loading records…</div>}

      {/* Table */}
      <div className="grid-table-container">
        <table className="grid-table">
          <thead>
            <tr>
              <th className="sticky-col-left checkbox-col">
                <input
                  type="checkbox"
                  checked={
                    records.length > 0 &&
                    selected.length === records.length
                  }
                  onChange={toggleSelectAll}
                />
              </th>

              <th className="sticky-col-left id-col">ID</th>

              {columns.map((col) => (
                <th key={col}>{col}</th>
              ))}

              <th className="sticky-col">Actions</th>
            </tr>
          </thead>

          <tbody>
            {records.map((rec) => (
              <tr key={rec.id}>
                <td className="sticky-col-left checkbox-col">
                  <input
                    type="checkbox"
                    checked={selected.includes(rec.id)}
                    onChange={() => toggleSelect(rec.id)}
                  />
                </td>

                <td className="sticky-col-left id-col">{rec.id.slice(-6)}</td>

                {/* Row */}
                {editingId === rec.id ? (
                  columns.map((col) => (
                    <td key={col}>
                      <input
                        type="text"
                        name={col}
                        value={editForm[col] || ""}
                        onChange={handleEditChange}
                      />
                    </td>
                  ))
                ) : (
                  columns.map((col) => (
                    <td key={col}>{rec.data[col]}</td>
                  ))
                )}

                {/* Sticky Actions */}
                <td className="sticky-col actions-col">
                  {editingId === rec.id ? (
                    <>
                      <button
                        className="btn btn-xs btn-primary"
                        onClick={() => handleSaveEdit(rec.id)}
                      >
                        Save
                      </button>
                      <button
                        className="btn btn-xs btn-ghost"
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="btn btn-xs btn-ghost"
                        onClick={() => handleEditClick(rec)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-xs btn-danger"
                        onClick={() => onDelete(rec.id)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </div>
  );
}

export default EditableGrid;
