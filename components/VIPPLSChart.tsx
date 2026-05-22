"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";

interface VIPData {
  variabel: string;
  kode: string;
  konstruk: string;
  vip: number;
  signifikan: boolean;
}

interface PLSResponse {
  model_info: {
    method: string;
    n_components: number;
    n_samples: number;
    r_squared: number;
    adjusted_r_squared: number;
    rmse: number;
    cross_validation: string;
    target_variable: string;
  };
  vip_scores: VIPData[];
  konstruk_summary: Array<{
    konstruk: string;
    avg_vip: number;
    signifikan: boolean;
    hipotesis: string;
  }>;
}

// Fallback data for initial render
const FALLBACK_VIP: VIPData[] = [
  { variabel: "Jarak ke Pusat Kota", kode: "Jarak_Pusat", konstruk: "Aksesibilitas", vip: 1.89, signifikan: true },
  { variabel: "NJOP per m²", kode: "NJOP", konstruk: "Lokasional", vip: 1.72, signifikan: true },
  { variabel: "Akses Kereta", kode: "Akses_Kereta", konstruk: "Aksesibilitas", vip: 1.45, signifikan: true },
  { variabel: "Akses Tol", kode: "Akses_Tol", konstruk: "Aksesibilitas", vip: 1.31, signifikan: true },
  { variabel: "Skor Fasilitas", kode: "Skor_Fasilitas", konstruk: "Fasilitas", vip: 1.18, signifikan: true },
  { variabel: "Risiko Banjir", kode: "Risiko_Banjir", konstruk: "Risiko", vip: 1.05, signifikan: true },
  { variabel: "Indeks Kejahatan", kode: "Indeks_Kejahatan", konstruk: "Risiko", vip: 0.94, signifikan: false },
  { variabel: "Skor Legalitas", kode: "Skor_Legalitas", konstruk: "Fisik", vip: 0.87, signifikan: false },
  { variabel: "Luas Tanah", kode: "Luas_Tanah", konstruk: "Fisik", vip: 0.76, signifikan: false },
  { variabel: "Luas Bangunan", kode: "Luas_Bangunan", konstruk: "Fisik", vip: 0.68, signifikan: false },
  { variabel: "Kamar Tidur", kode: "Kamar_Tidur", konstruk: "Fisik", vip: 0.52, signifikan: false },
  { variabel: "Kamar Mandi", kode: "Kamar_Mandi", konstruk: "Fisik", vip: 0.44, signifikan: false },
];

interface VIPPLSChartProps {
  data?: {
    AKSESIBILITAS: number;
    IP: number;
    Fa: number;
    Rasio: number;
    Fisik: number;
  };
}

export default function VIPPLSChart({ data: _data }: VIPPLSChartProps) {
  const [plsData, setPlsData] = useState<PLSResponse | null>(null);

  useEffect(() => {
    fetch("/api/pls/bobot")
      .then((r) => r.json())
      .then((d) => setPlsData(d))
      .catch(() => {});
  }, []);

  const vipScores = plsData?.vip_scores || FALLBACK_VIP;
  const modelInfo = plsData?.model_info;

  const chartData = vipScores.map((item) => ({
    name: item.kode,
    fullName: item.variabel,
    vip: item.vip,
    signifikan: item.signifikan,
    konstruk: item.konstruk,
  }));

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-slate-800 text-sm">
            VIP Scores — Variable Importance in Projection (PLS)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Variabel dengan VIP &gt; 1.0 berpengaruh signifikan terhadap Rasio Harga/NJOP
          </p>
        </div>
        {modelInfo && (
          <div className="text-right text-[10px] text-slate-400 leading-relaxed">
            <div>R² = {modelInfo.r_squared.toFixed(4)}</div>
            <div>RMSE = {modelInfo.rmse.toFixed(4)}</div>
            <div>{modelInfo.n_components} komponen, {modelInfo.cross_validation}</div>
          </div>
        )}
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 2]}
              tick={{ fill: "#64748b", fontSize: 10 }}
              tickCount={5}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: "#475569", fontSize: 10 }}
              width={100}
            />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any, _name: any, props: any) => [
                `VIP = ${Number(value).toFixed(4)} ${props.payload.signifikan ? "(Signifikan)" : "(Tidak Signifikan)"}`,
                props.payload.fullName,
              ]}
              labelFormatter={(label) => `Variabel: ${label}`}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                fontSize: 11,
              }}
            />
            <ReferenceLine
              x={1.0}
              stroke="#ef4444"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: "VIP = 1.0",
                position: "top",
                fill: "#ef4444",
                fontSize: 10,
              }}
            />
            <Bar dataKey="vip" radius={[0, 4, 4, 0]} barSize={16}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.signifikan ? "#6366f1" : "#cbd5e1"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Konstruk Summary */}
      {plsData?.konstruk_summary && (
        <div className="mt-4 pt-3 border-t border-slate-100">
          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-2">
            Ringkasan per Konstruk Laten
          </p>
          <div className="grid grid-cols-2 gap-2">
            {plsData.konstruk_summary.map((k) => (
              <div
                key={k.konstruk}
                className={`px-2.5 py-1.5 rounded-md text-[10px] ${
                  k.signifikan
                    ? "bg-indigo-50 text-indigo-700"
                    : "bg-slate-50 text-slate-500"
                }`}
              >
                <span className="font-medium">{k.konstruk}</span>
                <span className="ml-1">({k.hipotesis})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
