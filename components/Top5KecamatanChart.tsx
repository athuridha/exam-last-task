"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";

interface Top5KecamatanChartProps {
  data: Array<{ kecamatan: string; kota: string; avgRasio: number }>;
}

export default function Top5KecamatanChart({ data }: Top5KecamatanChartProps) {
  const chartData = data.slice(0, 5).map((d) => ({
    ...d,
    avgRasio: parseFloat(d.avgRasio.toFixed(1)),
    label: d.kecamatan,
  }));

  // Find max value for domain
  const maxVal = Math.max(...chartData.map((d) => d.avgRasio), 0);

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200">
      <h3 className="font-semibold text-slate-800 text-sm mb-4">
        Top 5 Kecamatan — Rasio Harga/NJOP Tertinggi
      </h3>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            barCategoryGap="25%"
            margin={{ left: 0, right: 50 }}
          >
            <XAxis
              type="number"
              hide
              domain={[0, maxVal + 2]}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={110}
              tick={{ fill: "#475569", fontSize: 12, fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(v, _name, props) => [
                `${Number(v).toFixed(1)}× (${(props as { payload?: { kota?: string } })?.payload?.kota || ""})`,
                "Rasio H/NJOP",
              ]}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                fontSize: 12,
              }}
            />
            <Bar dataKey="avgRasio" radius={[0, 4, 4, 0]} barSize={20}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={index === 0 ? "#dc2626" : "#ef4444"}
                />
              ))}
              <LabelList
                dataKey="avgRasio"
                position="right"
                formatter={(v) => `${Number(v).toFixed(1)}×`}
                style={{ fill: "#64748b", fontSize: 11, fontWeight: 500 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
