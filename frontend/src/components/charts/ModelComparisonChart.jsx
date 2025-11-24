import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

function ModelComparisonChart({ models }) {
  if (!models) return <p>No model metrics available.</p>;

  const data = Object.entries(models).map(([key, info]) => ({
    model: info.name || key,
    r2: info.r2,
  }));

  return (
    <div style={{ width: "100%", height: 260 }}>
      <h3>Model Performance (R² Comparison)</h3>

      <ResponsiveContainer>
        <BarChart data={data}>
          <XAxis dataKey="model" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="r2" fill="#3b82f6" name="R² Score" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ModelComparisonChart;
