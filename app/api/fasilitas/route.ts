import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const data = await prisma.fasilitas.findMany();

  const mapped = data.map((f) => ({
    Nama: f.nama,
    Jenis: f.jenis,
    Lat: f.lat,
    Lng: f.lng,
    Kota: f.kota,
  }));

  return NextResponse.json(mapped);
}
