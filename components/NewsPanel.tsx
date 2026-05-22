"use client";

import { useState, useMemo, useCallback } from "react";
import { NewsArticle } from "@/app/page";
import { Calendar, MapPin, Search, ExternalLink, ChevronLeft, ChevronRight, Newspaper, X, ChevronDown, ChevronUp, Loader2, Star, AlertTriangle, Globe } from "lucide-react";

interface ArticleContent {
  title: string;
  description: string;
  image: string;
  content: string;
  finalUrl: string;
  error?: string;
}

interface Props {
  floodNews: NewsArticle[];
  crimeNews: NewsArticle[];
  selectedKec: string | null;
}

export default function NewsPanel({ floodNews, crimeNews, selectedKec }: Props) {
  const [newsType, setNewsType] = useState<"banjir" | "kejahatan">("banjir");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [articleCache, setArticleCache] = useState<Record<string, ArticleContent>>({});
  const [loadingUrl, setLoadingUrl] = useState<string | null>(null);
  const [filterRelevance, setFilterRelevance] = useState(false);
  const PER_PAGE = 20;

  const activeNews = newsType === "banjir" ? floodNews : crimeNews;

  const filtered = useMemo(() => {
    let data = [...activeNews];
    if (selectedKec) {
      data = data.filter(
        (n) =>
          n.Kecamatan_Terkait &&
          n.Kecamatan_Terkait.toLowerCase().includes(selectedKec.toLowerCase())
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (n) =>
          n.Judul.toLowerCase().includes(q) ||
          (n.Kecamatan_Terkait && n.Kecamatan_Terkait.toLowerCase().includes(q)) ||
          (n.Sumber && n.Sumber.toLowerCase().includes(q))
      );
    }
    if (filterRelevance) {
      data = data.filter((n) => (n.Relevansi ?? 0) >= 0.5);
    }
    return data;
  }, [activeNews, selectedKec, search, filterRelevance]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const kecCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const n of activeNews) {
      if (n.Kecamatan_Terkait) {
        const k = n.Kecamatan_Terkait;
        m.set(k, (m.get(k) || 0) + 1);
      }
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [activeNews]);

  const fetchArticleContent = useCallback(async (url: string) => {
    if (articleCache[url]) return;
    setLoadingUrl(url);
    try {
      const resp = await fetch(`/api/article-content?url=${encodeURIComponent(url)}`);
      const data = await resp.json();
      if (data.error) {
        setArticleCache((prev) => ({ ...prev, [url]: { ...data, content: "", finalUrl: url, title: "", description: "", image: "" } }));
      } else {
        setArticleCache((prev) => ({ ...prev, [url]: data }));
      }
    } catch {
      setArticleCache((prev) => ({
        ...prev,
        [url]: { title: "", description: "", image: "", content: "", finalUrl: url, error: "Gagal memuat artikel" },
      }));
    } finally {
      setLoadingUrl(null);
    }
  }, [articleCache]);

  const handleToggleExpand = useCallback((globalIdx: number, link: string) => {
    if (expandedIdx === globalIdx) {
      setExpandedIdx(null);
    } else {
      setExpandedIdx(globalIdx);
      fetchArticleContent(link);
    }
  }, [expandedIdx, fetchArticleContent]);

  const relevanceLabel = (score: number) => {
    if (score >= 0.8) return { text: "Sangat Relevan", color: "bg-green-100 text-green-700 border-green-200" };
    if (score >= 0.5) return { text: "Relevan", color: "bg-blue-100 text-blue-700 border-blue-200" };
    if (score >= 0.3) return { text: "Cukup Relevan", color: "bg-yellow-100 text-yellow-700 border-yellow-200" };
    return { text: "Kurang Relevan", color: "bg-slate-100 text-slate-500 border-slate-200" };
  };

  return (
    <div className="space-y-4">
      {/* Tabs / Toggle */}
      <div className="flex bg-slate-100 p-1 rounded-xl w-fit mb-2">
        <button
          onClick={() => { setNewsType("banjir"); setPage(1); }}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            newsType === "banjir"
              ? "bg-white text-indigo-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Berita Banjir
        </button>
        <button
          onClick={() => { setNewsType("kejahatan"); setPage(1); }}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            newsType === "kejahatan"
              ? "bg-white text-indigo-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Berita Kejahatan
        </button>
      </div>

      {/* Stats bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-wrap gap-6 items-center">
        <div>
          <div className="text-3xl font-bold text-indigo-600 tabular-nums">{activeNews.length}</div>
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium mt-0.5">Total Berita</div>
        </div>
        <div className="h-10 w-px bg-slate-200" />
        <div>
          <div className="text-3xl font-bold text-indigo-600 tabular-nums">
            {new Set(activeNews.map((n) => n.Kecamatan_Terkait).filter(Boolean)).size}
          </div>
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium mt-0.5">Kecamatan Terkait</div>
        </div>
        <div className="h-10 w-px bg-slate-200" />
        <div className="flex-1">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium mb-1.5">Top Kecamatan</div>
          <div className="flex flex-wrap gap-1.5">
            {kecCounts.slice(0, 5).map(([kec, cnt]) => (
              <span
                key={kec}
                className="inline-flex items-center bg-indigo-50 text-indigo-700 text-xs font-medium px-2 py-0.5 rounded-md border border-indigo-100"
              >
                {kec} <span className="ml-1 text-indigo-400">{cnt}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Search & filter */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari judul berita atau kecamatan..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
          />
        </div>
        {selectedKec && (
          <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-sm font-medium px-3 py-1.5 rounded-lg border border-indigo-100">
            <MapPin size={12} />
            {selectedKec}
            <button className="ml-1 text-indigo-400 hover:text-indigo-600 transition-colors">
              <X size={14} />
            </button>
          </div>
        )}
        <button
          onClick={() => { setFilterRelevance(!filterRelevance); setPage(1); }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
            filterRelevance
              ? "bg-amber-50 text-amber-700 border-amber-200"
              : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Star size={12} />
          {filterRelevance ? "Relevan saja" : "Filter relevansi"}
        </button>
        <div className="text-xs text-slate-400">
          {filtered.length} berita ditemukan
        </div>
      </div>

      {/* Article list */}
      <div className="space-y-2">
        {paged.map((article, i) => {
          const globalIdx = (page - 1) * PER_PAGE + i;
          const isExpanded = expandedIdx === globalIdx;
          const cached = articleCache[article.Link];
          const isLoading = loadingUrl === article.Link;
          const rel = article.Relevansi != null ? relevanceLabel(article.Relevansi) : null;

          return (
            <div
              key={i}
              className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition-all ${
                isExpanded ? "border-indigo-300 shadow-md" : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="p-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center text-xs font-semibold tabular-nums">
                    {globalIdx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <a
                      href={article.Link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-slate-800 hover:text-indigo-600 line-clamp-2 block transition-colors"
                    >
                      {article.Judul}
                    </a>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {article.Tanggal && (
                        <span className="text-xs text-slate-400 inline-flex items-center gap-1">
                          <Calendar size={12} strokeWidth={2} />
                          {article.Tanggal}
                        </span>
                      )}
                      {article.Sumber && (
                        <span className="text-xs text-slate-400 inline-flex items-center gap-1">
                          <Globe size={11} strokeWidth={2} />
                          {article.Sumber}
                        </span>
                      )}
                      {article.Kecamatan_Terkait && (
                        <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-100 inline-flex items-center gap-1 font-medium">
                          <MapPin size={11} strokeWidth={2} />
                          {article.Kecamatan_Terkait}
                        </span>
                      )}
                      {rel && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-md border inline-flex items-center gap-1 font-medium ${rel.color}`}>
                          <Star size={10} />
                          {rel.text}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2.5">
                      <button
                        onClick={() => handleToggleExpand(globalIdx, article.Link)}
                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors ${
                          isExpanded
                            ? "bg-indigo-50 text-indigo-600 border-indigo-200"
                            : "text-slate-500 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {isLoading ? (
                          <><Loader2 size={11} className="animate-spin" /> Memuat...</>
                        ) : isExpanded ? (
                          <><ChevronUp size={11} /> Tutup Isi</>
                        ) : (
                          <><ChevronDown size={11} /> Lihat Isi Berita</>
                        )}
                      </button>
                      {article.Link && (
                        <a
                          href={article.Link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors"
                        >
                          Buka Asli <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded article content */}
              {isExpanded && (
                <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/50 rounded-b-xl">
                  {isLoading && !cached && (
                    <div className="flex items-center gap-2 text-sm text-slate-400 py-4 justify-center">
                      <Loader2 size={16} className="animate-spin" />
                      Mengambil isi artikel...
                    </div>
                  )}
                  {cached?.error && (
                    <div className="flex items-center gap-2 text-sm text-amber-600 py-2">
                      <AlertTriangle size={14} />
                      {cached.error}
                    </div>
                  )}
                  {cached && !cached.error && (
                    <div className="space-y-3">
                      {cached.image && (
                        <img
                          src={cached.image}
                          alt=""
                          className="w-full max-h-48 object-cover rounded-lg border border-slate-200"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      )}
                      {cached.description && cached.description !== cached.content?.slice(0, cached.description.length) && (
                        <p className="text-xs text-slate-500 italic leading-relaxed">{cached.description}</p>
                      )}
                      {cached.content ? (
                        <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line max-h-80 overflow-y-auto pr-2">
                          {cached.content}
                        </div>
                      ) : (
                        !cached.error && (
                          <p className="text-sm text-slate-400 italic">Tidak dapat mengekstrak isi artikel. Coba buka link aslinya.</p>
                        )
                      )}
                      {cached.finalUrl && cached.finalUrl !== article.Link && (
                        <a
                          href={cached.finalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors"
                        >
                          Buka artikel asli <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 py-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <span className="text-sm text-slate-500 tabular-nums px-2">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-colors"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
