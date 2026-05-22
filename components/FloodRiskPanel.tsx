"use client";

import { useState, useMemo } from "react";
import { FloodRisk, KecamatanStat } from "@/app/page";
import { AlertTriangle, AlertCircle, Shield, ShieldOff, ArrowRight, Filter } from "lucide-react";

interface Props {
  floodRisk: FloodRisk[];
  kecStats: KecamatanStat[];
  onSelectKec: (kec: string) => void;
  onGoToMap: () => void;
}

const fmt = (n: number) =>
  n >= 1e9 ? `Rp ${(n / 1e9).toFixed(2)} M` : `Rp ${(n / 1e6).toFixed(0)} jt`;

const RISK_STYLES: Record<string, { bg: string; text: string; border: string; dot: string; Icon: typeof AlertTriangle }> = {
  Tinggi: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500", Icon: AlertTriangle },
  Sedang: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", dot: "bg-orange-500", Icon: AlertCircle },
  Rendah: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500", Icon: Shield },
  "Tidak Terdeteksi": { bg: "bg-slate-50", text: "text-slate-500", border: "border-slate-200", dot: "bg-slate-400", Icon: ShieldOff },
};

export default function FloodRiskPanel({
  floodRisk,
  kecStats,
  onSelectKec,
  onGoToMap,
}: Props) {
  const [filterKota, setFilterKota] = useState("Semua");
  const [filterRisk, setFilterRisk] = useState("Semua");
  const [sortBy, setSortBy] = useState<"risk" | "mentions">("risk");

  const kecLookup = useMemo(() => {
    const m = new Map<string, KecamatanStat>();
    for (const k of kecStats) m.set(`${k.Kecamatan}|${k.Kota}`, k);
    return m;
  }, [kecStats]);

  const kotaList = useMemo(
    () => ["Semua", ...new Set(floodRisk.map((f) => f.Kota))].sort(),
    [floodRisk]
  );

  const filtered = useMemo(() => {
    let data = [...floodRisk];
    if (filterKota !== "Semua") data = data.filter((f) => f.Kota === filterKota);
    if (filterRisk !== "Semua")
      data = data.filter((f) => f.Kategori_Risiko === filterRisk);
    data.sort((a, b) =>
      sortBy === "risk"
        ? b.Risiko_Banjir - a.Risiko_Banjir
        : b.Sebutan_Langsung - a.Sebutan_Langsung
    );
    return data;
  }, [floodRisk, filterKota, filterRisk, sortBy]);

  const summaryStats = useMemo(() => {
    const cats = { Tinggi: 0, Sedang: 0, Rendah: 0, "Tidak Terdeteksi": 0 };
    for (const f of floodRisk) {
      cats[f.Kategori_Risiko as keyof typeof cats] =
        (cats[f.Kategori_Risiko as keyof typeof cats] || 0) + 1;
    }
    return cats;
  }, [floodRisk]);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(summaryStats).map(([cat, count]) => {
          const style = RISK_STYLES[cat] || RISK_STYLES["Tidak Terdeteksi"];
          return (
            <div
              key={cat}
              className={`rounded-xl border p-4 ${style.bg} ${style.border}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-medium uppercase tracking-wider ${style.text} opacity-70`}>{cat}</span>
                <style.Icon size={16} className={style.text} strokeWidth={2} />
              </div>
              <div className={`text-3xl font-bold ${style.text}`}>{count}</div>
              <div className="text-xs text-slate-400 mt-0.5">kecamatan</div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-wrap gap-3 items-end">
        <div className="flex items-center gap-2 mr-2">
          <Filter size={14} className="text-slate-400" />
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Filter</span>
        </div>
        <div>
          <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Kota</label>
          <select
            value={filterKota}
            onChange={(e) => setFilterKota(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
          >
            {kotaList.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Risiko</label>
          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
          >
            <option>Semua</option>
            <option>Tinggi</option>
            <option>Sedang</option>
            <option>Rendah</option>
            <option>Tidak Terdeteksi</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Urutkan</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "risk" | "mentions")}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
          >
            <option value="risk">Skor Risiko</option>
            <option value="mentions">Jumlah Sebutan</option>
          </select>
        </div>
        <div className="ml-auto text-xs text-slate-400">
          {filtered.length} dari {floodRisk.length} kecamatan
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">#</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Kecamatan</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Kota</th>
                <th className="text-center px-4 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Sebutan</th>
                <th className="text-center px-4 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Skor Risiko</th>
                <th className="text-center px-4 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Kategori</th>
                <th className="text-right px-4 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Median Harga</th>
                <th className="text-center px-4 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((f, i) => {
                const stat = kecLookup.get(`${f.Kecamatan}|${f.Kota}`);
                const style = RISK_STYLES[f.Kategori_Risiko] || RISK_STYLES["Tidak Terdeteksi"];
                return (
                  <tr key={`${f.Kecamatan}|${f.Kota}`} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-slate-300 text-xs">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{f.Kecamatan}</td>
                    <td className="px-4 py-3 text-slate-500">{f.Kota}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center bg-slate-100 text-slate-600 text-xs font-medium px-2 py-0.5 rounded-md min-w-[28px]">
                        {f.Sebutan_Langsung}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${f.Risiko_Banjir * 100}%`,
                              backgroundColor:
                                f.Risiko_Banjir >= 0.6
                                  ? "#dc2626"
                                  : f.Risiko_Banjir >= 0.3
                                  ? "#f97316"
                                  : "#eab308",
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">
                          {(f.Risiko_Banjir * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${style.bg} ${style.text} ${style.border} border`}
                      >
                        <style.Icon size={12} strokeWidth={2.5} />
                        {f.Kategori_Risiko}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600 tabular-nums">
                      {stat ? fmt(stat.Harga_Median) : "-"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => {
                          onSelectKec(f.Kecamatan);
                          onGoToMap();
                        }}
                        className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-xs font-medium transition-colors"
                      >
                        Peta <ArrowRight size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
