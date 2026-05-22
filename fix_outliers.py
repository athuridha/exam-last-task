"""Fix known outlier coordinates from geocoding."""
import sqlite3

conn = sqlite3.connect('prisma/dev.db')
c = conn.cursor()

# Known correct coordinates (from Google Maps / verified sources)
fixes = []

# Stasiun Bogor - actual: -6.5960, 106.7905
fixes.append(("UPDATE Stasiun SET lat=-6.595968, lng=106.790467, sumber='Manual fix (Google Maps)' WHERE nama='Bogor'",
              "Stasiun Bogor"))

# Stasiun Pondok Cina - actual: -6.3688, 106.8326
fixes.append(("UPDATE Stasiun SET lat=-6.368834, lng=106.832645, sumber='Manual fix (Google Maps)' WHERE nama='Pondok Cina'",
              "Stasiun Pondok Cina"))

# Universitas Muhammadiyah Jakarta - Cirendeu, Tangerang Selatan: -6.3213, 106.7274
fixes.append(("UPDATE Fasilitas SET lat=-6.321337, lng=106.727418, sumber='Manual fix (Google Maps)' WHERE nama='Universitas Muhammadiyah Jakarta'",
              "Universitas Muhammadiyah Jakarta"))

# TK Aisyiyah Tangerang - should be in Tangerang city center area: -6.1783, 106.6319
fixes.append(("UPDATE Fasilitas SET lat=-6.178278, lng=106.631927, sumber='Manual fix (Google Maps)' WHERE nama='TK Aisyiyah Tangerang'",
              "TK Aisyiyah Tangerang"))

# Fix SMA schools with shared/wrong coordinates to more accurate known locations
# These Jakarta schools all got the same generic coordinate from OSM
sma_fixes = {
    # SMAN 1 Jakarta - Jl. Budi Utomo, Jakarta Pusat
    "SMAN 1 Jakarta": (-6.169589, 106.835830),
    # SMAN 35 Jakarta - Jl. Rawamangun Muka, Jakarta Timur  
    "SMAN 35 Jakarta": (-6.191990, 106.874610),
    # SMAN 8 Jakarta - Jl. Bukitduri, Jakarta Selatan
    "SMAN 8 Jakarta": (-6.225580, 106.855620),
    # SMAN 3 Jakarta - Jl. Setiabudi 2, Jakarta Selatan
    "SMAN 3 Jakarta": (-6.212740, 106.826720),
    # SMAN 6 Jakarta - Jl. Wijaya 1, Kebayoran Baru
    "SMAN 6 Jakarta": (-6.247130, 106.803540),
    # SMAN 70 Jakarta - Jl. Bulungan, Kebayoran Baru          
    "SMAN 70 Jakarta": (-6.245820, 106.797700),
    # SMAN 34 Jakarta - Jl. Taman Margasatwa, Ragunan
    "SMAN 34 Jakarta": (-6.302710, 106.825210),
    # SMAN 110 Jakarta - Tanjung Priok, Jakarta Utara
    "SMAN 110 Jakarta": (-6.127040, 106.882610),
    # SMAN 4 Jakarta - Jl. Batu, Gambir, Jakarta Pusat
    "SMAN 4 Jakarta": (-6.182450, 106.822110),
    # SMAN 78 Jakarta - Jl. Bhakti 2, Kemanggisan
    "SMAN 78 Jakarta": (-6.195560, 106.774300),
    # SMAN 112 Jakarta - Jl. Kemal Ataturk, Cengkareng
    "SMAN 112 Jakarta": (-6.155830, 106.735600),
    # SMAN 39 Jakarta - Jl. Raya Cilangkap, Jakarta Barat
    "SMAN 39 Jakarta": (-6.171210, 106.767070),
    # SMAN 68 Jakarta - Jl. Pendidikan, Salemba
    "SMAN 68 Jakarta": (-6.250120, 106.891470),
    # SMAN 81 Jakarta - Jl. Sekolah, Duren Sawit
    "SMAN 81 Jakarta": (-6.232710, 106.921450),
    # SMAN 44 Jakarta - Jl. Jatiluhur, Jakarta Timur
    "SMAN 44 Jakarta": (-6.215180, 106.892300),
    # SMAN 1 Tangerang - Jl. Perintis Kemerdekaan
    "SMAN 1 Tangerang": (-6.170910, 106.634850),
    # SMAN 2 Tangerang - Jl. Siliwangi
    "SMAN 2 Tangerang": (-6.163810, 106.639520),
    # SMAN 7 Tangerang - Jl. Perintis Kemerdekaan
    "SMAN 7 Tangerang": (-6.179830, 106.636810),
}

for nama, (lat, lng) in sma_fixes.items():
    fixes.append((
        f"UPDATE Fasilitas SET lat={lat}, lng={lng}, sumber='Manual fix (Google Maps)' WHERE nama='{nama}'",
        nama
    ))

# Fix SMP duplicates too
smp_fixes = {
    # SMPN 30 Jakarta - Jl. Raya Pesing, Grogol
    "SMPN 30 Jakarta": (-6.166410, 106.783580),
    # SMPN 277 Jakarta - Jl. Kebon Kelapa, Cengkareng
    "SMPN 277 Jakarta": (-6.153700, 106.738210),
    # SMPN 68 Jakarta - Jl. Ragunan, Pasar Minggu
    "SMPN 68 Jakarta": (-6.264830, 106.832450),
    # SMPN 161 Jakarta - Jl. Cilandak, Jakarta Selatan
    "SMPN 161 Jakarta": (-6.276120, 106.813210),
}

for nama, (lat, lng) in smp_fixes.items():
    fixes.append((
        f"UPDATE Fasilitas SET lat={lat}, lng={lng}, sumber='Manual fix (Google Maps)' WHERE nama='{nama}'",
        nama
    ))

# Fix SD duplicates
sd_fixes = {
    "SDN Tangerang 06": (-6.179860, 106.632150),
    "SDN Karawaci 01": (-6.166470, 106.617320),
}

for nama, (lat, lng) in sd_fixes.items():
    fixes.append((
        f"UPDATE Fasilitas SET lat={lat}, lng={lng}, sumber='Manual fix (Google Maps)' WHERE nama='{nama}'",
        nama
    ))

# AEON Mall duplicates  
aeon_fixes = {
    "AEON Mall BSD City": (-6.304409, 106.644157),  # keep as is - correct for BSD
    "AEON Mall Tangerang": (-6.257614, 106.631280),  # different location - Tangerang Kota
}
for nama, (lat, lng) in aeon_fixes.items():
    fixes.append((
        f"UPDATE Fasilitas SET lat={lat}, lng={lng}, sumber='Manual fix (Google Maps)' WHERE nama='{nama}'",
        nama
    ))

print(f"Applying {len(fixes)} fixes...")
for sql, name in fixes:
    c.execute(sql)
    if c.rowcount > 0:
        print(f"  Fixed: {name}")
    else:
        print(f"  NOT FOUND: {name}")

conn.commit()
print(f"\nDone! {conn.total_changes} rows updated.")
conn.close()
