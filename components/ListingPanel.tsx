"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Home,
  BedDouble,
  Bath,
  Ruler,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  ArrowUpDown,
  MapPin,
  Building2,
  Loader2,
} from "lucide-react";

export interface ListingItem {
  id: number;
  judul: string;
  harga: number;
  kamarTidur: number;
  kamarMandi: number;
  luasBangunan: number;
  luasTanah: number;
  area: string;
  kota: string;
  kecamatan: string;
  lokasi: string | null;
  urlProperti: string;
  gambar: string | null;
}

interface Props {
  kecamatan: string;
  kota: string;
  onClose: () => void;
}

type SortField = "harga" | "luasBangunan" | "luasTanah" | "kamarTidur";

const fmt = (n: number) =>
  n >= 1e9
    ? `Rp ${(n / 1e9).toFixed(2)} M`
    : n >= 1e6
    ? `Rp ${(n / 1e6).toFixed(0)} jt`
    : `Rp ${n.toLocaleString("id-ID")}`;

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: "harga", label: "Harga" },
  { value: "luasBangunan", label: "Luas Bangunan" },
  { value: "luasTanah", label: "Luas Tanah" },
  { value: "kamarTidur", label: "Kamar Tidur" },
];

export default function ListingPanel({ kecamatan, kota, onClose }: Props) {
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortField>("harga");
  const [order, setOrder] = useState<"asc" | "desc">("asc");

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        kecamatan,
        page: String(page),
        limit: "12",
        sort,
        order,
      });
      const res = await fetch(`/api/listings?${params}`);
      if (res.ok) {
        const json = await res.json();
        setListings(json.data);
        setTotal(json.total);
        setTotalPages(json.totalPages);
      }
    } catch {
      // silently fail
    }
    setLoading(false);
  }, [kecamatan, page, sort, order]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Reset page when sort changes
  useEffect(() => {
    setPage(1);
  }, [sort, order]);

  const toggleOrder = () => setOrder((o) => (o === "asc" ? "desc" : "asc"));

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm">
              <Building2 size={20} color="white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Listing di {kecamatan}
              </h2>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <MapPin size={10} />
                {kota} &middot;{" "}
                <span className="font-medium text-indigo-600">
                  {total.toLocaleString("id-ID")} properti
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors"
          >
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        {/* Sort bar */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-slate-100 bg-slate-50/50">
          <span className="text-xs text-slate-400 font-medium">Urutkan:</span>
          <div className="flex gap-1">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() =>
                  sort === opt.value ? toggleOrder() : setSort(opt.value)
                }
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                  sort === opt.value
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-500 hover:bg-white hover:text-slate-700 border border-transparent hover:border-slate-200"
                }`}
              >
                {opt.label}
                {sort === opt.value && (
                  <ArrowUpDown size={10} className="opacity-70" />
                )}
              </button>
            ))}
          </div>
          <span className="text-[10px] text-slate-400 ml-auto">
            {order === "asc" ? "Terendah → Tertinggi" : "Tertinggi → Terendah"}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={32} className="text-indigo-400 animate-spin" />
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <Home size={40} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm">Tidak ada listing ditemukan</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map((item) => (
                <a
                  key={item.id}
                  href={item.urlProperti}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-indigo-200 transition-all duration-200"
                >
                  {/* Image */}
                  <div className="relative h-40 bg-slate-100 overflow-hidden">
                    {item.gambar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.gambar}
                        alt={item.judul}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Home size={32} className="text-slate-300" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-lg px-2.5 py-1 shadow-sm">
                      <span className="text-xs font-bold text-indigo-700">
                        {fmt(item.harga)}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3.5">
                    <h3 className="text-sm font-medium text-slate-800 line-clamp-2 leading-snug group-hover:text-indigo-700 transition-colors">
                      {item.judul}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                      <MapPin size={9} />
                      {item.lokasi || `${item.area}, ${item.kota}`}
                    </p>
                    <div className="flex items-center gap-3 mt-3 text-slate-500">
                      <span className="flex items-center gap-1 text-xs">
                        <BedDouble size={12} className="text-indigo-400" />
                        {item.kamarTidur}
                      </span>
                      <span className="flex items-center gap-1 text-xs">
                        <Bath size={12} className="text-indigo-400" />
                        {item.kamarMandi}
                      </span>
                      <span className="flex items-center gap-1 text-xs">
                        <Ruler size={12} className="text-indigo-400" />
                        {item.luasBangunan}m²
                      </span>
                      <span className="flex items-center gap-1 text-xs ml-auto text-slate-400">
                        <ExternalLink size={10} />
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50/50">
            <span className="text-xs text-slate-400">
              Halaman {page} dari {totalPages}
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 hover:bg-white disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={14} className="text-slate-500" />
              </button>
              {/* Page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p: number;
                if (totalPages <= 5) {
                  p = i + 1;
                } else if (page <= 3) {
                  p = i + 1;
                } else if (page >= totalPages - 2) {
                  p = totalPages - 4 + i;
                } else {
                  p = page - 2 + i;
                }
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                      page === p
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-500 hover:bg-white border border-slate-200"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 hover:bg-white disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={14} className="text-slate-500" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
