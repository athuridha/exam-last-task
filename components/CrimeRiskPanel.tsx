"use client";

import { useState, useMemo } from "react";
import { KecamatanStat } from "@/app/page";
import { AlertTriangle, AlertCircle, Shield, ShieldOff, ArrowRight, Filter, Siren } from "lucide-react";

export interface CrimeRisk {
  Kecamatan: string;
  Kota: string;
  Sebutan_Langsung: number;
  Risiko_Kejahatan: number;
  Kategori_Risiko: string;
}

export interface CrimeNews {
  Judul: string;
  Link: string;
  Tanggal: string;
  Kecamatan_Terkait: string;
  Sumber: string;
  Relevansi: number;
}

interface Props {
  crimeRisk: CrimeRisk[];
  crimeNews: CrimeNews[];
  kecStats: KecamatanStat[];
  onSelectKec: (kec: string) => void;
  onGoToMap: () => void;
}

const fmt = (n: number) =>
  n >= 1e9 ? `Rp ${(n / 1e9).toFixed(2)} M` : `Rp ${(n / 1e6).toFixed(0)} jt`;

const RISK_STYLES: Record<string, { bg: string; text: string; border: string; dot: string; Icon: typeof AlertTriangle }> = {
  Tinggi: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500", Icon: AlertTriangle },
  Sedang: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", dot: "bg-orange-500", Icon: AlertCircle },
  Rendah: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500", Icon: Shield },
  "Tidak Terdeteksi": { bg: "bg-slate-50", text: "text-slate-500", border: "border-slate-200", dot: "bg-slate-400", Icon: ShieldOff },
};

export default function CrimeRiskPanel({
  crimeRisk,
  crimeNews,
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
    () => ["Semua", ...new Set(crimeRisk.map((f) => f.Kota))].sort(),
    [crimeRisk]
  );

  const filtered = useMemo(() => {
    let data = [...crimeRisk];
    if (filterKota !== "Semua") data = data.filter((f) => f.Kota === filterKota);
    if (filterRisk !== "Semua")
      data = data.filter((f) => f.Kategori_Risiko === filterRisk);
    data.sort((a, b) =>
      sortBy === "risk"
        ? b.Risiko_Kejahatan - a.Risiko_Kejahatan
        : b.Sebutan_Langsung - a.Sebutan_Langsung
    );
    return data;
  }, [crimeRisk, filterKota, filterRisk, sortBy]);

  const summaryStats = useMemo(() => {
    const cats = { Tinggi: 0, Sedang: 0, Rendah: 0, "Tidak Terdeteksi": 0 };
    for (const f of crimeRisk) {
      const cat = f.Kategori_Risiko as keyof typeof cats;
      cats[cat] = (cats[cat] || 0) + 1;
    }
    return cats;
  }, [crimeRisk]);

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
              <option key={k} value={k}>{k}</option>
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
            <option value="Semua">Semua</option>
            <option value="Tinggi">Tinggi</option>
            <option value="Sedang">Sedang</option>
            <option value="Rendah">Rendah</option>
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
      </div>

      {/* Risk List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Kecamatan</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Kota</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Sebutan</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Skor Risiko</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Kategori</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Median Harga</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.slice(0, 50).map((item) => {
                const kec = kecLookup.get(`${item.Kecamatan}|${item.Kota}`);
                const style = RISK_STYLES[item.Kategori_Risiko] || RISK_STYLES["Tidak Terdeteksi"];
                return (
                  <tr key={`${item.Kecamatan}-${item.Kota}`} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{item.Kecamatan}</td>
                    <td className="px-4 py-3 text-slate-500">{item.Kota}</td>
                    <td className="px-4 py-3 text-center text-slate-600">{item.Sebutan_Langsung}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="w-full bg-slate-200 rounded-full h-2 max-w-[80px] mx-auto">
                        <div
                          className={`h-2 rounded-full ${style.dot}`}
                          style={{ width: `${item.Risiko_Kejahatan * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 mt-1">{(item.Risiko_Kejahatan * 100).toFixed(0)}%</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${style.dot} mr-1.5`} />
                        {item.Kategori_Risiko}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {kec ? fmt(kec.Harga_Median) : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          onSelectKec(item.Kecamatan);
                          onGoToMap();
                        }}
                        className="text-indigo-500 hover:text-indigo-700 p-1 rounded hover:bg-indigo-50 transition-colors"
                        title="Lihat di peta"
                      >
                        <ArrowRight size={16} />
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
