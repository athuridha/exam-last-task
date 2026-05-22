"""
Seed the SQLite database with all data from CSV and JSON files.
Run from Data dir: python visualisasi-properti/prisma/seed.py
"""
import os
import sys
import sqlite3
import csv
import json

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.dirname(BASE_DIR)

DB_PATH = os.path.join(BASE_DIR, "prisma", "dev.db")
CSV_PATH = os.path.join(DATA_DIR, "rumah123_jabodetabek_with_features.csv")
JSON_DIR = os.path.join(BASE_DIR, "public", "data")

print(f"DB: {DB_PATH}")
print(f"CSV: {CSV_PATH}")
print(f"JSON: {JSON_DIR}")

if not os.path.exists(CSV_PATH):
    print(f"ERROR: CSV not found at {CSV_PATH}")
    sys.exit(1)
if not os.path.exists(DB_PATH):
    print(f"ERROR: Database not found at {DB_PATH} — run 'npx prisma db push' first")
    sys.exit(1)

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# ---- Clear existing data
print("Clearing all tables...")
for table in ["Listing", "Kecamatan", "Fasilitas", "Stasiun", "GerbangTol"]:
    cursor.execute(f"DELETE FROM {table}")
conn.commit()

# ---- Helper to load JSON
def load_json(name):
    path = os.path.join(JSON_DIR, name)
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

# ---- Seed Kecamatan
print("Seeding Kecamatan...")
stats = load_json("kecamatan_stats.json")
for s in stats:
    cursor.execute("""
        INSERT INTO Kecamatan (nama, kota, lat, lng, hargaMedian, hargaMean, jumlah,
            skorFasilitas, mall, rs, pendidikan, jarakTol, jarakStasiun,
            risikoBanjir, segmenDominan, njopPerM2)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        s["Kecamatan"], s["Kota"], s["Lat"], s["Lng"],
        int(s.get("Harga_Median", 0)), int(s.get("Harga_Mean", 0)),
        int(s.get("Jumlah", 0)), s.get("Skor_Fasilitas"),
        s.get("Mall"), s.get("RS"), s.get("Pendidikan"),
        s.get("Jarak_Tol"), s.get("Jarak_Stasiun"),
        s.get("Risiko_Banjir"), s.get("Segmen_Dominan"),
        s.get("NJOP_per_m2"),
    ))
conn.commit()
print(f"  {len(stats)} kecamatan inserted")

# ---- Seed Fasilitas
print("Seeding Fasilitas...")
fasilitas = load_json("fasilitas.json")
for f in fasilitas:
    cursor.execute("""
        INSERT INTO Fasilitas (nama, jenis, lat, lng, kota, sumber)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (f["Nama"], f["Jenis"], f["Lat"], f["Lng"], f["Kota"], f.get("Sumber")))
conn.commit()
print(f"  {len(fasilitas)} fasilitas inserted")

# ---- Seed Stasiun
print("Seeding Stasiun...")
stasiun = load_json("stasiun.json")
for s in stasiun:
    cursor.execute("""
        INSERT INTO Stasiun (nama, jenis, line, lat, lng, sumber)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (s["Nama"], s["Jenis"], s["Line"], s["Lat"], s["Lng"], s.get("Sumber")))
conn.commit()
print(f"  {len(stasiun)} stasiun inserted")

# ---- Seed GerbangTol
print("Seeding GerbangTol...")
tol = load_json("gerbang_tol.json")
for t in tol:
    cursor.execute("""
        INSERT INTO GerbangTol (nama, ruasTol, lat, lng, sumber)
        VALUES (?, ?, ?, ?, ?)
    """, (t["Nama"], t["Ruas_Tol"], t["Lat"], t["Lng"], t.get("Sumber")))
conn.commit()
print(f"  {len(tol)} gerbang tol inserted")

# ---- Seed Listings from CSV
print("Seeding Listings...")
listing_count = 0
batch = []
BATCH_SIZE = 500

with open(CSV_PATH, "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        kecamatan = row.get("Kecamatan", "").strip()
        if not kecamatan:
            continue

        harga = int(float(row.get("Harga", 0)))
        kt = int(float(row.get("Kamar Tidur", 0)))
        km = int(float(row.get("Kamar Mandi", 0)))
        tk = int(float(row.get("Total_Kamar", 0)))
        lb = float(row.get("Luas Bangunan (m²)", 0))
        lt = float(row.get("Luas Tanah (m²)", 0))

        hpm2b_raw = row.get("Harga_per_m2_Bangunan", "")
        hpm2t_raw = row.get("Harga_per_m2_Tanah", "")
        hpm2b = float(hpm2b_raw) if hpm2b_raw else None
        hpm2t = float(hpm2t_raw) if hpm2t_raw else None

        batch.append((
            row.get("Judul", ""),
            harga,
            kt, km, tk, lb, lt,
            hpm2b, hpm2t,
            row.get("Area", ""),
            row.get("Kota", ""),
            kecamatan,
            row.get("Lokasi", ""),
            row.get("URL Properti", ""),
            row.get("Gambar", ""),
            None,
        ))

        if len(batch) >= BATCH_SIZE:
            cursor.executemany("""
                INSERT INTO Listing (judul, harga, kamarTidur, kamarMandi, totalKamar,
                    luasBangunan, luasTanah, hargaPerM2Bangun, hargaPerM2Tanah,
                    area, kota, kecamatan, lokasi, urlProperti, gambar, segmen)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, batch)
            listing_count += len(batch)
            batch = []
            if listing_count % 5000 == 0:
                print(f"  ...{listing_count} listings")

    if batch:
        cursor.executemany("""
            INSERT INTO Listing (judul, harga, kamarTidur, kamarMandi, totalKamar,
                luasBangunan, luasTanah, hargaPerM2Bangun, hargaPerM2Tanah,
                area, kota, kecamatan, lokasi, urlProperti, gambar, segmen)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, batch)
        listing_count += len(batch)

conn.commit()
print(f"  {listing_count} listings inserted")

# ---- Verify all tables
print("\n--- Verification ---")
for table in ["Listing", "Kecamatan", "Fasilitas", "Stasiun", "GerbangTol"]:
    cursor.execute(f"SELECT COUNT(*) FROM {table}")
    print(f"  {table}: {cursor.fetchone()[0]} rows")

cursor.execute("""
    SELECT kecamatan, COUNT(*) as cnt FROM Listing
    GROUP BY kecamatan ORDER BY cnt DESC LIMIT 5
""")
print("\nTop 5 kecamatan by listings:")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1]}")

conn.close()
print("\nDone! Database seeded successfully.")
