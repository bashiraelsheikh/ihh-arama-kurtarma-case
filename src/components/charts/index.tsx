"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const COLORS = ["#ea5b0c", "#15293a", "#16a34a", "#d97706", "#0891b2", "#7c3aed", "#db2777"];
const PRIMARY = "#ea5b0c";

export function BarChartView({
  data,
  xKey,
  barKey,
  label,
  horizontal = false,
}: {
  data: Record<string, unknown>[];
  xKey: string;
  barKey: string;
  label?: string;
  horizontal?: boolean;
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout={horizontal ? "vertical" : "horizontal"} margin={{ left: horizontal ? 40 : 0, right: 16, top: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        {horizontal ? (
          <>
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey={xKey} tick={{ fontSize: 11 }} width={140} />
          </>
        ) : (
          <>
            <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
          </>
        )}
        <Tooltip formatter={(v) => [v as number, label ?? barKey]} />
        <Bar dataKey={barKey} fill={PRIMARY} radius={[4, 4, 0, 0]} name={label ?? barKey} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function LineChartView({
  data,
  xKey,
  lineKey,
  label,
  height = 280,
}: {
  data: Record<string, unknown>[];
  xKey: string;
  lineKey: string;
  label?: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ left: 0, right: 16, top: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v) => [v as number, label ?? lineKey]} />
        <Line type="monotone" dataKey={lineKey} stroke={PRIMARY} strokeWidth={2} dot={{ r: 3 }} name={label ?? lineKey} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function DonutChartView({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
