import React, { useState } from "react";
import "../styles/CreateTable.css";

function CreateTable({ onClose, onCreate }) {
  const [columns, setColumns] = useState([""]);
  
  const addColumnField = () => {
    setColumns([...columns, ""]);
  };

  const updateColumn = (index, value) => {
    const updated = [...columns];
    updated[index] = value;
    setColumns(updated);
  };

  const handleCreate = () => {
    const valid = columns.filter((c) => c.trim() !== "");
    if (valid.length === 0) {
      alert("Column names cannot be empty.");
      return;
    }
    onCreate(valid);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <h2>Create New Table</h2>

        <div className="modal-body">
          {columns.map((col, i) => (
            <input
              key={i}
              className="modal-input"
              placeholder={`Column ${i + 1}`}
              value={col}
              onChange={(e) => updateColumn(i, e.target.value)}
            />
          ))}

          <button className="btn btn-outline" onClick={addColumnField}>
            + Add Column
          </button>
        </div>

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleCreate}>
            Create Table
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateTable;
