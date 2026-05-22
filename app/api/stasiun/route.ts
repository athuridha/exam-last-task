import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const data = await prisma.stasiun.findMany();

  const mapped = data.map((s) => ({
    Nama: s.nama,
    Jenis: s.jenis,
    Line: s.line,
    Lat: s.lat,
    Lng: s.lng,
  }));

  return NextResponse.json(mapped);
}
