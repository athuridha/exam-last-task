/*
  Seed DB via Prisma Client (Postgres/SQLite).

  Usage (from visualisasi-properti/):
    node prisma/seed_prisma.js

  Notes:
  - Requires DATABASE_URL to point to the target database.
  - Sources:
    - CSV: ../rumah123_jabodetabek_with_features.csv
    - JSON: public/data/*.json
*/

const fs = require("fs");
const path = require("path");
const Papa = require("papaparse");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const PROJECT_DIR = path.resolve(__dirname, "..");
const DATA_DIR = path.resolve(PROJECT_DIR, "..");
const CSV_PATH = path.join(DATA_DIR, "rumah123_jabodetabek_with_features.csv");
const JSON_DIR = path.join(PROJECT_DIR, "public", "data");

function loadJson(fileName) {
  const filePath = path.join(JSON_DIR, fileName);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function toInt(value, fallback = 0) {
  const num = toNumber(value, NaN);
  return Number.isFinite(num) ? Math.trunc(num) : fallback;
}

function toOptionalFloat(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  if (!s) return null;
  const num = Number(s);
  return Number.isFinite(num) ? num : null;
}

function toBigInt(value, fallback = 0n) {
  if (value === null || value === undefined) return fallback;

  if (typeof value === "bigint") return value;
  if (typeof value === "number") {
    return Number.isFinite(value) ? BigInt(Math.trunc(value)) : fallback;
  }

  const raw = String(value).trim();
  if (!raw) return fallback;

  const normalized = raw.replace(/,/g, "");

  // integer
  if (/^-?\d+$/.test(normalized)) return BigInt(normalized);

  // decimal
  if (/^-?\d+\.\d+$/.test(normalized)) return BigInt(normalized.split(".")[0]);

  // exponent or other numeric form
  const num = Number(normalized);
  if (Number.isFinite(num)) return BigInt(Math.trunc(num));

  return fallback;
}

function toOptionalString(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s ? s : null;
}

async function clearAllTables() {
  console.log("Clearing tables...");
  await prisma.listing.deleteMany();
  await prisma.kecamatan.deleteMany();
  await prisma.fasilitas.deleteMany();
  await prisma.stasiun.deleteMany();
  await prisma.gerbangTol.deleteMany();
}

async function seedReferenceData() {
  console.log("Seeding Kecamatan...");
  const stats = loadJson("kecamatan_stats.json");
  await prisma.kecamatan.createMany({
    data: stats.map((s) => ({
      nama: String(s["Kecamatan"] ?? ""),
      kota: String(s["Kota"] ?? ""),
      lat: toNumber(s["Lat"], 0),
      lng: toNumber(s["Lng"], 0),
      hargaMedian: s["Harga_Median"] != null ? toBigInt(s["Harga_Median"], 0n) : null,
      hargaMean: s["Harga_Mean"] != null ? toBigInt(s["Harga_Mean"], 0n) : null,
      jumlah: s["Jumlah"] != null ? toInt(s["Jumlah"], 0) : null,
      skorFasilitas: toOptionalFloat(s["Skor_Fasilitas"]),
      mall: toOptionalFloat(s["Mall"]),
      rs: toOptionalFloat(s["RS"]),
      pendidikan: toOptionalFloat(s["Pendidikan"]),
      jarakTol: toOptionalFloat(s["Jarak_Tol"]),
      jarakStasiun: toOptionalFloat(s["Jarak_Stasiun"]),
      risikoBanjir: toOptionalFloat(s["Risiko_Banjir"]),
      segmenDominan: toOptionalString(s["Segmen_Dominan"]),
      njopPerM2: s["NJOP_per_m2"] != null ? toInt(s["NJOP_per_m2"], 0) : null,
    })),
    skipDuplicates: true,
  });
  console.log(`  ${stats.length} kecamatan upserted/inserted`);

  console.log("Seeding Fasilitas...");
  const fasilitas = loadJson("fasilitas.json");
  await prisma.fasilitas.createMany({
    data: fasilitas.map((f) => ({
      nama: String(f["Nama"] ?? ""),
      jenis: String(f["Jenis"] ?? ""),
      lat: toNumber(f["Lat"], 0),
      lng: toNumber(f["Lng"], 0),
      kota: String(f["Kota"] ?? ""),
      sumber: toOptionalString(f["Sumber"]),
    })),
  });
  console.log(`  ${fasilitas.length} fasilitas inserted`);

  console.log("Seeding Stasiun...");
  const stasiun = loadJson("stasiun.json");
  await prisma.stasiun.createMany({
    data: stasiun.map((s) => ({
      nama: String(s["Nama"] ?? ""),
      jenis: String(s["Jenis"] ?? ""),
      line: String(s["Line"] ?? ""),
      lat: toNumber(s["Lat"], 0),
      lng: toNumber(s["Lng"], 0),
      sumber: toOptionalString(s["Sumber"]),
    })),
  });
  console.log(`  ${stasiun.length} stasiun inserted`);

  console.log("Seeding GerbangTol...");
  const tol = loadJson("gerbang_tol.json");
  await prisma.gerbangTol.createMany({
    data: tol.map((t) => ({
      nama: String(t["Nama"] ?? ""),
      ruasTol: String(t["Ruas_Tol"] ?? ""),
      lat: toNumber(t["Lat"], 0),
      lng: toNumber(t["Lng"], 0),
      sumber: toOptionalString(t["Sumber"]),
    })),
  });
  console.log(`  ${tol.length} gerbang tol inserted`);
}

async function seedListingsFromCsv() {
  if (!fs.existsSync(CSV_PATH)) {
    throw new Error(`CSV not found: ${CSV_PATH}`);
  }

  console.log("Seeding Listing from CSV...");
  console.log(`  CSV: ${CSV_PATH}`);

  const BATCH_SIZE = 1000;
  let batch = [];
  let inserted = 0;

  const stream = fs.createReadStream(CSV_PATH, { encoding: "utf8" });

  await new Promise((resolve, reject) => {
    Papa.parse(stream, {
      header: true,
      skipEmptyLines: true,
      step: (results, parser) => {
        try {
          const row = results.data || {};
          const kecamatan = String(row["Kecamatan"] ?? "").trim();
          if (!kecamatan) return;

          const listing = {
            judul: String(row["Judul"] ?? ""),
            harga: toBigInt(row["Harga"], 0n),
            kamarTidur: toInt(row["Kamar Tidur"], 0),
            kamarMandi: toInt(row["Kamar Mandi"], 0),
            totalKamar: toInt(row["Total_Kamar"], 0),
            luasBangunan: toNumber(row["Luas Bangunan (m²)"], 0),
            luasTanah: toNumber(row["Luas Tanah (m²)"], 0),
            hargaPerM2Bangun: toOptionalFloat(row["Harga_per_m2_Bangunan"]),
            hargaPerM2Tanah: toOptionalFloat(row["Harga_per_m2_Tanah"]),
            area: String(row["Area"] ?? ""),
            kota: String(row["Kota"] ?? ""),
            kecamatan,
            lokasi: toOptionalString(row["Lokasi"]),
            urlProperti: String(row["URL Properti"] ?? ""),
            gambar: toOptionalString(row["Gambar"]),
            segmen: null,
          };

          batch.push(listing);

          if (batch.length >= BATCH_SIZE) {
            parser.pause();
            const toInsert = batch;
            batch = [];

            prisma.listing
              .createMany({ data: toInsert })
              .then((res) => {
                inserted += res.count;
                if (inserted % 5000 === 0) {
                  console.log(`  ...${inserted} listings`);
                }
                parser.resume();
              })
              .catch((err) => {
                parser.abort();
                reject(err);
              });
          }
        } catch (err) {
          parser.abort();
          reject(err);
        }
      },
      complete: () => {
        (async () => {
          if (batch.length > 0) {
            const res = await prisma.listing.createMany({ data: batch });
            inserted += res.count;
          }
          console.log(`  ${inserted} listings inserted`);
          resolve();
        })().catch(reject);
      },
      error: (err) => reject(err),
    });
  });
}

async function main() {
  console.log("=== Prisma Seed (seed_prisma.js) ===");
  console.log(`DB: ${process.env.DATABASE_URL ? "(DATABASE_URL set)" : "(DATABASE_URL missing)"}`);
  console.log(`JSON_DIR: ${JSON_DIR}`);

  await clearAllTables();
  await seedReferenceData();
  await seedListingsFromCsv();

  const [listingCount, kecCount, fasCount, stCount, tolCount] = await Promise.all([
    prisma.listing.count(),
    prisma.kecamatan.count(),
    prisma.fasilitas.count(),
    prisma.stasiun.count(),
    prisma.gerbangTol.count(),
  ]);

  console.log("\n--- Verification ---");
  console.log(`  Listing:   ${listingCount}`);
  console.log(`  Kecamatan: ${kecCount}`);
  console.log(`  Fasilitas: ${fasCount}`);
  console.log(`  Stasiun:   ${stCount}`);
  console.log(`  GerbangTol:${tolCount}`);
  console.log("\nDone.");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
