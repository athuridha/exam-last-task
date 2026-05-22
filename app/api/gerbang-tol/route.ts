import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const data = await prisma.gerbangTol.findMany();

  const mapped = data.map((t) => ({
    Nama: t.nama,
    Ruas_Tol: t.ruasTol,
    Lat: t.lat,
    Lng: t.lng,
  }));

  return NextResponse.json(mapped);
}
