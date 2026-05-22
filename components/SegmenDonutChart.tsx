"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface SegmenDonutChartProps {
  segmenDist: Record<string, number>;
}

const SEGMEN_COLORS: Record<string, string> = {
  Rendah: "#3b82f6",     // Blue
  Menengah: "#f59e0b",   // Amber
  Tinggi: "#ef4444",     // Red
  Premium: "#1e3a5f",    // Dark blue
};

const SEGMEN_LABELS: Record<string, string> = {
  Rendah: "Rendah (<1×)",
  Menengah: "Menengah (1-2×)",
  Tinggi: "Tinggi (2-3×)",
  Premium: "Premium (>3×)",
};

export default function SegmenDonutChart({ segmenDist }: SegmenDonutChartProps) {
  const total = Object.values(segmenDist).reduce((sum, v) => sum + v, 0);
  
  const data = Object.entries(segmenDist).map(([name, value]) => ({
    name,
    value,
    fill: SEGMEN_COLORS[name] || "#9ca3af",
    pct: total > 0 ? ((value / total) * 100).toFixed(0) : "0",
  }));

  // Sort by defined order
  const order = ["Rendah", "Menengah", "Tinggi", "Premium"];
  data.sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200 h-full">
      <h3 className="font-semibold text-slate-800 text-sm mb-4">
        Distribusi Segmen Harga
      </h3>
      
      <div className="flex items-center gap-6">
        {/* Donut Chart */}
        <div className="w-40 h-40 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={65}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) =>
                  `${Number(value).toLocaleString("id-ID")} listing`
                }
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2.5">
          {data.map((d) => (
            <div key={d.name} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: d.fill }}
              />
              <div className="text-xs">
                <span className="text-slate-600">{SEGMEN_LABELS[d.name] || d.name}</span>
                <span className="text-slate-400 ml-1">— {d.pct}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
