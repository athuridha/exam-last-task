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

    // Aggregate per kota
    const kotaAgg: Record<
      string,
      { rasioSum: number; count: number; prices: number[] }
    > = {};

    for (const l of listings) {
      const njop = njopMap.get(`${l.kecamatan}-${l.kota}`);
      if (njop && l.luasTanah > 0) {
        const harga = Number(l.harga);
        const rasio = harga / l.luasTanah / njop;

        if (!kotaAgg[l.kota]) {
          kotaAgg[l.kota] = { rasioSum: 0, count: 0, prices: [] };
        }
        kotaAgg[l.kota].rasioSum += rasio;
        kotaAgg[l.kota].count++;
        kotaAgg[l.kota].prices.push(harga);
      }
    }

    const komparasi = Object.entries(kotaAgg)
      .map(([kota, data]) => {
        const sorted = data.prices.sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        const median =
          sorted.length % 2 === 0
            ? (sorted[mid - 1] + sorted[mid]) / 2
            : sorted[mid] || 0;

        return {
          kota,
          avgRasio: data.rasioSum / data.count,
          medianHarga: median,
          jumlahListing: data.count,
        };
      })
      .sort((a, b) => b.avgRasio - a.avgRasio);

    return NextResponse.json({ komparasi });
  } catch (error) {
    console.error("Kota komparasi error:", error);
    return NextResponse.json(
      { error: "Failed to fetch kota komparasi" },
      { status: 500 }
    );
  }
}
