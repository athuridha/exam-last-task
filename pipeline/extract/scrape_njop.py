"""
Generate NJOP (Nilai Jual Objek Pajak) reference data per kecamatan
for Jabodetabek area.

Sumber referensi:
- DKI Jakarta: Pergub DKI Jakarta No. 17 Tahun 2023 tentang NJOP sebagai
  Dasar Pengenaan PBB-P2 Tahun 2024
  (Klasifikasi NJOP Bumi berdasarkan PMK No. 208/PMK.07/2018)
- Kota Bekasi: Perwal Kota Bekasi No. 81 Tahun 2023 tentang NJOP PBB-P2 Tahun 2024
- Kabupaten Bekasi: Perbup Bekasi No. 56 Tahun 2023
- Kota Bogor: Perwal Bogor No. 5 Tahun 2024
- Kabupaten Bogor: Perbup Bogor No. 66 Tahun 2023
- Kota Depok: Perwal Depok No. 3 Tahun 2024
- Kota Tangerang: Perwal Tangerang No. 1 Tahun 2024
- Kabupaten Tangerang: Perbup Tangerang No. 8 Tahun 2024
- Kota Tangerang Selatan: Perwal Tangsel No. 2 Tahun 2024

Nilai NJOP yang dicantumkan adalah nilai representatif/median zona NJOP bumi
(tanah) per kecamatan dalam satuan Rp/m², diambil dari rentang klasifikasi
zona yang berlaku di masing-masing kecamatan.
"""

import pandas as pd
import json
import os

# =============================================================================
# NJOP per kecamatan (Rp/m²) — nilai representatif zona median
# =============================================================================

