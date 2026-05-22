"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Search, Filter } from "lucide-react";

interface PropertyItem {
  kecamatan: string;
  kota: string;
  harga: number;
  luasTanah: number;
  luasBangunan: number;
  rasioHNJOP: number;
  segmen: string;
}

interface PropertyTableProps {
  data: PropertyItem[];
  onFilter?: (kecamatan: string, kota: string, segmen: string) => void;
}

const SEGMEN_COLORS: Record<string, string> = {
  Rendah: "bg-blue-100 text-blue-700",
  Menengah: "bg-amber-100 text-amber-700",
  Tinggi: "bg-red-100 text-red-700",
  Premium: "bg-indigo-900 text-white",
};

const fmt = (n: number) =>
  n >= 1e9
    ? `Rp ${(n / 1e9).toFixed(3).replace(".", ",").replace(/,?0+$/, "")} M`
    : n >= 1e6
    ? `Rp ${(n / 1e6).toFixed(0)} jt`
    : `Rp ${n.toLocaleString("id-ID")}`;

export default function PropertyTable({ data }: PropertyTableProps) {
  const [sortField, setSortField] = useState<keyof PropertyItem>("rasioHNJOP");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filter by search term
  const filtered = data.filter(
    (item) =>
      item.kecamatan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.kota.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    }
    return sortDir === "asc"
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  // Paginate
  const totalPages = Math.ceil(sorted.length / pageSize);
  const paginated = sorted.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSort = (field: keyof PropertyItem) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
    setCurrentPage(1);
  };

  const renderSortIcon = (field: keyof PropertyItem) => {
    if (sortField !== field) return null;
    return sortDir === "asc" ? (
      <ChevronUp size={14} className="inline ml-1" />
    ) : (
      <ChevronDown size={14} className="inline ml-1" />
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">
              Daftar Properti — dapat difilter dan di-drill down
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Analitik Berbasis Rasio Harga Pasar terhadap NJOP 2025
            </p>
          </div>
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Cari kecamatan/kota..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <th
                className="px-5 py-3 text-left cursor-pointer hover:bg-slate-100"
                onClick={() => handleSort("kecamatan")}
              >
                Kecamatan {renderSortIcon("kecamatan")}
              </th>
              <th
                className="px-5 py-3 text-left cursor-pointer hover:bg-slate-100"
                onClick={() => handleSort("kota")}
              >
                Kota {renderSortIcon("kota")}
              </th>
              <th
                className="px-5 py-3 text-right cursor-pointer hover:bg-slate-100"
                onClick={() => handleSort("harga")}
              >
                Harga {renderSortIcon("harga")}
              </th>
              <th
                className="px-5 py-3 text-center cursor-pointer hover:bg-slate-100"
                onClick={() => handleSort("luasTanah")}
              >
                LT / LB {renderSortIcon("luasTanah")}
              </th>
              <th
                className="px-5 py-3 text-right cursor-pointer hover:bg-slate-100"
                onClick={() => handleSort("rasioHNJOP")}
              >
                Rasio H/NJOP {renderSortIcon("rasioHNJOP")}
              </th>
              <th className="px-5 py-3 text-center">Segmen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginated.map((item, idx) => (
              <tr
                key={idx}
                className="hover:bg-slate-50 transition-colors"
              >
                <td className="px-5 py-3 font-medium text-slate-800">
                  {item.kecamatan}
                </td>
                <td className="px-5 py-3 text-slate-600">{item.kota}</td>
                <td className="px-5 py-3 text-right text-slate-800 font-medium">
                  {fmt(item.harga)}
                </td>
                <td className="px-5 py-3 text-center text-slate-600">
                  {item.luasTanah.toFixed(0)} / {item.luasBangunan.toFixed(0)} m²
                </td>
                <td className="px-5 py-3 text-right font-semibold text-slate-800">
                  {item.rasioHNJOP.toFixed(2)}×
                </td>
                <td className="px-5 py-3 text-center">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                      SEGMEN_COLORS[item.segmen] || "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {item.segmen}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-5 py-3 border-t border-slate-200 flex items-center justify-between text-sm">
          <span className="text-slate-500">
            Menampilkan {(currentPage - 1) * pageSize + 1}-
            {Math.min(currentPage * pageSize, filtered.length)} dari{" "}
            {filtered.length} properti
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sebelumnya
            </button>
            <span className="px-3 text-slate-600">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Berikutnya
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
