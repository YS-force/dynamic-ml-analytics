// src/App.jsx
import React, { useEffect, useState } from "react";
import EditableGrid from "./components/EditableGrid";
import ModelPanel from "./components/ModelPanel";
import CreateTableModal from "./components/CreateTable";

// Charts (shown BELOW grid now)
import ModelComparisonChart from "./components/charts/ModelComparisonChart";
import ErrorComparisonChart from "./components/charts/ErrorComparisonChart";
import SHAPStyleFeatureChart from "./components/charts/SHAPStyleFeatureChart";

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
  const [showCreateTable, setShowCreateTable] = useState(false);
  const [selectedModel, setSelectedModel] = useState("linear"); // required for SHAP chart

  // -------------------------------
  // Helper: Show message
  // -------------------------------
  const showMessage = (text, type = "info") => {
    setMsg(text);
    setMsgType(type);
    if (text) setTimeout(() => setMsg(""), 4000);
  };

  // -------------------------------
  // Fetch schema
  // -------------------------------
  const fetchSchema = async () => {
    try {
      const res = await fetch(`${API_BASE}/schema`);
      if (res.ok) {
        const data = await res.json();
        setSchema(data);
      }
    } catch {
      console.log("No schema yet.");
    }
  };

  // -------------------------------
  // Fetch records
  // -------------------------------
  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/records`);
      const data = await res.json();
      setRecords(data);
    } catch {
      showMessage("Failed to load records", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchema();
    fetchRecords();
  }, []);

  // -------------------------------
  // Create empty table
  // -------------------------------
  const handleCreateNewTable = async (columns) => {
    const res = await fetch(`${API_BASE}/create-empty-dataset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ columns }),
    });

    const schemaData = await res.json();
    setSchema(schemaData);
    setRecords([]);

    setShowCreateTable(false);
  };

  // -------------------------------
  // Upload CSV
  // -------------------------------
  const handleUploadDataset = async (e) => {
    e.preventDefault();
    if (!file) return;

    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/upload-dataset`, {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Upload failed");

      setSchema(data);
      setTrainResult(null);
      setPrediction(null);

      showMessage("Dataset uploaded.", "success");
      fetchRecords();
    } catch (err) {
      showMessage(err.message, "error");
    }
  };

  // -------------------------------
  // CRUD
  // -------------------------------
  const handleCreateRecord = async (record) => {
    try {
      const res = await fetch(`${API_BASE}/records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: record }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);

      showMessage("Record added.", "success");
      fetchRecords();
    } catch (err) {
      showMessage(err.message, "error");
    }
  };

  const handleUpdateRecord = async (id, record) => {
    try {
      const res = await fetch(`${API_BASE}/records/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: record }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);

      showMessage("Record updated.", "success");
      fetchRecords();
    } catch (err) {
      showMessage(err.message, "error");
    }
  };

  const handleDeleteRecord = async (id) => {
    if (!window.confirm("Delete this row?")) return;

    try {
      const res = await fetch(`${API_BASE}/records/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.detail);

      showMessage("Record deleted.", "success");
      fetchRecords();
    } catch (err) {
      showMessage(err.message, "error");
    }
  };

  const handleBulkDelete = async (ids) => {
    if (!window.confirm("Delete selected rows?")) return;

    try {
      for (const id of ids) {
        await fetch(`${API_BASE}/records/${id}`, { method: "DELETE" });
      }
      showMessage("Rows deleted.", "success");
      fetchRecords();
    } catch {
      showMessage("Bulk delete failed", "error");
    }
  };

  const refreshAll = async () => {
    await fetchSchema();
    await fetchRecords();
  };

  // -------------------------------
  // Train ML models
  // -------------------------------
  const handleTrainModels = async () => {
    try {
      const res = await fetch(`${API_BASE}/train`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.detail);

      setTrainResult(data);
      setSchema(data.schema);

      showMessage("Models trained.", "success");
    } catch (err) {
      showMessage(err.message, "error");
    }
  };

  // -------------------------------
  // Predict
  // -------------------------------
  const handlePredict = async (input, modelKey) => {
    setSelectedModel(modelKey);

    try {
      const res = await fetch(`${API_BASE}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: modelKey, features: input }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);

      setPrediction(data.prediction_pdmrg);
      showMessage("Prediction ready.", "success");
    } catch (err) {
      showMessage(err.message, "error");
    }
  };

  // -------------------------------
  // UI
  // -------------------------------
  return (
    <div className="app-root">

      {/* HEADER */}
      <header className="app-header">
        <h1 className="app-title">Dynamic Grid & ML Prediction</h1>

        <div className="header-actions">

          <form onSubmit={handleUploadDataset} className="upload-form">
            <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files[0])} />
            <button className="btn btn-primary">Upload CSV</button>
          </form>

          <button className="btn btn-primary" onClick={() => setShowCreateTable(true)}>
            Create Table
          </button>

          <button className="btn btn-primary" onClick={handleTrainModels}>
            Train Models
          </button>

          <button className="btn btn-primary" onClick={() => window.open(`${API_BASE}/download`)}>
            ⬇ Download CSV
          </button>

        </div>
      </header>

      {msg && <div className={`message message-${msgType}`}>{msg}</div>}

      {/* MAIN GRID + SIDEPANEL */}
      <main className="app-layout">

        {/* LEFT SIDE - GRID */}
        <section className="panel panel-main">
          <h2>Dataset</h2>

          {schema ? (
            <EditableGrid
              schema={schema}
              records={records}
              loading={loading}
              onCreate={handleCreateRecord}
              onUpdate={handleUpdateRecord}
              onDelete={handleDeleteRecord}
              onBulkDelete={handleBulkDelete}
              onRefresh={refreshAll}
            />
          ) : (
            <p>Upload CSV or Create Table to begin.</p>
          )}
        </section>

        {/* RIGHT SIDE - MODEL PANEL */}
        <section className="panel panel-side">
          <ModelPanel
            schema={schema}
            trainResult={trainResult}
            prediction={prediction}
            onPredict={handlePredict}
          />
        </section>
      </main>

      {/* ========================= */}
      {/* CHARTS BELOW THE GRID     */}
      {/* ========================= */}
      {trainResult && (
        <div className="charts-below-grid">
  <h2 className="charts-title">Model Performance Visualizations</h2>

  <div className="charts-row">
    <div className="chart-card">
      <ModelComparisonChart models={trainResult.models} />
    </div>

    <div className="chart-card">
      <ErrorComparisonChart models={trainResult.models} />
    </div>

    {trainResult.models[selectedModel]?.feature_importance && (
      <div className="chart-card">
        <SHAPStyleFeatureChart
          featureImportance={
            trainResult.models[selectedModel].feature_importance
          }
        />
      </div>
    )}
  </div>
</div>

      )}

      {/* Modal */}
      {showCreateTable && (
        <CreateTableModal
          onClose={() => setShowCreateTable(false)}
          onCreate={handleCreateNewTable}
        />
      )}

    </div>
  );
}

export default App;
