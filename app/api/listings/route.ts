import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const kecamatan = searchParams.get("kecamatan");
  const kota = searchParams.get("kota");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
  const sort = searchParams.get("sort") || "harga";
  const order = searchParams.get("order") === "desc" ? "desc" : "asc";

  const where: Record<string, unknown> = {};
  if (kecamatan) where.kecamatan = kecamatan;
  if (kota) where.kota = kota;

  const orderBy: Record<string, string> = {};
  if (["harga", "luasBangunan", "luasTanah", "kamarTidur"].includes(sort)) {
    orderBy[sort] = order;
  } else {
    orderBy.harga = "asc";
  }

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        judul: true,
        harga: true,
        kamarTidur: true,
        kamarMandi: true,
        luasBangunan: true,
        luasTanah: true,
        area: true,
        kota: true,
        kecamatan: true,
        lokasi: true,
        urlProperti: true,
        gambar: true,
      },
    }),
    prisma.listing.count({ where }),
  ]);

  // Convert BigInt to number for JSON serialization
  const serialized = listings.map((l) => ({
    ...l,
    harga: Number(l.harga),
  }));

  return NextResponse.json({
    data: serialized,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