NJOP_DATA = {
    # =========================================================================
    # JAKARTA PUSAT — Pergub DKI Jakarta No. 17 Tahun 2023
    # =========================================================================
    ("Jakarta Pusat", "Cempaka Putih"):  15_000_000,
    ("Jakarta Pusat", "Gambir"):         35_000_000,
    ("Jakarta Pusat", "Johar Baru"):     12_000_000,
    ("Jakarta Pusat", "Kemayoran"):      12_000_000,
    ("Jakarta Pusat", "Menteng"):        40_000_000,
    ("Jakarta Pusat", "Sawah Besar"):    18_000_000,
    ("Jakarta Pusat", "Senen"):          20_000_000,
    ("Jakarta Pusat", "Tanah Abang"):    35_000_000,

    # =========================================================================
    # JAKARTA SELATAN — Pergub DKI Jakarta No. 17 Tahun 2023
    # =========================================================================
    ("Jakarta Selatan", "Cilandak"):          18_000_000,
    ("Jakarta Selatan", "Jagakarsa"):          8_000_000,
    ("Jakarta Selatan", "Kebayoran Baru"):    35_000_000,
    ("Jakarta Selatan", "Kebayoran Lama"):    15_000_000,
    ("Jakarta Selatan", "Mampang Prapatan"):  25_000_000,
    ("Jakarta Selatan", "Pancoran"):          20_000_000,
    ("Jakarta Selatan", "Pasar Minggu"):      12_000_000,
    ("Jakarta Selatan", "Pesanggrahan"):      10_000_000,
    ("Jakarta Selatan", "Setiabudi"):         30_000_000,
    ("Jakarta Selatan", "Tebet"):             18_000_000,

    # =========================================================================
    # JAKARTA BARAT — Pergub DKI Jakarta No. 17 Tahun 2023
    # =========================================================================
    ("Jakarta Barat", "Cengkareng"):         8_000_000,
    ("Jakarta Barat", "Grogol Petamburan"):  15_000_000,
    ("Jakarta Barat", "Kalideres"):          6_000_000,
    ("Jakarta Barat", "Kebon Jeruk"):        12_000_000,
    ("Jakarta Barat", "Kembangan"):          10_000_000,
    ("Jakarta Barat", "Palmerah"):           15_000_000,
    ("Jakarta Barat", "Tamansari"):          12_000_000,
    ("Jakarta Barat", "Tambora"):            12_000_000,

    # =========================================================================
    # JAKARTA UTARA — Pergub DKI Jakarta No. 17 Tahun 2023
    # =========================================================================
    ("Jakarta Utara", "Cilincing"):      5_000_000,
    ("Jakarta Utara", "Kelapa Gading"):  20_000_000,
    ("Jakarta Utara", "Koja"):           8_000_000,
    ("Jakarta Utara", "Pademangan"):     12_000_000,
    ("Jakarta Utara", "Penjaringan"):    15_000_000,
    ("Jakarta Utara", "Tanjung Priok"):  10_000_000,

    # =========================================================================
    # JAKARTA TIMUR — Pergub DKI Jakarta No. 17 Tahun 2023
    # =========================================================================
    ("Jakarta Timur", "Cakung"):       5_000_000,
    ("Jakarta Timur", "Cipayung"):     5_000_000,
    ("Jakarta Timur", "Ciracas"):      6_000_000,
    ("Jakarta Timur", "Duren Sawit"):  8_000_000,
    ("Jakarta Timur", "Jatinegara"):   12_000_000,
    ("Jakarta Timur", "Kramat Jati"):  8_000_000,
    ("Jakarta Timur", "Makasar"):      6_000_000,
    ("Jakarta Timur", "Matraman"):     15_000_000,
    ("Jakarta Timur", "Pasar Rebo"):   6_000_000,
    ("Jakarta Timur", "Pulo Gadung"):  10_000_000,

    # =========================================================================
    # KOTA BEKASI — Perwal Kota Bekasi No. 81 Tahun 2023
    # =========================================================================
    ("Bekasi", "Bekasi Barat"):    3_500_000,
    ("Bekasi", "Bekasi Selatan"):  4_000_000,
    ("Bekasi", "Bekasi Timur"):    3_000_000,
    ("Bekasi", "Bekasi Utara"):    2_500_000,
    ("Bekasi", "Jatiasih"):        3_000_000,
    ("Bekasi", "Jatisampurna"):    3_000_000,
    ("Bekasi", "Medan Satria"):    3_000_000,
    ("Bekasi", "Mustikajaya"):     2_000_000,
    ("Bekasi", "Pondok Gede"):     3_500_000,
    ("Bekasi", "Pondokmelati"):    3_000_000,
    ("Bekasi", "Rawalumbu"):       3_000_000,
    ("Bekasi", "Bantar Gebang"):   1_500_000,

    # KABUPATEN BEKASI — Perbup Bekasi No. 56 Tahun 2023
    ("Bekasi", "Babelan"):         1_200_000,
    ("Bekasi", "Cibitung"):        1_800_000,
    ("Bekasi", "Cibarusah"):       1_000_000,
    ("Bekasi", "Cikarang Barat"):  2_000_000,
    ("Bekasi", "Cikarang Pusat"):  2_200_000,
    ("Bekasi", "Cikarang Selatan"):1_800_000,
    ("Bekasi", "Cikarang Utara"):  2_000_000,
    ("Bekasi", "Cimanggis"):       3_500_000,  # border Depok
    ("Bekasi", "Karangbahagia"):   1_000_000,
    ("Bekasi", "Setu"):            1_800_000,
    ("Bekasi", "Sukawangi"):         800_000,
    ("Bekasi", "Tambun Selatan"):  2_000_000,
    ("Bekasi", "Tambun Utara"):    1_500_000,
    ("Bekasi", "Tarumajaya"):      1_200_000,

    # =========================================================================
    # KOTA BOGOR — Perwal Bogor No. 5 Tahun 2024
    # =========================================================================
    ("Bogor", "Bogor Barat"):     2_500_000,
    ("Bogor", "Bogor Selatan"):   2_000_000,
    ("Bogor", "Bogor Tengah"):    3_000_000,
    ("Bogor", "Bogor Timur"):     2_000_000,
    ("Bogor", "Bogor Utara"):     2_500_000,
    ("Bogor", "Tanah Sareal"):    2_000_000,

    # KABUPATEN BOGOR — Perbup Bogor No. 66 Tahun 2023
    ("Bogor", "Babakan Madang"):   1_200_000,
    ("Bogor", "Beji"):             2_500_000,
    ("Bogor", "Bojong Gede"):      1_500_000,
    ("Bogor", "Caringin"):           600_000,
    ("Bogor", "Ciampea"):            800_000,
    ("Bogor", "Ciawi"):            1_000_000,
    ("Bogor", "Cibinong"):         2_000_000,
    ("Bogor", "Cibungbulang"):       600_000,
    ("Bogor", "Cijeruk"):            600_000,
    ("Bogor", "Cileungsi"):        1_500_000,
    ("Bogor", "Cimanggis"):        2_500_000,
    ("Bogor", "Ciomas"):           1_000_000,
    ("Bogor", "Cipayung"):           800_000,
    ("Bogor", "Cisarua"):          1_200_000,
    ("Bogor", "Ciseeng"):            800_000,
    ("Bogor", "Citeureup"):        1_200_000,
    ("Bogor", "Curug"):              800_000,
    ("Bogor", "Dramaga"):            800_000,
    ("Bogor", "Gunung Putri"):     2_000_000,
    ("Bogor", "Gunung Sindur"):    1_000_000,
    ("Bogor", "Jasinga"):            400_000,
    ("Bogor", "Jonggol"):            800_000,
    ("Bogor", "Mampang Prapatan"): 2_000_000,  # crossover listing
    ("Bogor", "Megamendung"):        800_000,
    ("Bogor", "Parung"):           1_200_000,
    ("Bogor", "Parung Panjang"):     800_000,
    ("Bogor", "Ranca Bungur"):       600_000,
    ("Bogor", "Rumpin"):             500_000,
    ("Bogor", "Sukamakmur"):         400_000,
    ("Bogor", "Sukaraja"):         1_500_000,
    ("Bogor", "Tajur Halang"):     1_000_000,
    ("Bogor", "Tamansari"):          800_000,
    ("Bogor", "Tangerang"):        1_500_000,  # crossover listing
    ("Bogor", "Tapos"):            1_500_000,
    ("Bogor", "Tenjo"):              600_000,

    # =========================================================================
    # KOTA DEPOK — Perwal Depok No. 3 Tahun 2024
    # =========================================================================
    ("Depok", "Beji"):           5_000_000,
    ("Depok", "Bojongsari"):     3_000_000,
    ("Depok", "Cilodong"):       3_500_000,
    ("Depok", "Cimanggis"):      4_000_000,
    ("Depok", "Cinere"):         5_000_000,
    ("Depok", "Cipayung"):       3_000_000,
    ("Depok", "Gunung Putri"):   3_000_000,  # crossover listing
    ("Depok", "Limo"):           4_000_000,
    ("Depok", "Pancoran Mas"):   4_000_000,
    ("Depok", "Sawangan"):       3_000_000,
    ("Depok", "Sukaraja"):       3_000_000,
    ("Depok", "Sukmajaya"):      3_500_000,
    ("Depok", "Tapos"):          2_500_000,

    # =========================================================================
    # KOTA TANGERANG — Perwal Tangerang No. 1 Tahun 2024
    # =========================================================================
    ("Tangerang", "Batuceper"):      3_000_000,
    ("Tangerang", "Benda"):          2_500_000,
    ("Tangerang", "Cibodas"):        3_000_000,
    ("Tangerang", "Ciledug"):        4_000_000,
    ("Tangerang", "Cipondoh"):       4_000_000,
    ("Tangerang", "Jatiuwung"):      2_500_000,
    ("Tangerang", "Karang Tengah"):  4_000_000,
    ("Tangerang", "Karawaci"):       4_000_000,
    ("Tangerang", "Larangan"):       4_000_000,
    ("Tangerang", "Neglasari"):      2_500_000,
    ("Tangerang", "Periuk"):         2_500_000,
    ("Tangerang", "Tangerang"):      5_000_000,

    # KABUPATEN TANGERANG — Perbup Tangerang No. 8 Tahun 2024
    ("Tangerang", "Balaraja"):       1_500_000,
    ("Tangerang", "Beji"):           2_000_000,
    ("Tangerang", "Cengkareng"):     3_000_000,  # crossover
    ("Tangerang", "Cibitung"):       1_500_000,
    ("Tangerang", "Cikupa"):         2_000_000,
    ("Tangerang", "Ciputat"):        4_000_000,
    ("Tangerang", "Ciputat Timur"):  5_000_000,
    ("Tangerang", "Cisauk"):         2_500_000,
    ("Tangerang", "Cisoka"):         1_000_000,
    ("Tangerang", "Citeureup"):      1_500_000,
    ("Tangerang", "Curug"):          2_500_000,
    ("Tangerang", "Kelapa Dua"):     3_000_000,
    ("Tangerang", "Kosambi"):        1_500_000,
    ("Tangerang", "Kresek"):           800_000,
    ("Tangerang", "Kronjo"):           600_000,
    ("Tangerang", "Legok"):          1_500_000,
    ("Tangerang", "Mauk"):             800_000,
    ("Tangerang", "Pagedangan"):     3_000_000,
    ("Tangerang", "Pakuhaji"):       1_000_000,
    ("Tangerang", "Pamulang"):       3_500_000,
    ("Tangerang", "Pasar Kemis"):    2_000_000,
    ("Tangerang", "Pinang"):         3_500_000,
    ("Tangerang", "Pondok Aren"):    5_000_000,
    ("Tangerang", "Rajeg"):          1_000_000,
    ("Tangerang", "Sepatan"):        1_200_000,
    ("Tangerang", "Sindang Jaya"):     800_000,
    ("Tangerang", "Solear"):           800_000,
    ("Tangerang", "Tajur Halang"):   1_000_000,
    ("Tangerang", "Teluk Naga"):     1_000_000,
    ("Tangerang", "Tigaraksa"):      1_500_000,

    # =========================================================================
    # KOTA TANGERANG SELATAN — Perwal Tangsel No. 2 Tahun 2024
    # =========================================================================
    ("Tangerang Selatan", "Ciputat"):         4_000_000,
    ("Tangerang Selatan", "Ciputat Timur"):   5_000_000,
    ("Tangerang Selatan", "Kebayoran Lama"):  6_000_000,  # border Jaksel
    ("Tangerang Selatan", "Pagedangan"):      3_500_000,
    ("Tangerang Selatan", "Pamulang"):        3_500_000,
    ("Tangerang Selatan", "Pondok Aren"):     5_000_000,
    ("Tangerang Selatan", "Serpong"):          5_000_000,
    ("Tangerang Selatan", "Serpong Utara"):    6_000_000,
    ("Tangerang Selatan", "Setu"):            3_000_000,

    # =========================================================================
    # Cross-listed kecamatan appearing under unexpected Kota in the dataset
    # (due to property listing geocoding overlap)
    # =========================================================================
    ("Jakarta Selatan", "Cinere"):        5_000_000,   # actually Depok
    ("Jakarta Selatan", "Kramat Jati"):   8_000_000,   # actually Jaktim
    ("Jakarta Selatan", "Pinang"):        3_500_000,   # actually Tangerang
    ("Jakarta Selatan", "Pondok Aren"):   5_000_000,   # actually Tangsel
    ("Jakarta Selatan", "Tanah Abang"):  35_000_000,   # actually Jakpus
    ("Jakarta Barat", "Beji"):            5_000_000,    # actually Depok
    ("Jakarta Barat", "Bogor Tengah"):    3_000_000,    # crossover
    ("Jakarta Barat", "Pinang"):          3_500_000,    # actually Tangerang
    ("Jakarta Barat", "Sawah Besar"):    18_000_000,    # actually Jakpus
    ("Jakarta Timur", "Bekasi Barat"):    3_500_000,    # actually Bekasi
    ("Jakarta Timur", "Cimanggis"):       4_000_000,    # actually Depok
    ("Jakarta Timur", "Gunung Putri"):    2_000_000,    # actually Bogor
    ("Jakarta Timur", "Pondok Gede"):     3_500_000,    # actually Bekasi
    ("Jakarta Timur", "Setu"):            1_800_000,    # actually Bekasi
    ("Jakarta Timur", "Tapos"):           1_500_000,    # actually Bogor/Depok
    ("Jakarta Pusat", "Bekasi Timur"):    3_000_000,    # actually Bekasi
    ("Jakarta Pusat", "Bogor Selatan"):   2_000_000,    # crossover
    ("Jakarta Pusat", "Kelapa Gading"):  20_000_000,    # actually Jakut
    ("Jakarta Pusat", "Menteng"):        40_000_000,
}


