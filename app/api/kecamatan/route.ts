import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const data = await prisma.kecamatan.findMany({
    orderBy: { nama: "asc" },
  });

  // Map to match the frontend KecamatanStat interface
  const mapped = data.map((k) => ({
    Kecamatan: k.nama,
    Kota: k.kota,
    Harga_Median: Number(k.hargaMedian ?? 0),
    Harga_Mean: Number(k.hargaMean ?? 0),
    Jumlah: k.jumlah ?? 0,
    Skor_Fasilitas: k.skorFasilitas ?? 0,
    Mall: k.mall ?? 0,
    RS: k.rs ?? 0,
    Pendidikan: k.pendidikan ?? 0,
    Jarak_Tol: k.jarakTol ?? 0,
    Jarak_Stasiun: k.jarakStasiun ?? 0,
    Lat: k.lat,
    Lng: k.lng,
    Risiko_Banjir: k.risikoBanjir ?? 0,
    Segmen_Dominan: k.segmenDominan ?? "",
    NJOP_per_m2: k.njopPerM2 ?? 0,
  }));

  return NextResponse.json(mapped);
}
