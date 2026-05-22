import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Segmen berdasarkan Rasio Harga/NJOP
function getSegmenByRatio(ratio: number): string {
  if (ratio < 1) return "Rendah";
  if (ratio < 2) return "Menengah";
  if (ratio < 3) return "Tinggi";
  return "Premium";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filterKota = searchParams.get("kota") || "";

    const [listings, kecamatanData] = await Promise.all([
      prisma.listing.findMany({
        select: {
          kecamatan: true,
          kota: true,
          harga: true,
          luasTanah: true,
        },
        ...(filterKota ? { where: { kota: filterKota } } : {}),
      }),
      prisma.kecamatan.findMany({
        select: { nama: true, kota: true, njopPerM2: true },
      }),
    ]);

    // Build NJOP lookup
    const njopMap = new Map<string, number>();
    for (const kec of kecamatanData) {
      if (kec.njopPerM2) {
        njopMap.set(`${kec.nama}-${kec.kota}`, kec.njopPerM2);
      }
    }

    // Count per segmen
    const segmenDist: Record<string, number> = {
      Rendah: 0,
      Menengah: 0,
      Tinggi: 0,
      Premium: 0,
    };

    let total = 0;
    for (const l of listings) {
      const njop = njopMap.get(`${l.kecamatan}-${l.kota}`);
      if (njop && l.luasTanah > 0) {
        const hargaPerM2 = Number(l.harga) / l.luasTanah;
        const rasio = hargaPerM2 / njop;
        segmenDist[getSegmenByRatio(rasio)]++;
        total++;
      }
    }

    return NextResponse.json({
      total,
      filter_kota: filterKota || "Semua",
      distribusi: segmenDist,
    });
  } catch (error) {
    console.error("Segmen distribusi error:", error);
    return NextResponse.json(
      { error: "Failed to fetch segmen distribusi" },
      { status: 500 }
    );
  }
}