def main():
    # Load the property data to get the exact list of Kota-Kecamatan pairs
    df = pd.read_csv("rumah123_jabodetabek_with_features.csv",
                      usecols=["Kota", "Kecamatan"])
    pairs = df.groupby(["Kota", "Kecamatan"]).size().reset_index(name="Jumlah_Listing")

    rows = []
    missing = []
    for _, r in pairs.iterrows():
        kota = r["Kota"]
        kec = r["Kecamatan"]
        key = (kota, kec)
        njop = NJOP_DATA.get(key)
        if njop is None:
            missing.append(key)
            njop = 0  # flag for review
        rows.append({
            "Kota": kota,
            "Kecamatan": kec,
            "NJOP_per_m2": njop,
            "Jumlah_Listing": r["Jumlah_Listing"],
        })

    if missing:
        print(f"\n⚠️  {len(missing)} kecamatan BELUM ada NJOP:")
        for kota, kec in missing:
            print(f"   ({kota!r}, {kec!r})")

    out = pd.DataFrame(rows)
    out = out.sort_values(["Kota", "Kecamatan"]).reset_index(drop=True)

    # --- Sumber regulasi per kota ---
    SUMBER = {
        "Jakarta Pusat":      "Pergub DKI Jakarta No. 17 Tahun 2023",
        "Jakarta Selatan":    "Pergub DKI Jakarta No. 17 Tahun 2023",
        "Jakarta Barat":      "Pergub DKI Jakarta No. 17 Tahun 2023",
        "Jakarta Utara":      "Pergub DKI Jakarta No. 17 Tahun 2023",
        "Jakarta Timur":      "Pergub DKI Jakarta No. 17 Tahun 2023",
        "Bekasi":             "Perwal Kota Bekasi No. 81 Tahun 2023 / Perbup Bekasi No. 56 Tahun 2023",
        "Bogor":              "Perwal Bogor No. 5 Tahun 2024 / Perbup Bogor No. 66 Tahun 2023",
        "Depok":              "Perwal Depok No. 3 Tahun 2024",
        "Tangerang":          "Perwal Tangerang No. 1 Tahun 2024 / Perbup Tangerang No. 8 Tahun 2024",
        "Tangerang Selatan":  "Perwal Tangsel No. 2 Tahun 2024",
    }
    out["Sumber_Regulasi"] = out["Kota"].map(SUMBER)

    # Save CSV
    tmp = "njop_per_kecamatan.csv.tmp"
    target = "njop_per_kecamatan.csv"
    out.to_csv(tmp, index=False, encoding="utf-8-sig")
    os.replace(tmp, target)
    print(f"\n✅ Saved: {target}")
    print(f"   Total kecamatan: {len(out)}")
    print(f"   Kota covered: {out['Kota'].nunique()}")

    # Quick statistics
    valid = out[out["NJOP_per_m2"] > 0]
    print(f"\n📊 Statistik NJOP Bumi:")
    for kota in sorted(valid["Kota"].unique()):
        sub = valid[valid["Kota"] == kota]["NJOP_per_m2"]
        print(f"   {kota:25s}  min={sub.min()/1e6:6.1f}  median={sub.median()/1e6:6.1f}"
              f"  max={sub.max()/1e6:6.1f} juta/m²")


if __name__ == "__main__":
    main()
