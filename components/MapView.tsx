"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  KecamatanStat,
  FloodRisk,
  Facility,
  Station,
  TollGate,
} from "@/app/page";
import {
  Home, Droplets, ShoppingBag, Plus, GraduationCap,
  BookOpen, TrainFront, Route, Layers, ChevronDown, ChevronUp, MapPin, X, Siren,
} from "lucide-react";
import { CrimeRisk } from "@/components/CrimeRiskPanel";

// Fix Leaflet default icon
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
const DefaultIcon = L.icon({
  iconUrl: icon.src,
  shadowUrl: iconShadow.src,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface Props {
  geojson: GeoJSON.FeatureCollection;
  kecStats: KecamatanStat[];
  floodRisk: FloodRisk[];
  crimeRisk?: CrimeRisk[];
  facilities: Facility[];
  stations: Station[];
  tollGates: TollGate[];
  selectedKec: string | null;
  onSelectKec: (kec: string | null) => void;
  onViewListings?: (kecamatan: string, kota: string) => void;
}

const SEGMEN_COLORS: Record<string, string> = {
  Rendah: "#3b82f6",
  Menengah: "#f59e0b",
  Tinggi: "#ef4444",
  Premium: "#1e3a5f",
};

// SVG paths for map markers (24x24 viewBox, white strokes on colored bg)
const SVG_MARKER = {
  mall: `<rect x="5" y="8" width="14" height="12" rx="1"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/>`,
  hospital: `<path d="M12 5v14"/><path d="M5 12h14"/>`,
  graduation: `<polygon points="12,4 2,9 12,14 22,9"/><path d="M6 11v4c0 2 2.7 3 6 3s6-1 6-3v-4"/>`,
  book: `<path d="M2 4h7a3 3 0 0 1 3 3v13H4a2 2 0 0 1-2-2V4z"/><path d="M22 4h-7a3 3 0 0 0-3 3v13h8a2 2 0 0 0 2-2V4z"/>`,
  train: `<rect x="5" y="3" width="14" height="12" rx="3"/><circle cx="8.5" cy="18" r="1.5"/><circle cx="15.5" cy="18" r="1.5"/><path d="M5 10h14"/>`,
  toll: `<path d="M4 19l4-15h8l4 15"/><path d="M6.5 12h11"/>`,
};

const MARKER_COLORS = {
  mall: "#3b82f6",
  rs: "#ef4444",
  univ: "#7c3aed",
  school: "#f97316",
  train: "#0d9488",
  toll: "#64748b",
};

function hargaToColor(harga: number): string {
  const logMin = Math.log10(Math.max(1e8, 1e8));
  const logMax = Math.log10(2e10);
  const t = Math.max(0, Math.min(1, (Math.log10(Math.max(harga, 1e8)) - logMin) / (logMax - logMin)));

  // Green -> Yellow -> Orange -> Red -> Purple
  const colors = [
    [34, 197, 94],
    [234, 179, 8],
    [249, 115, 22],
    [239, 68, 68],
    [139, 92, 246],
  ];
  const idx = t * (colors.length - 1);
  const i = Math.min(Math.floor(idx), colors.length - 2);
  const f = idx - i;
  const r = Math.round(colors[i][0] + f * (colors[i + 1][0] - colors[i][0]));
  const g = Math.round(colors[i][1] + f * (colors[i + 1][1] - colors[i][1]));
  const b = Math.round(colors[i][2] + f * (colors[i + 1][2] - colors[i][2]));
  return `rgb(${r},${g},${b})`;
}

function floodColor(risk: number): string {
  if (risk >= 0.6) return "rgba(220, 38, 38, 0.6)";
  if (risk >= 0.3) return "rgba(249, 115, 22, 0.45)";
  if (risk > 0.05) return "rgba(234, 179, 8, 0.3)";
  return "rgba(34, 197, 94, 0.15)";
}

function crimeColor(risk: number): string {
  if (risk >= 0.6) return "rgba(127, 29, 29, 0.65)"; // Dark red
  if (risk >= 0.3) return "rgba(185, 28, 28, 0.5)"; // Red
  if (risk > 0.05) return "rgba(251, 146, 60, 0.35)"; // Orange
  return "rgba(134, 239, 172, 0.2)"; // Light green
}

function createMarkerIcon(bgColor: string, svgPaths: string, sw = 2.5): L.DivIcon {
  return L.divIcon({
    html: `<div style="width:28px;height:28px;background:${bgColor};border:2.5px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${svgPaths}</svg></div>`,
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

const fmt = (n: number) =>
  n >= 1e9 ? `Rp ${(n / 1e9).toFixed(2)} M` : `Rp ${(n / 1e6).toFixed(0)} jt`;

export default function MapView({
  geojson,
  kecStats,
  floodRisk,
  crimeRisk = [],
  facilities,
  stations,
  tollGates,
  selectedKec,
  onSelectKec,
  onViewListings,
}: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [layers, setLayers] = useState({
    choropleth: true,
    flood: false,
    crime: false,
    mall: false,
    rs: false,
    pendidikan: false,
    stasiun: false,
    tol: false,
  });
  const [layerOpen, setLayerOpen] = useState(true);
  const [filterKota, setFilterKota] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  // Get unique kota list from kecStats
  const kotaList = useMemo(() => {
    const set = new Set(kecStats.map((k) => k.Kota));
    return [...set].sort();
  }, [kecStats]);

  // Build lookup maps
  const kecLookup = useMemo(() => {
    const m = new Map<string, KecamatanStat>();
    for (const k of kecStats) m.set(`${k.Kecamatan}|${k.Kota}`, k);
    return m;
  }, [kecStats]);

  const floodLookup = useMemo(() => {
    const m = new Map<string, FloodRisk>();
    for (const f of floodRisk) m.set(`${f.Kecamatan}|${f.Kota}`, f);
    return m;
  }, [floodRisk]);

  const crimeLookup = useMemo(() => {
    const m = new Map<string, CrimeRisk>();
    for (const c of crimeRisk) m.set(`${c.Kecamatan}|${c.Kota}`, c);
    return m;
  }, [crimeRisk]);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [-6.3, 106.75],
      zoom: 10,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 18,
    }).addTo(map);

    mapRef.current = map;

    // Event delegation for listing buttons inside popups
    map.getContainer().addEventListener("click", (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest(".listing-btn") as HTMLElement | null;
      if (btn && onViewListings) {
        const kec = btn.getAttribute("data-kec");
        const kota = btn.getAttribute("data-kota");
        if (kec && kota) {
          onViewListings(kec, kota);
          map.closePopup();
        }
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Render GeoJSON layers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !geojson) return;

    // Remove all non-tile layers (GeoJSON + markers)
    map.eachLayer((layer) => {
      if (!(layer instanceof L.TileLayer)) {
        map.removeLayer(layer);
      }
    });

    // Filter geojson features by kota
    const filteredGeojson: GeoJSON.FeatureCollection = filterKota
      ? { ...geojson, features: geojson.features.filter((f) => f.properties?.Kota === filterKota) }
      : geojson;

    // Choropleth layer
    if (layers.choropleth) {
      L.geoJSON(filteredGeojson, {
        style: (feature) => {
          const props = feature?.properties;
          const key = `${props?.Kecamatan}|${props?.Kota}`;
          const stat = kecLookup.get(key);
          const isSelected = selectedKec === props?.Kecamatan;
          return {
            fillColor: stat ? hargaToColor(stat.Harga_Median) : "#e5e7eb",
            fillOpacity: stat ? 0.6 : 0.2,
            color: isSelected ? "#1d4ed8" : "#374151",
            weight: isSelected ? 3 : 1,
            opacity: 0.8,
          };
        },
        onEachFeature: (feature, layer) => {
          const props = feature.properties;
          const key = `${props.Kecamatan}|${props.Kota}`;
          const stat = kecLookup.get(key);
          const flood = floodLookup.get(key);

          if (stat) {
            const segColor = ({ Rendah: '#3b82f6', Menengah: '#f59e0b', Tinggi: '#ef4444', Premium: '#1e3a5f' } as Record<string,string>)[stat.Segmen_Dominan] || '#64748b';
            layer.bindPopup(`
              <div style="min-width:260px;font-family:Inter,system-ui,sans-serif;">
                <div style="padding:14px 16px 10px;border-bottom:1px solid #f1f5f9;">
                  <div style="font-size:15px;font-weight:700;color:#0f172a;letter-spacing:-0.01em;">${stat.Kecamatan}</div>
                  <div style="font-size:11px;color:#94a3b8;margin-top:2px;">${stat.Kota} &middot; ${stat.Jumlah} listing</div>
                </div>
                <div style="padding:10px 16px;">
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                    <div>
                      <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Median Harga</div>
                      <div style="font-size:18px;font-weight:700;color:#0f172a;">${fmt(stat.Harga_Median)}</div>
                    </div>
                    <div style="padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;color:white;background:${segColor};">${stat.Segmen_Dominan}</div>
                  </div>
                  <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
                    <div style="background:#f8fafc;border-radius:8px;padding:7px 10px;">
                      <div style="font-size:10px;color:#94a3b8;">Skor Fasilitas</div>
                      <div style="font-size:13px;font-weight:600;color:#334155;">${stat.Skor_Fasilitas.toFixed(1)}</div>
                    </div>
                    <div style="background:#f8fafc;border-radius:8px;padding:7px 10px;">
                      <div style="font-size:10px;color:#94a3b8;">Mall (5km)</div>
                      <div style="font-size:13px;font-weight:600;color:#334155;">${stat.Mall.toFixed(0)}</div>
                    </div>
                    <div style="background:#f8fafc;border-radius:8px;padding:7px 10px;">
                      <div style="font-size:10px;color:#94a3b8;">RS (5km)</div>
                      <div style="font-size:13px;font-weight:600;color:#334155;">${stat.RS.toFixed(0)}</div>
                    </div>
                    <div style="background:#f8fafc;border-radius:8px;padding:7px 10px;">
                      <div style="font-size:10px;color:#94a3b8;">Jarak Stasiun</div>
                      <div style="font-size:13px;font-weight:600;color:#334155;">${stat.Jarak_Stasiun.toFixed(1)} km</div>
                    </div>
                    <div style="background:#f8fafc;border-radius:8px;padding:7px 10px;">
                      <div style="font-size:10px;color:#94a3b8;">Jarak Tol</div>
                      <div style="font-size:13px;font-weight:600;color:#334155;">${stat.Jarak_Tol.toFixed(1)} km</div>
                    </div>
                    ${flood ? `<div style="background:${flood.Risiko_Banjir >= 0.6 ? '#fef2f2' : flood.Risiko_Banjir >= 0.3 ? '#fff7ed' : '#f0fdf4'};border-radius:8px;padding:7px 10px;">
                      <div style="font-size:10px;color:#94a3b8;">Risiko Banjir</div>
                      <div style="font-size:13px;font-weight:600;color:${flood.Risiko_Banjir >= 0.6 ? '#dc2626' : flood.Risiko_Banjir >= 0.3 ? '#ea580c' : '#16a34a'};">${flood.Kategori_Risiko}</div>
                    </div>` : ""}
                  </div>
                  <button data-kec="${stat.Kecamatan}" data-kota="${stat.Kota}" class="listing-btn" style="display:block;width:100%;margin-top:10px;padding:8px;background:#4f46e5;color:white;border:none;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;text-align:center;transition:background 0.15s;"
                    onmouseover="this.style.background='#4338ca'" onmouseout="this.style.background='#4f46e5'"
                  >Lihat Semua Listing &rarr;</button>
                </div>
              </div>
            `, { maxWidth: 300, className: "custom-popup" });
            layer.bindTooltip(
              `<strong>${stat.Kecamatan}</strong><br/>${stat.Kota}<br/>${fmt(stat.Harga_Median)}`,
              { sticky: true, className: "leaflet-tooltip" }
            );
          } else {
            layer.bindTooltip(`${props.Kecamatan} (${props.Kota})<br/>Tidak ada data`);
          }

          layer.on("click", () => onSelectKec(props.Kecamatan));
        },
      }).addTo(map);
    }

    // Flood overlay
    if (layers.flood) {
      L.geoJSON(filteredGeojson, {
        style: (feature) => {
          const props = feature?.properties;
          const key = `${props?.Kecamatan}|${props?.Kota}`;
          const flood = floodLookup.get(key);
          const risk = flood?.Risiko_Banjir ?? 0;
          return {
            fillColor: risk >= 0.6 ? "#dc2626" : risk >= 0.3 ? "#f97316" : risk > 0.05 ? "#eab308" : "#22c55e",
            fillOpacity: Math.max(0.15, risk * 0.7),
            color: "#374151",
            weight: 0.5,
            opacity: 0.5,
          };
        },
        onEachFeature: (feature, layer) => {
          const props = feature.properties;
          const key = `${props.Kecamatan}|${props.Kota}`;
          const flood = floodLookup.get(key);
          if (flood) {
            layer.bindTooltip(
              `<strong>${flood.Kecamatan}</strong><br/>Risiko: ${flood.Kategori_Risiko}<br/>Sebutan: ${flood.Sebutan_Langsung} berita`,
              { sticky: true }
            );
          }
        },
      }).addTo(map);
    }

    // Crime overlay
    if (layers.crime) {
      L.geoJSON(filteredGeojson, {
        style: (feature) => {
          const props = feature?.properties;
          const key = `${props?.Kecamatan}|${props?.Kota}`;
          const crime = crimeLookup.get(key);
          const risk = crime?.Risiko_Kejahatan ?? 0;
          return {
            fillColor: risk >= 0.6 ? "#7f1d1d" : risk >= 0.3 ? "#b91c1c" : risk > 0.05 ? "#fb923c" : "#86efac",
            fillOpacity: Math.max(0.15, risk * 0.7),
            color: "#374151",
            weight: 0.5,
            opacity: 0.5,
          };
        },
        onEachFeature: (feature, layer) => {
          const props = feature.properties;
          const key = `${props.Kecamatan}|${props.Kota}`;
          const crime = crimeLookup.get(key);
          if (crime) {
            layer.bindTooltip(
              `<strong>${crime.Kecamatan}</strong><br/>Risiko Kejahatan: ${crime.Kategori_Risiko}<br/>Sebutan: ${crime.Sebutan_Langsung} berita`,
              { sticky: true }
            );
          }
        },
      }).addTo(map);
    }

    // Helper: check if facility/station/toll is in filtered kota
    const inKota = (kota: string | undefined) => !filterKota || kota === filterKota;

    // Facility markers
    if (layers.mall) {
      for (const f of facilities.filter((x) => x.Jenis === "Mall" && inKota(x.Kota))) {
        L.marker([f.Lat, f.Lng], { icon: createMarkerIcon(MARKER_COLORS.mall, SVG_MARKER.mall) })
          .bindTooltip(`Mall: ${f.Nama}`)
          .addTo(map);
      }
    }
    if (layers.rs) {
      for (const f of facilities.filter((x) => x.Jenis === "Rumah Sakit" && inKota(x.Kota))) {
        L.marker([f.Lat, f.Lng], { icon: createMarkerIcon(MARKER_COLORS.rs, SVG_MARKER.hospital, 3) })
          .bindTooltip(`RS: ${f.Nama}`)
          .addTo(map);
      }
    }
    if (layers.pendidikan) {
      for (const f of facilities.filter((x) =>
        ["Universitas", "SMA", "SMP", "SD", "TK"].includes(x.Jenis) && inKota(x.Kota)
      )) {
        const isUniv = f.Jenis === "Universitas";
        L.marker([f.Lat, f.Lng], {
          icon: createMarkerIcon(
            isUniv ? MARKER_COLORS.univ : MARKER_COLORS.school,
            isUniv ? SVG_MARKER.graduation : SVG_MARKER.book
          ),
        })
          .bindTooltip(`${f.Jenis}: ${f.Nama}`)
          .addTo(map);
      }
    }
    if (layers.stasiun) {
      for (const s of stations) {
        L.marker([s.Lat, s.Lng], { icon: createMarkerIcon(MARKER_COLORS.train, SVG_MARKER.train) })
          .bindTooltip(`Stasiun: ${s.Nama} (${s.Line})`)
          .addTo(map);
      }
    }
    if (layers.tol) {
      for (const t of tollGates) {
        L.marker([t.Lat, t.Lng], { icon: createMarkerIcon(MARKER_COLORS.toll, SVG_MARKER.toll) })
          .bindTooltip(`Tol: ${t.Nama}`)
          .addTo(map);
      }
    }
  }, [geojson, layers, kecLookup, floodLookup, crimeLookup, selectedKec, facilities, stations, tollGates, onSelectKec, filterKota]);

  // Zoom to filtered kota bounds
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !geojson) return;
    if (!filterKota) {
      map.setView([-6.3, 106.75], 10);
      return;
    }
    const filtered = geojson.features.filter((f) => f.properties?.Kota === filterKota);
    if (filtered.length === 0) return;
    const group = L.geoJSON({ type: "FeatureCollection", features: filtered } as GeoJSON.FeatureCollection);
    const bounds = group.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 13 });
    }
  }, [filterKota, geojson]);

  const toggle = (key: keyof typeof layers) =>
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));

  // Prevent Leaflet from capturing events on overlay panels
  const stopMapEvents = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    L.DomEvent.disableClickPropagation(el);
    L.DomEvent.disableScrollPropagation(el);
  }, []);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />

      {/* Region Filter */}
      <div ref={stopMapEvents} className="absolute top-3 left-3 z-[1000]">
        <div className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden w-52">
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-slate-50 transition-colors"
          >
            <span className="flex items-center gap-2">
              <MapPin size={14} className="text-indigo-500" />
              <span className="font-semibold text-xs text-slate-600 uppercase tracking-wider">
                {filterKota || "Semua Wilayah"}
              </span>
            </span>
            {filterKota ? (
              <button
                onClick={(e) => { e.stopPropagation(); setFilterKota(null); setFilterOpen(false); }}
                className="p-0.5 rounded hover:bg-slate-200 transition-colors"
              >
                <X size={12} className="text-slate-400" />
              </button>
            ) : (
              filterOpen ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />
            )}
          </button>
          {filterOpen && (
            <div className="border-t border-slate-100 max-h-64 overflow-y-auto">
              <button
                onClick={() => { setFilterKota(null); setFilterOpen(false); }}
                className={`w-full text-left px-3.5 py-2 text-[13px] hover:bg-slate-50 transition-colors ${
                  !filterKota ? "text-indigo-600 font-semibold bg-indigo-50/50" : "text-slate-600"
                }`}
              >
                Semua Wilayah
              </button>
              {kotaList.map((kota) => {
                const count = kecStats.filter((k) => k.Kota === kota).length;
                return (
                  <button
                    key={kota}
                    onClick={() => { setFilterKota(kota); setFilterOpen(false); }}
                    className={`w-full text-left px-3.5 py-2 text-[13px] hover:bg-slate-50 transition-colors flex items-center justify-between ${
                      filterKota === kota ? "text-indigo-600 font-semibold bg-indigo-50/50" : "text-slate-600"
                    }`}
                  >
                    <span>{kota}</span>
                    <span className="text-[10px] text-slate-400">{count} kec</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Layer Controls */}
      <div ref={stopMapEvents} className="absolute top-3 right-3 z-[1000] bg-white border border-slate-200 rounded-xl shadow-lg w-56 overflow-hidden">
        <button
          onClick={() => setLayerOpen(!layerOpen)}
          className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-slate-50 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Layers size={14} className="text-slate-400" />
            <span className="font-semibold text-xs text-slate-600 uppercase tracking-wider">Layers</span>
          </span>
          {layerOpen ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
        </button>
        {layerOpen && (
          <div className="px-2 pb-2 border-t border-slate-100">
            {[
              { key: "choropleth" as const, label: "Harga Properti", color: "#4f46e5", Icon: Home },
              { key: "flood" as const, label: "Risiko Banjir", color: "#0ea5e9", Icon: Droplets },
              { key: "crime" as const, label: "Risiko Kejahatan", color: "#991b1b", Icon: Siren },
              { key: "mall" as const, label: "Mall", color: MARKER_COLORS.mall, Icon: ShoppingBag },
              { key: "rs" as const, label: "Rumah Sakit", color: MARKER_COLORS.rs, Icon: Plus },
              { key: "pendidikan" as const, label: "Pendidikan", color: MARKER_COLORS.univ, Icon: GraduationCap },
              { key: "stasiun" as const, label: "Stasiun", color: MARKER_COLORS.train, Icon: TrainFront },
              { key: "tol" as const, label: "Gerbang Tol", color: MARKER_COLORS.toll, Icon: Route },
            ].map((item) => (
              <label
                key={item.key}
                className={`flex items-center gap-2.5 py-2 px-2 cursor-pointer rounded-lg mt-0.5 transition-colors ${
                  layers[item.key] ? "bg-slate-50" : "hover:bg-slate-50/50"
                }`}
              >
                <div className={`relative w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                  layers[item.key] ? "border-indigo-500 bg-indigo-500" : "border-slate-300"
                }`}>
                  {layers[item.key] && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  <input
                    type="checkbox"
                    checked={layers[item.key]}
                    onChange={() => toggle(item.key)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
                <span
                  className="w-[22px] h-[22px] rounded-md flex items-center justify-center flex-shrink-0"
                  style={{ background: layers[item.key] ? item.color : '#cbd5e1' }}
                >
                  <item.Icon size={12} color="white" strokeWidth={2.5} />
                </span>
                <span className={`text-[13px] ${layers[item.key] ? "text-slate-700 font-medium" : "text-slate-400"}`}>{item.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Price Legend */}
      {layers.choropleth && (
        <div ref={stopMapEvents} className="absolute bottom-4 left-3 z-[1000] bg-white border border-slate-200 rounded-xl shadow-lg p-3.5">
          <h4 className="font-semibold text-[10px] text-slate-400 uppercase tracking-wider mb-2">
            Median Harga
          </h4>
          <div
            className="h-2.5 w-48 rounded-full"
            style={{
              background:
                "linear-gradient(to right, #10b981, #f59e0b, #f97316, #ef4444, #8b5cf6)",
            }}
          />
          <div className="flex justify-between text-[9px] text-slate-400 w-48 mt-1">
            <span>&lt;500jt</span>
            <span>1.5M</span>
            <span>3M</span>
            <span>7M</span>
            <span>&gt;15M</span>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1">
            {Object.entries(SEGMEN_COLORS).map(([seg, color]) => (
              <div key={seg} className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-sm"
                  style={{ backgroundColor: color }}
                />
                <span className="text-[10px] text-slate-500">{seg}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Flood Legend */}
      {layers.flood && (
        <div ref={stopMapEvents} className="absolute bottom-4 left-56 z-[1000] bg-white border border-slate-200 rounded-xl shadow-lg p-3.5">
          <h4 className="font-semibold text-[10px] text-slate-400 uppercase tracking-wider mb-2">
            Risiko Banjir
          </h4>
          {[
            { label: "Tinggi (≥60%)", color: "#dc2626", opacity: 0.6 },
            { label: "Sedang (30-60%)", color: "#f97316", opacity: 0.45 },
            { label: "Rendah (5-30%)", color: "#eab308", opacity: 0.3 },
            { label: "Minimal", color: "#22c55e", opacity: 0.15 },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 py-0.5">
              <div
                className="w-4 h-2.5 rounded-sm border border-slate-200"
                style={{ backgroundColor: item.color, opacity: item.opacity + 0.3 }}
              />
              <span className="text-[11px] text-slate-500">{item.label}</span>
            </div>
          ))}
          <p className="text-[9px] text-slate-300 mt-1.5">
            Sumber: Google News RSS
          </p>
        </div>
      )}

      {/* Crime Legend */}
      {layers.crime && (
        <div ref={stopMapEvents} className={`absolute bottom-4 ${layers.flood ? 'left-[26rem]' : 'left-56'} z-[1000] bg-white border border-slate-200 rounded-xl shadow-lg p-3.5`}>
          <h4 className="font-semibold text-[10px] text-slate-400 uppercase tracking-wider mb-2">
            Risiko Kejahatan
          </h4>
          {[
            { label: "Tinggi (≥60%)", color: "#7f1d1d", opacity: 0.65 },
            { label: "Sedang (30-60%)", color: "#b91c1c", opacity: 0.5 },
            { label: "Rendah (5-30%)", color: "#fb923c", opacity: 0.35 },
            { label: "Minimal", color: "#86efac", opacity: 0.2 },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 py-0.5">
              <div
                className="w-4 h-2.5 rounded-sm border border-slate-200"
                style={{ backgroundColor: item.color, opacity: item.opacity + 0.3 }}
              />
              <span className="text-[11px] text-slate-500">{item.label}</span>
            </div>
          ))}
          <p className="text-[9px] text-slate-300 mt-1.5">
            Sumber: Google News RSS
          </p>
        </div>
      )}

      {/* Facility Legend */}
      {(layers.mall || layers.rs || layers.pendidikan || layers.stasiun || layers.tol) && (
        <div ref={stopMapEvents} className="absolute top-16 left-3 z-[999] bg-white border border-slate-200 rounded-xl shadow-lg p-3.5">
          <h4 className="font-semibold text-[10px] text-slate-400 uppercase tracking-wider mb-2">
            Fasilitas
          </h4>
          <div className="space-y-1.5">
            {layers.mall && (
              <div className="flex items-center gap-2">
                <span className="w-[22px] h-[22px] rounded-md flex items-center justify-center flex-shrink-0" style={{ background: MARKER_COLORS.mall }}>
                  <ShoppingBag size={11} color="white" strokeWidth={2.5} />
                </span>
                <span className="text-xs text-slate-600">Mall</span>
                <span className="text-[10px] text-slate-400 ml-auto">{facilities.filter(f => f.Jenis === "Mall").length}</span>
              </div>
            )}
            {layers.rs && (
              <div className="flex items-center gap-2">
                <span className="w-[22px] h-[22px] rounded-md flex items-center justify-center flex-shrink-0" style={{ background: MARKER_COLORS.rs }}>
                  <Plus size={11} color="white" strokeWidth={3} />
                </span>
                <span className="text-xs text-slate-600">Rumah Sakit</span>
                <span className="text-[10px] text-slate-400 ml-auto">{facilities.filter(f => f.Jenis === "Rumah Sakit").length}</span>
              </div>
            )}
            {layers.pendidikan && (
              <>
                <div className="flex items-center gap-2">
                  <span className="w-[22px] h-[22px] rounded-md flex items-center justify-center flex-shrink-0" style={{ background: MARKER_COLORS.univ }}>
                    <GraduationCap size={11} color="white" strokeWidth={2.5} />
                  </span>
                  <span className="text-xs text-slate-600">Universitas</span>
                  <span className="text-[10px] text-slate-400 ml-auto">{facilities.filter(f => f.Jenis === "Universitas").length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-[22px] h-[22px] rounded-md flex items-center justify-center flex-shrink-0" style={{ background: MARKER_COLORS.school }}>
                    <BookOpen size={11} color="white" strokeWidth={2.5} />
                  </span>
                  <span className="text-xs text-slate-600">Sekolah</span>
                  <span className="text-[10px] text-slate-400 ml-auto">{facilities.filter(f => !["Mall","Rumah Sakit","Universitas"].includes(f.Jenis)).length}</span>
                </div>
              </>
            )}
            {layers.stasiun && (
              <div className="flex items-center gap-2">
                <span className="w-[22px] h-[22px] rounded-md flex items-center justify-center flex-shrink-0" style={{ background: MARKER_COLORS.train }}>
                  <TrainFront size={11} color="white" strokeWidth={2.5} />
                </span>
                <span className="text-xs text-slate-600">Stasiun</span>
                <span className="text-[10px] text-slate-400 ml-auto">{stations.length}</span>
              </div>
            )}
            {layers.tol && (
              <div className="flex items-center gap-2">
                <span className="w-[22px] h-[22px] rounded-md flex items-center justify-center flex-shrink-0" style={{ background: MARKER_COLORS.toll }}>
                  <Route size={11} color="white" strokeWidth={2.5} />
                </span>
                <span className="text-xs text-slate-600">Gerbang Tol</span>
                <span className="text-[10px] text-slate-400 ml-auto">{tollGates.length}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
