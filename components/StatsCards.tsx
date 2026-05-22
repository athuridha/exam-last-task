import { Summary } from "@/app/page";
import { Home, MapPin, DollarSign, BarChart3, TrendingUp } from "lucide-react";
import { ReactNode } from "react";

const fmt = (n: number) =>
  n >= 1e9
    ? `Rp ${(n / 1e9).toFixed(1)} M`
    : `Rp ${(n / 1e6).toFixed(0)} jt`;

export default function StatsCards({ summary }: { summary: Summary }) {
  const cards: { label: string; value: string; sub?: string; icon: ReactNode; iconBg: string }[] = [
    {
      label: "Total Listing",
      value: summary.total_listings.toLocaleString("id-ID"),
      sub: `${summary.total_kota} kota/kabupaten`,
      icon: <Home size={20} strokeWidth={1.8} />,
      iconBg: "bg-indigo-50 text-indigo-600",
    },
    {
      label: "Kecamatan",
      value: summary.total_kecamatan.toString(),
      sub: "wilayah teranalisis",
      icon: <MapPin size={20} strokeWidth={1.8} />,
      iconBg: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Median Harga",
      value: fmt(summary.harga_median),
      sub: "seluruh Jabodetabek",
      icon: <DollarSign size={20} strokeWidth={1.8} />,
      iconBg: "bg-amber-50 text-amber-600",
    },
    {
      label: "Rentang Harga",
      value: `${fmt(summary.harga_min)} — ${fmt(summary.harga_max)}`,
      sub: "min hingga maks",
      icon: <TrendingUp size={20} strokeWidth={1.8} />,
      iconBg: "bg-violet-50 text-violet-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{c.label}</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.iconBg}`}>
              {c.icon}
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 tracking-tight">{c.value}</div>
          {c.sub && <div className="text-xs text-slate-400 mt-1">{c.sub}</div>}
        </div>
      ))}
    </div>
  );
}
