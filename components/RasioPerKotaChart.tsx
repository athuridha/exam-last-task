"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from "recharts";

interface RasioPerKotaChartProps {
  data: Array<{ kota: string; avgRasio: number }>;
}

export default function RasioPerKotaChart({ data }: RasioPerKotaChartProps) {
  // Sort by avgRasio descending and take top 8
  const chartData = [...data]
    .sort((a, b) => b.avgRasio - a.avgRasio)
    .slice(0, 8)
    .map((d) => ({
      ...d,
      avgRasio: parseFloat(d.avgRasio.toFixed(2)),
    }));

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200 h-full">
      <h3 className="font-semibold text-slate-800 text-sm mb-4">
        Rata-rata Rasio Harga/NJOP per Kota
      </h3>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            barCategoryGap="18%"
            margin={{ left: 0, right: 20 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={true}
              vertical={false}
              stroke="#f1f5f9"
            />
            <XAxis
              type="number"
              tickFormatter={(v) => `${v}×`}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              domain={[0, "dataMax + 0.5"]}
            />
            <YAxis
              type="category"
              dataKey="kota"
              width={120}
              tick={{ fill: "#475569", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(v) => [`${Number(v).toFixed(2)}×`, "Rasio"]}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                fontSize: 12,
              }}
            />
            <Bar dataKey="avgRasio" radius={[0, 4, 4, 0]} barSize={18}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={index === 0 ? "#1e3a5f" : "#3b82f6"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
