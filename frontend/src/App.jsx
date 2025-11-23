// src/App.jsx
import React, { useEffect, useState } from "react";
import EditableGrid from "./components/EditableGrid";
import ModelPanel from "./components/ModelPanel";
import "./App.css";

const API_BASE = "http://127.0.0.1:8000";

function App() {
  const [records, setRecords] = useState([]);
  const [schema, setSchema] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("info");
  const [trainResult, setTrainResult] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [file, setFile] = useState(null);

  // ───────────────────────────────────────────────
  // Helper: Show message
  // ───────────────────────────────────────────────
  const showMessage = (text, type = "info") => {
    setMsg(text);
    setMsgType(type);
    if (text) {
      setTimeout(() => setMsg(""), 4000);
    }
  };

  // ───────────────────────────────────────────────
  // Fetch schema
  // ───────────────────────────────────────────────
  const fetchSchema = async () => {
    try {
      const res = await fetch(`${API_BASE}/schema`);
      if (res.ok) {
        const data = await res.json();
        setSchema(data);
      }
    } catch (err) {
      console.log("No schema yet.");
    }
  };

  // ───────────────────────────────────────────────
  // Fetch records
  // ───────────────────────────────────────────────
  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/records`);
      const data = await res.json();
      setRecords(data);
    } catch (err) {
      showMessage("Failed to load records.", "error");
    } finally {
      setLoading(false);
    }
  };

  // ───────────────────────────────────────────────
  // Run once on load
  // ───────────────────────────────────────────────
  useEffect(() => {
    fetchSchema();
    fetchRecords();
  }, []);

  // ───────────────────────────────────────────────
  // Upload dataset
  // ───────────────────────────────────────────────
  const handleUploadDataset = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/upload-dataset`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Upload failed");

      setSchema(data);
      setTrainResult(null);
      setPrediction(null);

      showMessage("Dataset uploaded successfully.", "success");
      fetchRecords();
    } catch (err) {
      showMessage(err.message, "error");
    }
  };

  // ───────────────────────────────────────────────
  // Create record (dynamic)
  // ───────────────────────────────────────────────
  const handleCreateRecord = async (record) => {
    try {
      const payload = { data: record };

      const res = await fetch(`${API_BASE}/records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Create failed");

      showMessage("Record created.", "success");
      fetchRecords();
    } catch (err) {
      showMessage(err.message, "error");
    }
  };

  // ───────────────────────────────────────────────
  // Update record (dynamic)
  // ───────────────────────────────────────────────
  const handleUpdateRecord = async (id, record) => {
    try {
      const payload = { data: record };

      const res = await fetch(`${API_BASE}/records/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Update failed");

      showMessage("Record updated.", "success");
      fetchRecords();
    } catch (err) {
      showMessage(err.message, "error");
    }
  };

  // ───────────────────────────────────────────────
  // Delete record
  // ───────────────────────────────────────────────
  const handleDeleteRecord = async (id) => {
    if (!window.confirm("Delete this record?")) return;

    try {
      const res = await fetch(`${API_BASE}/records/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Delete failed");

      showMessage("Record deleted.", "success");
      fetchRecords();
    } catch (err) {
      showMessage(err.message, "error");
    }
  };

  // ───────────────────────────────────────────────
  // Bulk delete
  // ───────────────────────────────────────────────
  const handleBulkDelete = async (ids) => {
    if (!window.confirm(`Delete ${ids.length} selected records?`)) return;

    try {
      for (const id of ids) {
        await fetch(`${API_BASE}/records/${id}`, { method: "DELETE" });
      }
      showMessage(`Deleted ${ids.length} records.`, "success");
      fetchRecords();
    } catch (err) {
      showMessage("Bulk delete failed.", "error");
    }
  };

  // ───────────────────────────────────────────────
  // Train ML models (dynamic)
  // ───────────────────────────────────────────────
  const handleTrainModels = async () => {
    try {
      const res = await fetch(`${API_BASE}/train`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Training failed");

      setTrainResult(data);
      setSchema(data.schema); // backend sends updated schema

      showMessage(
        `Models trained on ${data.samples} samples.`,
        "success"
      );
    } catch (err) {
      showMessage(err.message, "error");
    }
  };

  // ───────────────────────────────────────────────
  // Predict using model
  // ───────────────────────────────────────────────
  const handlePredict = async (inputFeatures, modelKey) => {
    try {
      const payload = {
        model: modelKey,
        features: inputFeatures, // dynamic
      };

      const res = await fetch(`${API_BASE}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Prediction failed");

      setPrediction(data.prediction_pdmrg);
      showMessage("Prediction generated.", "success");
    } catch (err) {
      showMessage(err.message, "error");
    }
  };

  // ───────────────────────────────────────────────
  // Download CSV
  // ───────────────────────────────────────────────
  const handleDownload = () => {
    window.open(`${API_BASE}/download`, "_blank");
  };

  // ───────────────────────────────────────────────
  // UI
  // ───────────────────────────────────────────────
  return (
    <div className="app-root">
      <header className="app-header">
        <div>
          <h1 className="app-title">Dynamic ML Grid</h1>
          <p className="app-subtitle">
            Upload any CSV → edit → train ML → predict. Fully dynamic.
          </p>
        </div>

        <div className="header-actions">

          {/* Upload CSV */}
          <form onSubmit={handleUploadDataset} className="upload-form">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files[0])}
            />
            <button className="btn btn-outline btn-sm" type="submit">
              Upload CSV
            </button>
          </form>

          <button className="btn btn-primary" onClick={handleTrainModels}>
            Train models
          </button>

          <button className="btn btn-outline" onClick={handleDownload}>
            ⬇ Download CSV
          </button>
        </div>
      </header>

      {msg && (
        <div className={`message message-${msgType}`}>
          <span>{msg}</span>
        </div>
      )}

      <main className="app-layout">
        <section className="panel panel-main">
          <h2 className="panel-title">Dataset</h2>
          <p className="panel-description">
            Edit records. Columns adapt automatically to uploaded dataset.
          </p>

          {schema ? (
            <EditableGrid
              schema={schema}
              records={records}
              loading={loading}
              onCreate={handleCreateRecord}
              onUpdate={handleUpdateRecord}
              onDelete={handleDeleteRecord}
              onBulkDelete={handleBulkDelete}
            />
          ) : (
            <p className="no-schema-text">Upload a CSV to begin.</p>
          )}
        </section>

        <section className="panel panel-side">
          <ModelPanel
            schema={schema}
            trainResult={trainResult}
            prediction={prediction}
            onPredict={handlePredict}
          />
        </section>
      </main>

      <footer className="app-footer">
       
      </footer>
    </div>
  );
}

export default App;
