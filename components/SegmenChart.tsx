"use client";

import { Summary } from "@/app/page";
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

// Segmentasi sesuai skripsi: Rasio Harga/NJOP
const SEGMEN_COLORS: Record<string, string> = {
  Rendah: "#3b82f6",       // Blue - rasio < 1×
  Menengah: "#f59e0b",     // Amber - rasio 1-2×
  Tinggi: "#ef4444",       // Red - rasio 2-3×
  Premium: "#1e3a5f",      // Dark blue - rasio ≥ 3×
};

const SEGMEN_ORDER = ["Rendah", "Menengah", "Tinggi", "Premium"];

export default function SegmenChart({ summary }: { summary: Summary }) {
  const data = Object.entries(summary.segmen_dist)
    .map(([name, value]) => ({
      name,
      value,
      fill: SEGMEN_COLORS[name] || "#9ca3af",
    }))
    .sort((a, b) => SEGMEN_ORDER.indexOf(a.name) - SEGMEN_ORDER.indexOf(b.name));

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-slate-800 text-sm">
            Distribusi Segmen Harga (Rasio Harga/NJOP)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {total.toLocaleString("id-ID")} total listing
          </p>
        </div>
      </div>
      <div className="flex flex-col md:flex-row items-start gap-6">
        <div className="w-full md:w-2/3 h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" tickFormatter={(v) => v.toLocaleString()} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={110} tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v) => `${Number(v).toLocaleString("id-ID")} listing`}
                contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: 13 }}
              />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={22}>
                {data.map((d) => (
                  <Cell key={d.name} fill={d.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2.5 md:flex-col">
          {data.map((d) => {
            const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : "0";
            return (
              <div key={d.name} className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: d.fill }} />
                <div className="text-sm">
                  <span className="text-slate-500">{d.name}</span>
                  <span className="font-semibold text-slate-700 ml-1.5">
                    {d.value.toLocaleString("id-ID")}
                  </span>
                  <span className="text-slate-400 text-xs ml-1">({pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
