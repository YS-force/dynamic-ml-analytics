import React, { useState, useEffect } from "react";
import "../styles/ModelPanel.css";

const MODEL_OPTIONS = [
  { key: "linear", label: "Linear Regression" },
  { key: "random_forest", label: "Random Forest" },
  { key: "gradient_boosting", label: "Gradient Boosting" },
];

function ModelPanel({ schema, trainResult, prediction, onPredict }) {
  const [selectedModel, setSelectedModel] = useState("linear");
  const [form, setForm] = useState({});

  // Reset prediction inputs when dataset schema changes
  useEffect(() => {
    if (schema?.feature_columns) {
      const initial = {};
      schema.feature_columns.forEach((f) => (initial[f] = ""));
      setForm(initial);
    }
  }, [schema]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onPredict(form, selectedModel);
  };

  const currentMetrics = trainResult?.models?.[selectedModel] || null;

  return (
    <div className="model-panel">

      {/* ===== MODEL OVERVIEW ===== */}
      <div className="card">
        <h2>Model Overview</h2>

        {!schema ? (
          <p>Please upload a CSV to enable ML.</p>
        ) : !trainResult ? (
          <p>Train the models to view performance metrics.</p>
        ) : (
          <>
            {/* Model selector */}
            <div className="model-select-row">
              <label>Select model:</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
              >
                {MODEL_OPTIONS.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {currentMetrics && (
              <>
                <p className="model-status">
                  <strong>
                    {MODEL_OPTIONS.find((m) => m.key === selectedModel)?.label}
                  </strong>
                  <br />
                  R² Score: <strong>{currentMetrics.r2.toFixed(3)}</strong>
                </p>

                <div className="metric-grid">
                  <div className="metric-item">
                    <span className="metric-label">MAE</span>
                    <span>{currentMetrics.mae.toFixed(3)}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">MSE</span>
                    <span>{currentMetrics.mse.toFixed(3)}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">RMSE</span>
                    <span>{currentMetrics.rmse.toFixed(3)}</span>
                  </div>
                </div>

                {/* Feature Importance List */}
                {currentMetrics.feature_importance && (
                  <>
                    <h3>Feature Importance</h3>
                    <ul className="feature-list">
                      {Object.entries(currentMetrics.feature_importance).map(
                        ([name, value]) => (
                          <li key={name}>
                            <span>{name}</span>
                            <strong>{value.toFixed(4)}</strong>
                          </li>
                        )
                      )}
                    </ul>
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* ===== PREDICTION PANEL ===== */}
      <div className="card">
        <h2>
          Predict Target: <strong>{schema?.target || "Target"}</strong>
        </h2>

        {schema && (
          <div className="target-info-box">
            <p>
              <strong>{schema.target}</strong> was automatically detected as the
              <strong> prediction target</strong>.
            </p>

            <p className="why-target">
              The model will estimate <strong>{schema.target}</strong> based on
              the patterns found in the input features.
            </p>

            <p className="feature-title">Model uses these columns as features:</p>

            <ul className="feature-list">
              {schema.feature_columns.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        )}

        {!schema ? (
          <p>No dataset loaded.</p>
        ) : (
          <form className="predict-form" onSubmit={handleSubmit}>
            {schema.feature_columns.map((field) => (
              <div className="form-row" key={field}>
                <label>{field}</label>
                <input
                  type="number"
                  name={field}
                  value={form[field] || ""}
                  onChange={handleChange}
                />
              </div>
            ))}

            <button className="btn btn-primary btn-full">
              Predict using{" "}
              {MODEL_OPTIONS.find((m) => m.key === selectedModel)?.label}
            </button>
          </form>
        )}

        {prediction !== null && (
          <div className="prediction-result">
            <span>
              Predicted <strong>{schema?.target}</strong>
            </span>
            <strong className="predicted-value">
              {prediction.toFixed(3)}
            </strong>
          </div>
        )}
      </div>
    </div>
  );
}

export default ModelPanel;
