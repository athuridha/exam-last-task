import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/star/segmen
 * --------------------------------------------------------------
 * Endpoint demonstrasi star schema. Mengagregasi distribusi segmen
 * harga dengan join ke seluruh dimensi (DimLokasi, DimNJOP, DimFasilitas,
 * DimRisiko, DimWaktu) sehingga bisa difilter per kota/tahun NJOP.
 *
 * Query params:
 *   ?kota=Jakarta+Selatan
 *   ?tahun=2025
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const kota = searchParams.get("kota") || undefined;
  const tahun = searchParams.get("tahun")
    ? parseInt(searchParams.get("tahun")!, 10)
    : undefined;

  // Query agregat dari Fact + Dim
  const facts = await prisma.factHargaRumah.findMany({
    where: {
      ...(kota ? { lokasi: { kota } } : {}),
      ...(tahun ? { njop: { tahun, isCurrent: true } } : {}),
    },
    select: {
      segmen: true,
      rasioHargaNjop: true,
      harga: true,
      lokasi: { select: { kecamatan: true, kota: true } },
      njop: { select: { tahun: true, njopPerM2: true, isCurrent: true } },
    },
  });

  const distribusi: Record<string, number> = {
    Rendah: 0,
    Menengah: 0,
    Tinggi: 0,
    Premium: 0,
  };
  let sumRasio = 0;
  let n = 0;
  const kotaAgg: Record<string, { sum: number; count: number }> = {};

  for (const f of facts) {
    if (f.segmen && distribusi[f.segmen] !== undefined) distribusi[f.segmen]++;
    if (f.rasioHargaNjop != null) {
      sumRasio += f.rasioHargaNjop;
      n++;
    }
    const k = f.lokasi.kota;
    if (!kotaAgg[k]) kotaAgg[k] = { sum: 0, count: 0 };
    if (f.rasioHargaNjop != null) {
      kotaAgg[k].sum += f.rasioHargaNjop;
      kotaAgg[k].count++;
    }
  }

  const rasioPerKota = Object.entries(kotaAgg)
    .map(([kota, d]) => ({
      kota,
      avgRasio: d.count > 0 ? d.sum / d.count : 0,
      n: d.count,
    }))
    .sort((a, b) => b.avgRasio - a.avgRasio);

  return NextResponse.json({
    source: "star_schema",
    table: "FactHargaRumah",
    filter: { kota: kota ?? "Semua", tahun: tahun ?? "Semua (current)" },
    total_fact_rows: facts.length,
    avg_rasio: n > 0 ? sumRasio / n : 0,
    distribusi,
    rasio_per_kota: rasioPerKota,
  });
}
