import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/star/njop-history
 * --------------------------------------------------------------
 * Mendemonstrasikan SCD Type 2 di DimNJOP — mengembalikan riwayat
 * nilai NJOP per kecamatan dengan validFrom, validTo, isCurrent.
 *
 * Query params:
 *   ?kecamatan=Cilandak
 *   ?kota=Jakarta+Selatan
 *   ?onlyCurrent=true   (default false)
 */

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const kecamatan = searchParams.get("kecamatan");
  const kota = searchParams.get("kota");
  const onlyCurrent = searchParams.get("onlyCurrent") === "true";

  const rows = await prisma.dimNJOP.findMany({
    where: {
      ...(onlyCurrent ? { isCurrent: true } : {}),
      ...(kota ? { kota } : {}),
      ...(kecamatan
        ? { lokasi: { kecamatan } }
        : {}),
    },
    include: { lokasi: true },
    orderBy: [{ kota: "asc" }, { tahun: "asc" }, { validFrom: "asc" }],
    take: 500,
  });

  return NextResponse.json({
    scd_type: "SCD Type 2",
    fields: ["validFrom", "validTo", "isCurrent"],
    total: rows.length,
    history: rows.map((r) => ({
      njopKey: r.njopKey,
      kecamatan: r.lokasi.kecamatan,
      kota: r.kota,
      tahun: r.tahun,
      njopPerM2: Number(r.njopPerM2),
      sumber: r.sumber,
      validFrom: r.validFrom,
      validTo: r.validTo,
      isCurrent: r.isCurrent,
    })),
  });
}
