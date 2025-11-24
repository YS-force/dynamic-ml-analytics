import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

function SHAPStyleFeatureChart({ featureImportance }) {
  if (!featureImportance) return <p>No feature importance data.</p>;

  const data = Object.entries(featureImportance).map(([key, value]) => ({
    feature: key,
    importance: value
  }));

  return (
    <div style={{ width: "100%", height: 260 }}>
      <h3>SHAP-Style Feature Importance</h3>

      <ResponsiveContainer>
        <BarChart layout="vertical" data={data}>
          <XAxis type="number" />
          <YAxis dataKey="feature" type="category" width={120} />
          <Tooltip />
          <Bar dataKey="importance" fill="#6366f1" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default SHAPStyleFeatureChart;
