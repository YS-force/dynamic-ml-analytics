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

function ErrorComparisonChart({ models }) {
  if (!models) return <p>No error metrics available.</p>;

  const data = Object.entries(models).map(([key, info]) => ({
    model: info.name || key,
    mae: info.mae,
    mse: info.mse,
    rmse: info.rmse,
  }));

  return (
    <div style={{ width: "100%", height: 260 }}>
      <h3>Error Metrics Comparison</h3>

      <ResponsiveContainer>
        <BarChart data={data}>
          <XAxis dataKey="model" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="mae" fill="#ef4444" name="MAE" />
          <Bar dataKey="mse" fill="#f59e0b" name="MSE" />
          <Bar dataKey="rmse" fill="#10b981" name="RMSE" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ErrorComparisonChart;
