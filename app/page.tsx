"use client";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import FloodRiskPanel from "@/components/FloodRiskPanel";
import NewsPanel from "@/components/NewsPanel";
import ListingPanel from "@/components/ListingPanel";
import DashboardFilters from "@/components/DashboardFilters";
import DashboardStatsCards from "@/components/DashboardStatsCards";
import SegmenDonutChart from "@/components/SegmenDonutChart";
import RasioPerKotaChart from "@/components/RasioPerKotaChart";
import Top5KecamatanChart from "@/components/Top5KecamatanChart";
import VIPPLSChart from "@/components/VIPPLSChart";
import PropertyTable from "@/components/PropertyTable";
import CrimeRiskPanel, { CrimeRisk, CrimeNews } from "@/components/CrimeRiskPanel";
import { Map as MapIcon, Droplets, Newspaper, Activity, RefreshCw, BarChart3, Siren } from "lucide-react";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

export interface KecamatanStat {
  Kecamatan: string;
  Kota: string;
  Harga_Median: number;
  Harga_Mean: number;
  Jumlah: number;
  Skor_Fasilitas: number;
  Mall: number;
  RS: number;
  Pendidikan: number;
  Jarak_Tol: number;
  Jarak_Stasiun: number;
  Lat: number;
  Lng: number;
  Risiko_Banjir: number;
  Segmen_Dominan: string;
}

export interface FloodRisk {
  Kecamatan: string;
  Kota: string;
  Sebutan_Langsung: number;
  Risiko_Banjir: number;
  Kategori_Risiko: string;
}

export interface NewsArticle {
  Judul: string;
  Link: string;
  Tanggal: string;
  Kecamatan_Terkait: string;
  Sumber?: string;
  Relevansi?: number;
}

export interface Facility {
  Nama: string;
  Jenis: string;
  Lat: number;
  Lng: number;
  Kota: string;
}

export interface Station {
  Nama: string;
  Jenis: string;
  Line: string;
  Lat: number;
  Lng: number;
}

export interface TollGate {
  Nama: string;
  Ruas_Tol: string;
  Lat: number;
  Lng: number;
}

export interface Summary {
  total_listings: number;
  total_kecamatan: number;
  total_kota: number;
  harga_median: number;
  harga_min: number;
  harga_max: number;
  segmen_dist: Record<string, number>;
  kota_list: string[];
}

export interface DashboardStats {
  total_listings: number;
  total_kota: number;
  total_kecamatan: number;
  avg_rasio_hnjop: number;
  median_harga: number;
  segmen_dominan: string;
  segmen_dist: Record<string, number>;
  rasio_per_kota: Array<{ kota: string; avgRasio: number }>;
  top5_kecamatan: Array<{ kecamatan: string; kota: string; avgRasio: number }>;
  vip_pls: {
    AKSESIBILITAS: number;
    IP: number;
    Fa: number;
    Rasio: number;
    Fisik: number;
  };
  property_list: Array<{
    kecamatan: string;
    kota: string;
    harga: number;
    luasTanah: number;
    luasBangunan: number;
    rasioHNJOP: number;
    segmen: string;
  }>;
  kota_list: string[];
  kecamatan_list: string[];
}

