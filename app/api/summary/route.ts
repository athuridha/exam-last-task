import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Segmentasi berdasarkan Rasio Harga/NJOP (sesuai skripsi BAB III)
// Rendah: < 1×, Menengah: 1-2×, Tinggi: 2-3×, Premium: ≥ 3×
function getSegmenByRatio(ratio: number): string {
  if (ratio < 1) return "Rendah";
  if (ratio < 2) return "Menengah";
  if (ratio < 3) return "Tinggi";
  return "Premium";
}

export async function GET() {
  const [listings, kecData, kotaGroups] = await Promise.all([
    prisma.listing.findMany({
      select: { harga: true, luasTanah: true, kecamatan: true, kota: true },
    }),
    prisma.kecamatan.findMany({
      select: { nama: true, kota: true, njopPerM2: true },
    }),
    prisma.listing.groupBy({ by: ["kota"], _count: true }),
  ]);

  // Build NJOP lookup
  const njopMap = new Map<string, number>();
  for (const kec of kecData) {
    if (kec.njopPerM2) {
      njopMap.set(`${kec.nama}-${kec.kota}`, kec.njopPerM2);
    }
  }

  // Calculate prices and segmen based on rasio
  const prices: number[] = [];
  const segmenDist: Record<string, number> = {
    Rendah: 0,
    Menengah: 0,
    Tinggi: 0,
    Premium: 0,
  };

  for (const l of listings) {
    const harga = Number(l.harga);
    prices.push(harga);

    const njop = njopMap.get(`${l.kecamatan}-${l.kota}`);
    if (njop && l.luasTanah > 0) {
      const hargaPerM2 = harga / l.luasTanah;
      const rasio = hargaPerM2 / njop;
      const segmen = getSegmenByRatio(rasio);
      segmenDist[segmen]++;
    }
  }

  // Price stats
  prices.sort((a, b) => a - b);
  const hargaMin = prices[0] ?? 0;
  const hargaMax = prices[prices.length - 1] ?? 0;
  const mid = Math.floor(prices.length / 2);
  const hargaMedian =
    prices.length % 2 === 0
      ? (prices[mid - 1] + prices[mid]) / 2
      : prices[mid];

  // Kota list
  const kotaList = kotaGroups.map((g) => g.kota).sort();

  return NextResponse.json({
    total_listings: listings.length,
    total_kecamatan: kecData.length,
    total_kota: kotaList.length,
    harga_median: hargaMedian,
    harga_min: hargaMin,
    harga_max: hargaMax,
    segmen_dist: segmenDist,
    kota_list: kotaList,
  });
}
