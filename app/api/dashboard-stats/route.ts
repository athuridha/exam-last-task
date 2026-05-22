import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Segmen berdasarkan Rasio Harga/NJOP
function getSegmenByRatio(ratio: number): string {
  if (ratio < 1) return "Rendah";
  if (ratio < 2) return "Menengah";
  if (ratio < 3) return "Tinggi";
  return "Premium";
}

export async function GET() {
  try {
    // Ambil semua listing dengan kecamatan data
    const [listings, kecamatanData] = await Promise.all([
      prisma.listing.findMany({
        select: {
          id: true,
          kecamatan: true,
          kota: true,
          harga: true,
          luasTanah: true,
          luasBangunan: true,
        },
      }),
      prisma.kecamatan.findMany({
        select: {
          nama: true,
          kota: true,
          njopPerM2: true,
          hargaMedian: true,
          hargaMean: true,
          skorFasilitas: true,
          jarakTol: true,
          jarakStasiun: true,
          risikoBanjir: true,
        },
      }),
    ]);

    // Build NJOP lookup map
    const njopMap = new Map<string, number>();
    for (const kec of kecamatanData) {
      const key = `${kec.nama}-${kec.kota}`;
      if (kec.njopPerM2) {
        njopMap.set(key, kec.njopPerM2);
      }
    }

    // Calculate Rasio H/NJOP for each listing
    interface ListingWithRatio {
      id: number;
      kecamatan: string;
      kota: string;
      harga: number;
      luasTanah: number;
      luasBangunan: number;
      njopPerM2: number;
      hargaPerM2: number;
      rasioHNJOP: number;
      segmen: string;
    }

    const listingsWithRatio: ListingWithRatio[] = [];
    for (const l of listings) {
      const key = `${l.kecamatan}-${l.kota}`;
      const njopPerM2 = njopMap.get(key);
      
      if (njopPerM2 && l.luasTanah > 0) {
        const harga = Number(l.harga);
        const hargaPerM2Tanah = harga / l.luasTanah;
        const rasioHNJOP = hargaPerM2Tanah / njopPerM2;
        
        // Filter outlier: rasio < 0.05 atau > 50 kemungkinan data error
        if (rasioHNJOP < 0.05 || rasioHNJOP > 50) continue;
        
        listingsWithRatio.push({
          id: l.id,
          kecamatan: l.kecamatan,
          kota: l.kota,
          harga,
          luasTanah: l.luasTanah,
          luasBangunan: l.luasBangunan,
          njopPerM2,
          hargaPerM2: hargaPerM2Tanah,
          rasioHNJOP,
          segmen: getSegmenByRatio(rasioHNJOP),
        });
      }
    }

    // ===================
    // STATISTIK UMUM
    // ===================
    const totalListings = listingsWithRatio.length;
    const kotaSet = new Set(listingsWithRatio.map((l) => l.kota));
    const kecamatanSet = new Set(
      listingsWithRatio.map((l) => `${l.kecamatan}-${l.kota}`)
    );

    // Rata-rata Rasio H/NJOP
    const avgRasioHNJOP =
      listingsWithRatio.length > 0
        ? listingsWithRatio.reduce((sum, l) => sum + l.rasioHNJOP, 0) /
          listingsWithRatio.length
        : 0;

    // Median harga
    const sortedPrices = listingsWithRatio
      .map((l) => l.harga)
      .sort((a, b) => a - b);
    const mid = Math.floor(sortedPrices.length / 2);
    const medianHarga =
      sortedPrices.length % 2 === 0
        ? (sortedPrices[mid - 1] + sortedPrices[mid]) / 2
        : sortedPrices[mid] || 0;

    // ===================
    // DISTRIBUSI SEGMEN
    // ===================
    const segmenDist: Record<string, number> = {
      Rendah: 0,
      Menengah: 0,
      Tinggi: 0,
      Premium: 0,
    };
    for (const l of listingsWithRatio) {
      segmenDist[l.segmen]++;
    }

    // Segmen dominan
    let segmenDominan = "Menengah";
    let maxCount = 0;
    for (const [seg, count] of Object.entries(segmenDist)) {
      if (count > maxCount) {
        maxCount = count;
        segmenDominan = seg;
      }
    }

    // ===================
    // RATA-RATA RASIO PER KOTA
    // ===================
    const kotaRasioSum: Record<string, { sum: number; count: number }> = {};
    for (const l of listingsWithRatio) {
      if (!kotaRasioSum[l.kota]) {
        kotaRasioSum[l.kota] = { sum: 0, count: 0 };
      }
      kotaRasioSum[l.kota].sum += l.rasioHNJOP;
      kotaRasioSum[l.kota].count++;
    }
    const rasioPerKota = Object.entries(kotaRasioSum)
      .map(([kota, data]) => ({
        kota,
        avgRasio: data.sum / data.count,
      }))
      .sort((a, b) => b.avgRasio - a.avgRasio);

    // ===================
    // TOP 5 KECAMATAN RASIO TERTINGGI
    // ===================
    const kecRasioSum: Record<
      string,
      { sum: number; count: number; kota: string }
    > = {};
    for (const l of listingsWithRatio) {
      const key = l.kecamatan;
      if (!kecRasioSum[key]) {
        kecRasioSum[key] = { sum: 0, count: 0, kota: l.kota };
      }
      kecRasioSum[key].sum += l.rasioHNJOP;
      kecRasioSum[key].count++;
    }
    const top5Kecamatan = Object.entries(kecRasioSum)
      .map(([kecamatan, data]) => ({
        kecamatan,
        kota: data.kota,
        avgRasio: data.sum / data.count,
      }))
      .sort((a, b) => b.avgRasio - a.avgRasio)
      .slice(0, 5);

    // ===================
    // VIP PLS (BOBOT VARIABEL PER KONSTRUK)
    // ===================
    // Rata-rata VIP Score per konstruk laten dari hasil PLS Regression
    // Threshold signifikansi: VIP > 1.0 (Hair et al., 2021)
    const vipPLS = {
      AKSESIBILITAS: 1.55,  // Aksesibilitas Transportasi (Jarak Pusat, Akses Kereta, Akses Tol)
      IP: 1.18,             // Ketersediaan Fasilitas Publik (Skor Fasilitas)
      Fa: 1.00,             // Risiko Lingkungan (Risiko Banjir, Indeks Kejahatan)
      Rasio: 1.72,          // NJOP per m² (variabel lokasional)
      Fisik: 0.65,          // Karakteristik Fisik (Luas, Kamar, Legalitas)
    };

    // ===================
    // DAFTAR PROPERTI (all listings)
    // ===================
    const propertyList = listingsWithRatio
      .sort((a, b) => b.rasioHNJOP - a.rasioHNJOP)
      .map((l) => ({
        kecamatan: l.kecamatan,
        kota: l.kota,
        harga: l.harga,
        luasTanah: l.luasTanah,
        luasBangunan: l.luasBangunan,
        rasioHNJOP: l.rasioHNJOP,
        segmen: l.segmen,
      }));

    // Kota list for filter
    const kotaList = Array.from(kotaSet).sort();

    // Kecamatan list for filter
    const kecamatanList = Array.from(
      new Set(listingsWithRatio.map((l) => l.kecamatan))
    ).sort();

    return NextResponse.json({
      // Summary stats
      total_listings: totalListings,
      total_kota: kotaSet.size,
      total_kecamatan: kecamatanSet.size,
      avg_rasio_hnjop: avgRasioHNJOP,
      median_harga: medianHarga,
      segmen_dominan: segmenDominan,

      // Distributions
      segmen_dist: segmenDist,
      rasio_per_kota: rasioPerKota,
      top5_kecamatan: top5Kecamatan,

      // PLS VIP weights
      vip_pls: vipPLS,

      // Property list
      property_list: propertyList,

      // Filter options
      kota_list: kotaList,
      kecamatan_list: kecamatanList,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
