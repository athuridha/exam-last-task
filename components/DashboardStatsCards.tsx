"use client";

import { Home, TrendingUp, Layers, DollarSign } from "lucide-react";
import { ReactNode } from "react";

interface DashboardStats {
  total_listings: number;
  total_kota: number;
  total_kecamatan: number;
  avg_rasio_hnjop: number;
  median_harga: number;
  segmen_dominan: string;
}

const fmt = (n: number) =>
  n >= 1e9
    ? `Rp ${(n / 1e9).toFixed(1)} M`
    : n >= 1e6
    ? `Rp ${(n / 1e6).toFixed(0)} jt`
    : `Rp ${n.toLocaleString("id-ID")}`;

const SEGMEN_DESCRIPTIONS: Record<string, string> = {
  Rendah: "Rasio <1× NJOP",
  Menengah: "Rasio 1-2× NJOP",
  Tinggi: "Rasio 2-3× NJOP",
  Premium: "Rasio >3× NJOP",
};

export default function DashboardStatsCards({
  stats,
}: {
  stats: DashboardStats;
}) {
  const cards: {
    label: string;
    value: string;
    sub?: string;
    icon: ReactNode;
    color: string;
  }[] = [
    {
      label: "TOTAL LISTING",
      value: stats.total_listings.toLocaleString("id-ID"),
      sub: `${stats.total_kota} Kota · ${stats.total_kecamatan} Kecamatan`,
      icon: <Home size={22} strokeWidth={1.8} />,
      color: "border-l-indigo-500",
    },
    {
      label: "RATA-RATA RASIO HARGA/NJOP",
      value: `${stats.avg_rasio_hnjop.toFixed(2)}×`,
      sub: "Harga pasar vs nilai tanah",
      icon: <TrendingUp size={22} strokeWidth={1.8} />,
      color: "border-l-emerald-500",
    },
    {
      label: "SEGMEN DOMINAN",
      value: stats.segmen_dominan,
      sub: SEGMEN_DESCRIPTIONS[stats.segmen_dominan] || "",
      icon: <Layers size={22} strokeWidth={1.8} />,
      color: "border-l-amber-500",
    },
    {
      label: "MEDIAN HARGA",
      value: fmt(stats.median_harga),
      sub: "Per listing",
      icon: <DollarSign size={22} strokeWidth={1.8} />,
      color: "border-l-rose-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className={`bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow border-l-4 ${c.color}`}
        >
          <div className="flex items-start justify-between mb-2">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              {c.label}
            </span>
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
              {c.icon}
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {c.value}
          </div>
          {c.sub && (
            <div className="text-xs text-slate-400 mt-1">{c.sub}</div>
          )}
        </div>
      ))}
    </div>
  );
}
