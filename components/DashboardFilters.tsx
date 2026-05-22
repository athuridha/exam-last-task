"use client";

import { ChevronDown, Filter } from "lucide-react";

interface DashboardFiltersProps {
  kotaList: string[];
  kecamatanList: string[];
  selectedKota: string;
  selectedKecamatan: string;
  selectedSegmen: string;
  onKotaChange: (kota: string) => void;
  onKecamatanChange: (kecamatan: string) => void;
  onSegmenChange: (segmen: string) => void;
  onApply: () => void;
}

const SEGMEN_OPTIONS = ["Semua Segmen", "Rendah", "Menengah", "Tinggi", "Premium"];

export default function DashboardFilters({
  kotaList,
  kecamatanList,
  selectedKota,
  selectedKecamatan,
  selectedSegmen,
  onKotaChange,
  onKecamatanChange,
  onSegmenChange,
  onApply,
}: DashboardFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 bg-slate-800 rounded-lg px-4 py-3">
      <div className="flex items-center gap-2 text-slate-300 text-sm">
        <Filter size={14} />
        <span>Filter:</span>
      </div>
      
      {/* Kota Filter */}
      <div className="relative">
        <select
          value={selectedKota}
          onChange={(e) => onKotaChange(e.target.value)}
          className="appearance-none bg-slate-700 text-white text-sm rounded-md px-3 py-2 pr-8 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer min-w-[140px]"
        >
          <option value="">Semua Kota</option>
          {kotaList.map((kota) => (
            <option key={kota} value={kota}>
              {kota}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
      </div>

      {/* Kecamatan Filter */}
      <div className="relative">
        <select
          value={selectedKecamatan}
          onChange={(e) => onKecamatanChange(e.target.value)}
          className="appearance-none bg-slate-700 text-white text-sm rounded-md px-3 py-2 pr-8 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer min-w-[160px]"
        >
          <option value="">Semua Kecamatan</option>
          {kecamatanList.map((kec) => (
            <option key={kec} value={kec}>
              {kec}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
      </div>

      {/* Segmen Filter */}
      <div className="relative">
        <select
          value={selectedSegmen}
          onChange={(e) => onSegmenChange(e.target.value)}
          className="appearance-none bg-slate-700 text-white text-sm rounded-md px-3 py-2 pr-8 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer min-w-[140px]"
        >
          {SEGMEN_OPTIONS.map((seg) => (
            <option key={seg} value={seg === "Semua Segmen" ? "" : seg}>
              {seg}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
      </div>

      {/* Apply Button */}
      <button
        onClick={onApply}
        className="ml-auto bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
      >
        Terapkan
      </button>
    </div>
  );
}
