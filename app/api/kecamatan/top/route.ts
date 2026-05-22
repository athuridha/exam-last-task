import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [listings, kecamatanData] = await Promise.all([
      prisma.listing.findMany({
        select: {
          kecamatan: true,
          kota: true,
          harga: true,
          luasTanah: true,
        },
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

    // Aggregate per kecamatan
    const kecAgg: Record<
      string,
      { rasioSum: number; count: number; kota: string }
    > = {};

    for (const l of listings) {
      const njop = njopMap.get(`${l.kecamatan}-${l.kota}`);
      if (njop && l.luasTanah > 0) {
        const rasio = Number(l.harga) / l.luasTanah / njop;
        const key = `${l.kecamatan}|${l.kota}`;
        if (!kecAgg[key]) {
          kecAgg[key] = { rasioSum: 0, count: 0, kota: l.kota };
        }
        kecAgg[key].rasioSum += rasio;
        kecAgg[key].count++;
      }
    }

    const sorted = Object.entries(kecAgg)
      .map(([key, data]) => ({
        kecamatan: key.split("|")[0],
        kota: data.kota,
        avgRasio: data.rasioSum / data.count,
        jumlahListing: data.count,
      }))
      .sort((a, b) => b.avgRasio - a.avgRasio);

    return NextResponse.json({
      tertinggi: sorted.slice(0, 10),
      terendah: sorted.slice(-10).reverse(),
    });
  } catch (error) {
    console.error("Kecamatan top error:", error);
    return NextResponse.json(
      { error: "Failed to fetch kecamatan top" },
      { status: 500 }
    );
  }
}
