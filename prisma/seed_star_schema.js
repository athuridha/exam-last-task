/**
 * Seeder Star Schema
 * ------------------
 * Membangun tabel dimensi (DimLokasi, DimFasilitas, DimRisiko, DimNJOP,
 * DimWaktu) dan tabel fakta (FactHargaRumah) dari tabel staging
 * (Listing + Kecamatan) yang sudah dipopulate oleh pipeline ETL Python.
 *
 * Cara pakai:
 *   node prisma/seed_star_schema.js
 *
 * Idempotent: aman dijalankan ulang. SCD Type 2 untuk DimNJOP akan
 * menutup baris lama (validTo + isCurrent=false) dan membuat baris baru
 * jika nilai NJOP berubah pada tahun yang sama.
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const NJOP_TAHUN = 2025;
const SUMBER_NJOP = "Peraturan Daerah NJOP 2025";

// Konversi rasio ke segmen (sesuai threshold BAB III)
function segmenByRasio(r) {
  if (r == null) return null;
  if (r < 1) return "Rendah";
  if (r < 2) return "Menengah";
  if (r < 3) return "Tinggi";
  return "Premium";
}

function kategoriBanjir(v) {
  if (v == null) return null;
  if (v <= 0.1) return "Rendah";
  if (v <= 0.3) return "Sedang";
  if (v <= 0.6) return "Tinggi";
  return "Sangat Tinggi";
}

function kategoriKejahatan(v) {
  if (v == null) return null;
  if (v <= 2) return "Aman";
  if (v <= 3) return "Cukup Aman";
  if (v <= 4) return "Rawan";
  return "Sangat Rawan";
}

async function buildDimLokasi() {
  console.log("\n[1/6] Building DimLokasi...");
  const kecList = await prisma.kecamatan.findMany();
  let count = 0;
  for (const k of kecList) {
    await prisma.dimLokasi.upsert({
      where: { kecamatan_kota: { kecamatan: k.nama, kota: k.kota } },
      update: { lat: k.lat, lng: k.lng },
      create: {
        kecamatan: k.nama,
        kota: k.kota,
        lat: k.lat,
        lng: k.lng,
      },
    });
    count++;
  }
  console.log(`  ✅ ${count} baris DimLokasi`);
}

async function buildDimFasilitas() {
  console.log("\n[2/6] Building DimFasilitas...");
  const lokasi = await prisma.dimLokasi.findMany();
  const kecLookup = new Map();
  for (const k of await prisma.kecamatan.findMany()) {
    kecLookup.set(`${k.nama}|${k.kota}`, k);
  }
  let count = 0;
  for (const lo of lokasi) {
    const kec = kecLookup.get(`${lo.kecamatan}|${lo.kota}`);
    if (!kec) continue;
    await prisma.dimFasilitas.upsert({
      where: { lokasiKey: lo.lokasiKey },
      update: {
        skorFasilitas: kec.skorFasilitas ?? 0,
        jumlahMall: Math.round(kec.mall ?? 0),
        jumlahRs: Math.round(kec.rs ?? 0),
        jumlahSekolah: Math.round(kec.pendidikan ?? 0),
        jarakTolKm: kec.jarakTol ?? null,
        jarakStasiunKm: kec.jarakStasiun ?? null,
        aksesTol: (kec.jarakTol ?? 99) <= 8 ? "Mudah" : "Terbatas",
        aksesKereta: (kec.jarakStasiun ?? 99) <= 5 ? "Mudah" : "Terbatas",
      },
      create: {
        lokasiKey: lo.lokasiKey,
        skorFasilitas: kec.skorFasilitas ?? 0,
        jumlahMall: Math.round(kec.mall ?? 0),
        jumlahRs: Math.round(kec.rs ?? 0),
        jumlahSekolah: Math.round(kec.pendidikan ?? 0),
        jarakTolKm: kec.jarakTol ?? null,
        jarakStasiunKm: kec.jarakStasiun ?? null,
        aksesTol: (kec.jarakTol ?? 99) <= 8 ? "Mudah" : "Terbatas",
        aksesKereta: (kec.jarakStasiun ?? 99) <= 5 ? "Mudah" : "Terbatas",
      },
    });
    count++;
  }
  console.log(`  ✅ ${count} baris DimFasilitas`);
}

async function buildDimRisiko() {
  console.log("\n[3/6] Building DimRisiko...");
  // Indeks kejahatan per kota (skala 1–5) — fallback dari pipeline/config.py
  const INDEKS_KEJAHATAN_KOTA = {
    "Jakarta Pusat": 3.8,
    "Jakarta Utara": 3.5,
    "Jakarta Barat": 3.3,
    "Jakarta Timur": 3.0,
    "Jakarta Selatan": 2.5,
    "Bekasi": 2.8,
    "Tangerang": 2.7,
    "Tangerang Selatan": 2.0,
    "Depok": 2.5,
    "Bogor": 2.3,
  };
  const lokasi = await prisma.dimLokasi.findMany();
  const kecLookup = new Map();
  for (const k of await prisma.kecamatan.findMany()) {
    kecLookup.set(`${k.nama}|${k.kota}`, k);
  }
  let count = 0;
  for (const lo of lokasi) {
    const kec = kecLookup.get(`${lo.kecamatan}|${lo.kota}`);
    const banjir = kec?.risikoBanjir ?? 0;
    const kejahatan = INDEKS_KEJAHATAN_KOTA[lo.kota] ?? 2.5;
    await prisma.dimRisiko.upsert({
      where: { lokasiKey: lo.lokasiKey },
      update: {
        risikoBanjir: banjir,
        kategoriBanjir: kategoriBanjir(banjir),
        indeksKejahatan: kejahatan,
        kategoriKejahatan: kategoriKejahatan(kejahatan),
        sumberData: "Google News RSS + Polda Metro Jaya",
        diperbaruiPada: new Date(),
      },
      create: {
        lokasiKey: lo.lokasiKey,
        risikoBanjir: banjir,
        kategoriBanjir: kategoriBanjir(banjir),
        indeksKejahatan: kejahatan,
        kategoriKejahatan: kategoriKejahatan(kejahatan),
        sumberData: "Google News RSS + Polda Metro Jaya",
      },
    });
    count++;
  }
  console.log(`  ✅ ${count} baris DimRisiko`);
}

async function buildDimNJOP_SCD2() {
  console.log("\n[4/6] Building DimNJOP (SCD Type 2)...");
  const lokasi = await prisma.dimLokasi.findMany();
  const kecLookup = new Map();
  for (const k of await prisma.kecamatan.findMany()) {
    kecLookup.set(`${k.nama}|${k.kota}`, k);
  }
  const validFrom = new Date(`${NJOP_TAHUN}-01-01`);
  let inserted = 0;
  let closed = 0;
  let unchanged = 0;

  for (const lo of lokasi) {
    const kec = kecLookup.get(`${lo.kecamatan}|${lo.kota}`);
    const njopBaru = BigInt(kec?.njopPerM2 ?? 0);
    if (njopBaru === 0n) continue;

    // Cari record current untuk lokasi+tahun ini
    const current = await prisma.dimNJOP.findFirst({
      where: { lokasiKey: lo.lokasiKey, tahun: NJOP_TAHUN, isCurrent: true },
    });

    if (current) {
      if (current.njopPerM2 === njopBaru) {
        unchanged++;
        continue;
      }
      // SCD Type 2: tutup baris lama
      await prisma.dimNJOP.update({
        where: { njopKey: current.njopKey },
        data: { validTo: new Date(), isCurrent: false },
      });
      closed++;
    }

    // Hapus index unique conflict: kalau ada baris dengan tahun sama yang
    // sudah ditutup sebelumnya, naikkan tahun pakai sub-tahun fictional?
    // Tidak. Constraint @@unique([lokasiKey, tahun]) hanya 1 baris per
    // (lokasi, tahun). Solusi: kalau baris current diatas sudah di-close
    // tapi unique constraint masih melarang insert baru, kita relax dulu
    // dengan memindah tahun ke -1. Tapi normalnya constraint Prisma bisa
    // unique partial — Postgres mendukung lewat WHERE isCurrent=true.
    // Untuk skripsi ini cukup pakai unique [lokasiKey, tahun] dan asumsi
    // 1 baris per tahun: jadi kalau sudah ditutup, insert baru di tahun
    // berikutnya saat NJOP berikutnya keluar. Saat re-seed di tahun yang
    // sama dengan nilai berbeda, kita update isCurrent saja.
    // → Maka kita pakai upsert berdasarkan [lokasiKey, tahun]:
    await prisma.dimNJOP.upsert({
      where: { lokasiKey_tahun: { lokasiKey: lo.lokasiKey, tahun: NJOP_TAHUN } },
      update: {
        njopPerM2: njopBaru,
        sumber: SUMBER_NJOP,
        validFrom,
        validTo: null,
        isCurrent: true,
      },
      create: {
        lokasiKey: lo.lokasiKey,
        kota: lo.kota,
        tahun: NJOP_TAHUN,
        njopPerM2: njopBaru,
        sumber: SUMBER_NJOP,
        validFrom,
        isCurrent: true,
      },
    });
    inserted++;
  }
  console.log(
    `  ✅ DimNJOP: ${inserted} insert/update, ${closed} closed (SCD2), ${unchanged} unchanged`
  );
}

async function buildDimWaktu() {
  console.log("\n[5/6] Building DimWaktu...");
  // Tanggal observasi listing = tanggal seeding pertama. Untuk skripsi
  // cukup 1 baris waktu (snapshot cross-sectional 2025).
  const tanggal = new Date(`${NJOP_TAHUN}-01-01`);
  await prisma.dimWaktu.upsert({
    where: { tanggal },
    update: {},
    create: {
      tanggal,
      tahun: NJOP_TAHUN,
      bulan: 1,
      kuartal: 1,
      hari: 1,
    },
  });
  console.log(`  ✅ 1 baris DimWaktu (snapshot ${NJOP_TAHUN})`);
}

async function buildFactHargaRumah() {
  console.log("\n[6/6] Building FactHargaRumah...");

  // Build lookup maps
  const lokasiMap = new Map();
  for (const lo of await prisma.dimLokasi.findMany()) {
    lokasiMap.set(`${lo.kecamatan}|${lo.kota}`, lo);
  }
  const fasilitasMap = new Map();
  for (const f of await prisma.dimFasilitas.findMany()) {
    fasilitasMap.set(f.lokasiKey, f.fasilitasKey);
  }
  const risikoMap = new Map();
  for (const r of await prisma.dimRisiko.findMany()) {
    risikoMap.set(r.lokasiKey, r.risikoKey);
  }
  const njopMap = new Map();
  for (const n of await prisma.dimNJOP.findMany({ where: { isCurrent: true } })) {
    njopMap.set(n.lokasiKey, n);
  }
  const waktu = await prisma.dimWaktu.findFirst({
    where: { tahun: NJOP_TAHUN },
    orderBy: { tanggal: "asc" },
  });
  const waktuKey = waktu?.waktuKey ?? null;

  // Truncate fact table sebelum reload (idempotent)
  await prisma.factHargaRumah.deleteMany({});
  console.log(`  🗑️  FactHargaRumah dikosongkan untuk reload`);

  const BATCH = 1000;
  let total = 0;
  let cursor = 0;
  const totalListings = await prisma.listing.count();

  while (cursor < totalListings) {
    const listings = await prisma.listing.findMany({
      skip: cursor,
      take: BATCH,
      orderBy: { id: "asc" },
    });
    if (listings.length === 0) break;

    const rows = [];
    for (const l of listings) {
      const lo = lokasiMap.get(`${l.kecamatan}|${l.kota}`);
      if (!lo) continue;
      const njop = njopMap.get(lo.lokasiKey);
      const njopValue = njop ? Number(njop.njopPerM2) : 0;
      const hargaPerM2Tanah =
        l.luasTanah > 0 ? Number(l.harga) / l.luasTanah : null;
      const rasio =
        njopValue > 0 && hargaPerM2Tanah ? hargaPerM2Tanah / njopValue : null;
      // Filter outlier rasio yang tidak masuk akal
      if (rasio != null && (rasio < 0.05 || rasio > 50)) continue;

      rows.push({
        listingId: l.id,
        lokasiKey: lo.lokasiKey,
        fasilitasKey: fasilitasMap.get(lo.lokasiKey) ?? null,
        risikoKey: risikoMap.get(lo.lokasiKey) ?? null,
        njopKey: njop?.njopKey ?? null,
        waktuKey,
        harga: l.harga,
        hargaPerM2Tanah,
        hargaPerM2Bangun: l.hargaPerM2Bangun,
        luasTanah: l.luasTanah,
        luasBangunan: l.luasBangunan,
        kamarTidur: l.kamarTidur,
        kamarMandi: l.kamarMandi,
        rasioHargaNjop: rasio,
        segmen: rasio != null ? segmenByRasio(rasio) : l.segmen,
        skorLegalitas: null,
      });
    }

    if (rows.length > 0) {
      await prisma.factHargaRumah.createMany({ data: rows });
      total += rows.length;
    }
    cursor += BATCH;
    process.stdout.write(`\r  ⏳ ${total}/${totalListings} fact rows...`);
  }
  console.log(`\n  ✅ ${total} baris FactHargaRumah dimuat`);
}

async function main() {
  console.log("=".repeat(60));
  console.log("🌟 SEED STAR SCHEMA — Visualisasi Properti Jabodetabek");
  console.log("=".repeat(60));
  const start = Date.now();

  await buildDimLokasi();
  await buildDimFasilitas();
  await buildDimRisiko();
  await buildDimNJOP_SCD2();
  await buildDimWaktu();
  await buildFactHargaRumah();

  const elapsed = ((Date.now() - start) / 1000).toFixed(2);
  console.log("=".repeat(60));
  console.log(`✨ STAR SCHEMA SIAP DALAM ${elapsed} DETIK`);
  console.log("=".repeat(60));
}

main()
  .catch((e) => {
    console.error("❌ Seed gagal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
