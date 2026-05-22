import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    const filterKecamatan = searchParams.get("kecamatan") || "";
    const filterSegmen = searchParams.get("segmen") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "15", 10);

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (filterKota) where.kota = filterKota;
    if (filterKecamatan) where.kecamatan = filterKecamatan;

    const [listings, kecamatanData] = await Promise.all([
      prisma.listing.findMany({
        select: {
          id: true,
          judul: true,
          kecamatan: true,
          kota: true,
          harga: true,
          luasTanah: true,
          luasBangunan: true,
          kamarTidur: true,
          kamarMandi: true,
        },
        where,
      }),
      prisma.kecamatan.findMany({
        select: { nama: true, kota: true, njopPerM2: true },
      }),
    ]);

    const njopMap = new Map<string, number>();
    for (const kec of kecamatanData) {
      if (kec.njopPerM2) {
        njopMap.set(`${kec.nama}-${kec.kota}`, kec.njopPerM2);
      }
    }

    // Calculate rasio and segmen
    let processed = listings
      .map((l) => {
        const njop = njopMap.get(`${l.kecamatan}-${l.kota}`);
        if (!njop || l.luasTanah <= 0) return null;
        const harga = Number(l.harga);
        const hargaPerM2 = harga / l.luasTanah;
        const rasio = hargaPerM2 / njop;
        return {
          id: l.id,
          judul: l.judul,
          kecamatan: l.kecamatan,
          kota: l.kota,
          harga,
          luasTanah: l.luasTanah,
          luasBangunan: l.luasBangunan,
          kamarTidur: l.kamarTidur,
          kamarMandi: l.kamarMandi,
          rasioHNJOP: rasio,
          segmen: getSegmenByRatio(rasio),
        };
      })
      .filter(Boolean) as Array<{
      id: number;
      judul: string;
      kecamatan: string;
      kota: string;
      harga: number;
      luasTanah: number;
      luasBangunan: number;
      kamarTidur: number;
      kamarMandi: number;
      rasioHNJOP: number;
      segmen: string;
    }>;

    // Filter by segmen
    if (filterSegmen) {
      processed = processed.filter((p) => p.segmen === filterSegmen);
    }

    // Sort by rasio desc
    processed.sort((a, b) => b.rasioHNJOP - a.rasioHNJOP);

    const total = processed.length;
    const totalPages = Math.ceil(total / pageSize);
    const paginated = processed.slice(
      (page - 1) * pageSize,
      page * pageSize
    );

    return NextResponse.json({
      data: paginated,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Properti list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch properti list" },
      { status: 500 }
    );
  }
}