export default function Home() {
  const [kecStats, setKecStats] = useState<KecamatanStat[]>([]);
  const [floodRisk, setFloodRisk] = useState<FloodRisk[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [tollGates, setTollGates] = useState<TollGate[]>([]);
  const [geojson, setGeojson] = useState<GeoJSON.FeatureCollection | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [selectedKec, setSelectedKec] = useState<string | null>(null);
  const [listingKec, setListingKec] = useState<{ kecamatan: string; kota: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"map" | "analytics" | "flood" | "crime" | "news">("map");
  const [liveStatus, setLiveStatus] = useState<"loading" | "live" | "fallback">("loading");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Dashboard stats
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);

  // Dashboard filters
  const [filterKota, setFilterKota] = useState("");
  const [filterKecamatan, setFilterKecamatan] = useState("");
  const [filterSegmen, setFilterSegmen] = useState("");

  // Crime data
  const [crimeRisk, setCrimeRisk] = useState<CrimeRisk[]>([]);
  const [crimeNews, setCrimeNews] = useState<CrimeNews[]>([]);

  // Filtered dashboard stats (reactive to filter changes)
  const filteredStats = useMemo(() => {
    if (!dashboardStats) return null;

    let list = dashboardStats.property_list;
    if (filterKota) list = list.filter((p) => p.kota === filterKota);
    if (filterKecamatan) list = list.filter((p) => p.kecamatan === filterKecamatan);
    if (filterSegmen) list = list.filter((p) => p.segmen === filterSegmen);

    const totalListings = list.length;
    const avgRasio = totalListings > 0
      ? list.reduce((sum, p) => sum + p.rasioHNJOP, 0) / totalListings : 0;
    const sortedPrices = list.map((p) => p.harga).sort((a, b) => a - b);
    const mid = Math.floor(sortedPrices.length / 2);
    const medianHarga = sortedPrices.length % 2 === 0
      ? ((sortedPrices[mid - 1] || 0) + (sortedPrices[mid] || 0)) / 2
      : sortedPrices[mid] || 0;

    const segmenDist: Record<string, number> = { Rendah: 0, Menengah: 0, Tinggi: 0, Premium: 0 };
    for (const p of list) { if (segmenDist[p.segmen] !== undefined) segmenDist[p.segmen]++; }
    let segmenDominan = "Menengah";
    let maxCount = 0;
    for (const [seg, count] of Object.entries(segmenDist)) {
      if (count > maxCount) { maxCount = count; segmenDominan = seg; }
    }

    const kotaAgg: Record<string, { sum: number; count: number }> = {};
    for (const p of list) {
      if (!kotaAgg[p.kota]) kotaAgg[p.kota] = { sum: 0, count: 0 };
      kotaAgg[p.kota].sum += p.rasioHNJOP; kotaAgg[p.kota].count++;
    }
    const rasioPerKota = Object.entries(kotaAgg)
      .map(([kota, d]) => ({ kota, avgRasio: d.sum / d.count }))
      .sort((a, b) => b.avgRasio - a.avgRasio);

    const kecAgg: Record<string, { sum: number; count: number; kota: string }> = {};
    for (const p of list) {
      if (!kecAgg[p.kecamatan]) kecAgg[p.kecamatan] = { sum: 0, count: 0, kota: p.kota };
      kecAgg[p.kecamatan].sum += p.rasioHNJOP; kecAgg[p.kecamatan].count++;
    }
    const top5Kecamatan = Object.entries(kecAgg)
      .map(([kecamatan, d]) => ({ kecamatan, kota: d.kota, avgRasio: d.sum / d.count }))
      .sort((a, b) => b.avgRasio - a.avgRasio).slice(0, 5);

    return {
      ...dashboardStats, total_listings: totalListings,
      total_kota: new Set(list.map((p) => p.kota)).size,
      total_kecamatan: new Set(list.map((p) => `${p.kecamatan}-${p.kota}`)).size,
      avg_rasio_hnjop: avgRasio, median_harga: medianHarga,
      segmen_dominan: segmenDominan, segmen_dist: segmenDist,
      rasio_per_kota: rasioPerKota, top5_kecamatan: top5Kecamatan, property_list: list,
    };
  }, [dashboardStats, filterKota, filterKecamatan, filterSegmen]);

  // Load data
  useEffect(() => {
    const load = async () => {
      const [kS, fa, st, tg, gj, sm, ds] = await Promise.all([
        fetch("/api/kecamatan").then((r) => r.json()),
        fetch("/api/fasilitas").then((r) => r.json()),
        fetch("/api/stasiun").then((r) => r.json()),
        fetch("/api/gerbang-tol").then((r) => r.json()),
        fetch("/data/kecamatan_boundaries.geojson").then((r) => r.json()),
        fetch("/api/summary").then((r) => r.json()),
        fetch("/api/dashboard-stats").then((r) => r.json()),
      ]);
      setKecStats(kS); setFacilities(fa); setStations(st); setTollGates(tg);
      setGeojson(gj); setSummary(sm); setDashboardStats(ds);

      const [staticFR, staticNW] = await Promise.all([
        fetch("/data/risiko_banjir.json").then((r) => r.json()),
        fetch("/data/berita_banjir.json").then((r) => r.json()),
      ]);
      setFloodRisk(staticFR); setNews(staticNW);
      fetchLiveData();
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchLiveData = async () => {
    setLiveStatus("loading");
    try {
      const [floodRes, newsRes, crimeRes] = await Promise.all([
        fetch("/api/scrape-flood"), fetch("/api/scrape-news"), fetch("/api/scrape-crime"),
      ]);
      if (floodRes.ok && newsRes.ok) {
        const floodJson = await floodRes.json();
        const newsJson = await newsRes.json();
        setFloodRisk(floodJson.data); setNews(newsJson.data);
        setLiveStatus(floodJson.source === "live" ? "live" : "fallback");
        if (floodJson.lastUpdated) setLastUpdated(new Date(floodJson.lastUpdated).toLocaleString("id-ID"));
      } else { setLiveStatus("fallback"); }
      if (crimeRes.ok) {
        const crimeJson = await crimeRes.json();
        setCrimeRisk(crimeJson.data || []); setCrimeNews(crimeJson.news || []);
      }
    } catch { setLiveStatus("fallback"); }
    setIsRefreshing(false);
  };

  const handleRefresh = () => { setIsRefreshing(true); fetchLiveData(); };

  if (!summary || !geojson || !dashboardStats) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-100">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-5">
            <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
            <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
          </div>
          <p className="text-slate-500 font-medium text-sm tracking-wide">Memuat data visualisasi...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-slate-800 text-white sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-sm">
              <Activity size={18} color="white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight leading-tight">
                Visualisasi Analitik Segmentasi Harga Properti Jabodetabek
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Rasio Harga Pasar terhadap NJOP 2025 · {dashboardStats.total_listings.toLocaleString("id-ID")} Listing · {dashboardStats.total_kecamatan} Kecamatan
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4 text-xs text-slate-300">
            {lastUpdated && <span className="text-slate-400">Diperbarui: {lastUpdated}</span>}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-600 hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={12} className={isRefreshing ? "animate-spin" : ""} />
              Refresh
            </button>
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${
                liveStatus === "live" ? "bg-emerald-400 animate-pulse"
                : liveStatus === "loading" ? "bg-amber-400 animate-pulse" : "bg-slate-400"
              }`} />
              {liveStatus === "live" ? "Live" : liveStatus === "loading" ? "Memuat..." : "Statis"}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-6 py-4">
        {/* Tab Navigation — Map first */}
        <div className="flex items-center gap-1 mb-4 bg-white rounded-xl p-1.5 shadow-sm border border-slate-200 w-fit">
          {[
            { key: "map" as const, label: "Peta Interaktif", Icon: MapIcon },
            { key: "analytics" as const, label: "Analitik", Icon: BarChart3 },
            { key: "flood" as const, label: "Risiko Banjir", Icon: Droplets },
            { key: "crime" as const, label: "Risiko Kejahatan", Icon: Siren },
            { key: "news" as const, label: "Berita", Icon: Newspaper },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                activeTab === tab.key
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              <tab.Icon size={15} strokeWidth={2} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* === PETA INTERAKTIF (Default/Main View) === */}
        {activeTab === "map" && (
          <div className="space-y-4">
            {/* KPI Cards */}
            {filteredStats && <DashboardStatsCards stats={filteredStats} />}

            {/* Filters below KPI */}
            {dashboardStats && (
              <DashboardFilters
                kotaList={dashboardStats.kota_list}
                kecamatanList={dashboardStats.kecamatan_list}
                selectedKota={filterKota}
                selectedKecamatan={filterKecamatan}
                selectedSegmen={filterSegmen}
                onKotaChange={setFilterKota}
                onKecamatanChange={setFilterKecamatan}
                onSegmenChange={setFilterSegmen}
                onApply={() => {}}
              />
            )}

            {/* Map — Full width, prominent */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200">
              <div style={{ height: "600px" }}>
                <MapView
                  geojson={geojson}
                  kecStats={kecStats}
                  floodRisk={floodRisk}
                  crimeRisk={crimeRisk}
                  facilities={facilities}
                  stations={stations}
                  tollGates={tollGates}
                  selectedKec={selectedKec}
                  onSelectKec={setSelectedKec}
                  onViewListings={(kec, kota) => setListingKec({ kecamatan: kec, kota })}
                />
              </div>
            </div>

            {/* Quick charts: Segmen + Rasio per Kota */}
            {filteredStats && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <SegmenDonutChart segmenDist={filteredStats.segmen_dist} />
                <RasioPerKotaChart data={filteredStats.rasio_per_kota} />
              </div>
            )}

            {/* Property Table */}
            {filteredStats && <PropertyTable data={filteredStats.property_list} />}
          </div>
        )}

        {/* === ANALITIK (Charts + Table + PLS) === */}
        {activeTab === "analytics" && (
          <div className="space-y-4">
            {/* Filters */}
            {dashboardStats && (
              <DashboardFilters
                kotaList={dashboardStats.kota_list}
                kecamatanList={dashboardStats.kecamatan_list}
                selectedKota={filterKota}
                selectedKecamatan={filterKecamatan}
                selectedSegmen={filterSegmen}
                onKotaChange={setFilterKota}
                onKecamatanChange={setFilterKecamatan}
                onSegmenChange={setFilterSegmen}
                onApply={() => {}}
              />
            )}

            {/* KPI */}
            {filteredStats && <DashboardStatsCards stats={filteredStats} />}

            {/* Charts */}
            {filteredStats && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <SegmenDonutChart segmenDist={filteredStats.segmen_dist} />
                <RasioPerKotaChart data={filteredStats.rasio_per_kota} />
              </div>
            )}
            {filteredStats && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Top5KecamatanChart data={filteredStats.top5_kecamatan} />
                <VIPPLSChart data={filteredStats.vip_pls} />
              </div>
            )}

            {/* Property Table */}
            {filteredStats && <PropertyTable data={filteredStats.property_list} />}
          </div>
        )}

        {/* === RISIKO BANJIR === */}
        {activeTab === "flood" && (
          <FloodRiskPanel
            floodRisk={floodRisk}
            kecStats={kecStats}
            onSelectKec={setSelectedKec}
            onGoToMap={() => setActiveTab("map")}
          />
        )}

      </div>

        {/* === RISIKO KEJAHATAN === */}
        {activeTab === "crime" && (
          <CrimeRiskPanel
            crimeRisk={crimeRisk}
            crimeNews={crimeNews}
            kecStats={kecStats}
            onSelectKec={setSelectedKec}
            onGoToMap={() => setActiveTab("map")}
          />
        )}

        {/* === BERITA === */}
        {activeTab === "news" && (
          <NewsPanel floodNews={news} crimeNews={crimeNews} selectedKec={selectedKec} />
        )}

      {/* Listing Panel Modal */}
      {listingKec && (
        <ListingPanel
          kecamatan={listingKec.kecamatan}
          kota={listingKec.kota}
          onClose={() => setListingKec(null)}
        />
      )}

      <footer className="text-center text-slate-400 text-xs py-8 mt-10 border-t border-slate-200">
        <span className="font-medium text-slate-500">Sumber Data: </span>
        rumah123.com · NJOP 2025 · GADM v4.1 · Google News RSS · {new Date().getFullYear()}
      </footer>
    </main>
  );
}
