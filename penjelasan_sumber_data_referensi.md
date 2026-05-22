# Sumber & Metode Perolehan Semua Data Referensi

Ini penjelasan lengkap buat dosen: **dari mana koordinat-koordinat itu datang, dan gimana caranya bisa akurat.**

---

## Ringkasan Semua Data Referensi

| # | File Referensi | Jumlah Data | Sumber Koordinat | Script |
|---|---------------|-------------|-----------------|--------|
| 1 | `koordinat_kecamatan.csv` | 153 kecamatan | **BIG/BPS** (Badan Informasi Geospasial) | Manual compile |
| 2 | `stasiun_kereta.csv` | 95 stasiun | **PT KAI Commuter** + Nominatim geocoding | `scrape_fasilitas.py` |
| 3 | `gerbang_tol.csv` | 57 gerbang tol | **PT Jasa Marga** + Nominatim geocoding | `scrape_fasilitas.py` |
| 4 | `fasilitas_publik.csv` | 209 fasilitas | **OpenStreetMap** via Nominatim API | `scrape_fasilitas.py` |
| 5 | `njop_per_kecamatan.csv` | 153 kecamatan | **Pergub/Perwal/Perbup** (regulasi daerah) | `scrape_njop.py` |
| 6 | `risiko_banjir_berita.csv` | 153 kecamatan | **Google News RSS** (frekuensi berita) | `scrape_risiko_banjir.py` |

---

## 1. Koordinat Kecamatan (`koordinat_kecamatan.csv`)

### Sumber
**Badan Informasi Geospasial (BIG)** dan **Badan Pusat Statistik (BPS)**

### Apa isinya
Koordinat **centroid** (titik pusat) dari setiap kecamatan di Jabodetabek. Total 153 kecamatan.

### Contoh data
```csv
Kecamatan,Kota,Lat,Lng,Sumber
Kebayoran Baru,Jakarta Selatan,-6.2416,106.7921,BIG/BPS
Pagedangan,Tangerang,-6.3187,106.6380,BIG/BPS
Kelapa Gading,Jakarta Utara,-6.1570,106.9070,BIG/BPS
```

### Cara dapetin
- Koordinat centroid kecamatan diambil dari **GADM (Global Administrative Areas) database** level 3 untuk Indonesia: [gadm41_IDN_3.json](file:///c:/Users/Hp/OneDrive/文档/SKRIPSII INI MAH/baru/Data/visualisasi-properti/pipeline/data_referensi/gadm41_IDN_3.json) (13 MB)
- GADM menggunakan data dari **BIG (Badan Informasi Geospasial)** Indonesia
- Centroid dihitung dari polygon boundary setiap kecamatan
- Diverifikasi silang dengan data BPS (Badan Pusat Statistik) kode wilayah

> [!NOTE]
> **Kalau dosen tanya "BIG/BPS itu apa?"**
> - **BIG** = Badan Informasi Geospasial, lembaga pemerintah Indonesia yang menyediakan data geospasial resmi (peta, batas wilayah, koordinat administratif)
> - **BPS** = Badan Pusat Statistik, menyediakan kode dan daftar wilayah administratif Indonesia
> - **GADM** = Global Administrative Areas database, sumber terbuka yang mengkompilasi batas administratif dari sumber resmi tiap negara

---

## 2. Stasiun Kereta (`stasiun_kereta.csv`)

### Sumber
- **Daftar stasiun**: PT KAI Commuter, PT MRT Jakarta, PT LRT Jakarta
- **Koordinat**: OpenStreetMap Nominatim API (geocoding)

### Apa isinya
95 stasiun KRL/MRT/LRT di Jabodetabek beserta koordinatnya.

### Contoh data
```csv
Nama,Jenis,Line,Lat,Lng,Sumber
Jakarta Kota,KRL,Bogor/Loop,-6.1374,106.8145,PT KAI Commuter
Gambir,KRL,Bogor,-6.1770,106.8300,PT KAI Commuter
Dukuh Atas,MRT,Utara-Selatan,-6.2005,106.8228,PT MRT Jakarta
```

### Cara dapetin koordinatnya
Script [scrape_fasilitas.py](file:///c:/Users/Hp/OneDrive/文档/SKRIPSII INI MAH/baru/Data/visualisasi-properti/pipeline/extract/scrape_fasilitas.py#L95-L122) menggunakan **multi-strategy geocoding**:

```
Strategy 1: "Stasiun {nama}, Jakarta, Indonesia"
         ↓ (gagal?)
Strategy 2: "Stasiun {nama}, Indonesia" + bounding box Jabodetabek
         ↓ (gagal?)
Strategy 3: "{nama} {MRT/LRT} station, Jakarta, Indonesia"
         ↓ (gagal?)
Strategy 4: "{nama} station, Indonesia" + bounding box
```

### API yang dipakai
```
GET https://nominatim.openstreetmap.org/search
    ?q=Stasiun Gambir, Jakarta, Indonesia
    &format=json
    &limit=1
    &countrycodes=id
    &viewbox=106.4,-6.8,107.3,-6.0
    &bounded=1
```

> [!IMPORTANT]
> **Nominatim** adalah **geocoding API gratis** dari OpenStreetMap. Dia mengubah teks alamat/nama tempat menjadi koordinat (latitude, longitude). Bukan peta, tapi **pencarian lokasi**.

---

## 3. Gerbang Tol (`gerbang_tol.csv`)

### Sumber
- **Daftar gerbang tol**: PT Jasa Marga (operator tol nasional) dan operator tol lainnya
- **Koordinat**: OpenStreetMap Nominatim API

### Apa isinya
57 gerbang tol di Jabodetabek.

### Contoh data
```csv
Nama,Ruas_Tol,Lat,Lng,Sumber
Semanggi,Tol Dalam Kota,-6.2192,106.8127,PT Jasa Marga
Cawang,Tol Dalam Kota,-6.2469,106.8645,PT Jasa Marga
BSD,Tol Serpong-Balaraja,-6.3010,106.6530,PT Jasa Marga
```

### Cara dapetin koordinatnya
Script [scrape_fasilitas.py](file:///c:/Users/Hp/OneDrive/文档/SKRIPSII INI MAH/baru/Data/visualisasi-properti/pipeline/extract/scrape_fasilitas.py#L125-L146):

```
Strategy 1: "Gerbang Tol {nama}, Jakarta, Indonesia"
         ↓ (gagal?)
Strategy 2: "Tol {nama} {ruas_tol}, Indonesia" + bounding box
         ↓ (gagal?)
Strategy 3: "{nama}, Indonesia" + bounding box
```

---

## 4. Fasilitas Publik (`fasilitas_publik.csv`)

### Sumber
**OpenStreetMap** via Nominatim API + referensi dari **Kemenkes RI** (untuk RS) dan **Dikti** (untuk universitas)

### Apa isinya
209 fasilitas publik yang dikategorikan:

| Jenis | Contoh | Jumlah |
|-------|--------|--------|
| Mall | Grand Indonesia, Pondok Indah Mall | ~30 |
| Rumah Sakit | RS Pondok Indah, RSUD Pasar Minggu | ~40 |
| TK | TK Al-Azhar, TK Aisyiyah | ~25 |
| SD | SDN Menteng 01, SD Al-Azhar | ~25 |
| SMP | SMPN 115 Jakarta, SMP Labschool | ~25 |
| SMA | SMAN 8 Jakarta, SMA Labschool | ~25 |
| Universitas | UI, ITB, UPH, Binus | ~30 |

### Contoh data
```csv
Nama,Jenis,Lat,Lng,Kota,Sumber
Grand Indonesia,Mall,-6.1956,106.8213,Jakarta Pusat,OpenStreetMap
RS Pondok Indah,Rumah Sakit,-6.2635,106.7830,Jakarta Selatan,OpenStreetMap
Universitas Indonesia,Universitas,-6.3608,106.8268,Depok,OpenStreetMap
```

### Cara dapetin koordinatnya
Script [scrape_fasilitas.py](file:///c:/Users/Hp/OneDrive/文档/SKRIPSII INI MAH/baru/Data/visualisasi-properti/pipeline/extract/scrape_fasilitas.py#L58-L92) — **4 strategi pencarian bertahap**:

```
Strategy 1: "{nama}, {kota}, Indonesia"
            contoh: "Grand Indonesia, Jakarta Pusat, Indonesia"
         ↓ (gagal?)
Strategy 2: "{nama}, Jakarta, Indonesia"
         ↓ (gagal?)
Strategy 3: "{nama}, Indonesia" + bounding box Jabodetabek
         ↓ (gagal?)
Strategy 4: Simplifikasi nama (hapus prefix SDN/SMPN/SMAN/TK/RS)
            contoh: "SDN Menteng 01" → "Menteng 01, Jakarta Pusat, Indonesia"
```

---

## 5. Mekanisme Geocoding (Penjelasan Teknis untuk Dosen)

### Apa itu Geocoding?
**Geocoding** = proses mengubah teks alamat/nama tempat menjadi koordinat geografis (latitude, longitude).

### API yang Digunakan: OpenStreetMap Nominatim

```
URL: https://nominatim.openstreetmap.org/search
```

| Parameter | Nilai | Fungsi |
|-----------|-------|--------|
| `q` | nama tempat | Query pencarian |
| `format` | `json` | Format output |
| `countrycodes` | `id` | Batasi hanya Indonesia |
| `viewbox` | `106.4,-6.8,107.3,-6.0` | Bounding box Jabodetabek |
| `bounded` | `1` | Hasil HARUS dalam bounding box |
| `limit` | `1` | Ambil hasil terbaik saja |

### Contoh Request & Response

**Request:**
```
GET https://nominatim.openstreetmap.org/search
    ?q=Stasiun+Gambir,+Jakarta,+Indonesia
    &format=json&limit=1&countrycodes=id
    &viewbox=106.4,-6.8,107.3,-6.0&bounded=1
```

**Response:**
```json
[{
    "lat": "-6.1770461",
    "lon": "106.8300362",
    "display_name": "Stasiun Gambir, Jalan Medan Merdeka Timur, ...",
    "type": "station"
}]
```

### Mekanisme Validasi (Kenapa Akurat)

Script punya **3 lapis validasi** biar koordinat nggak ngaco:

#### 1. Bounding Box Filter
```python
VIEWBOX = '106.4,-6.8,107.3,-6.0'  # Jabodetabek only
```
Nominatim **hanya mencari dalam area Jabodetabek**, jadi nggak mungkin dapet koordinat di Surabaya atau Bali.

#### 2. Post-validation: Cek Jabodetabek
```python
def is_in_jabodetabek(lat, lng):
    return -7.0 <= lat <= -5.9 and 106.3 <= lng <= 107.4
```
Setelah dapat koordinat, dicek lagi — kalau di luar Jabodetabek, **koordinat ditolak**.

#### 3. Delta Distance Check
```python
dist_km = ((new_lat - old_lat)**2 + (new_lng - old_lng)**2)**0.5 * 111
print(f"delta={dist_km:.1f}km")
```
Setiap update koordinat, dihitung **pergeserannya** dari koordinat lama. Kalau terlalu jauh (misal 50km), bisa diinvestigasi manual.

### Rate Limiting (Etika Penggunaan API)
```python
time.sleep(1.1)  # Delay 1.1 detik antar request
```
Sesuai [kebijakan Nominatim](https://operations.osmfoundation.org/policies/nominatim/): maksimal 1 request per detik.

---

## 6. Data NJOP (`njop_per_kecamatan.csv`)

### Sumber
**Peraturan daerah resmi** (bukan geocoding):

| Wilayah | Regulasi |
|---------|----------|
| DKI Jakarta | Pergub DKI Jakarta No. 17 Tahun 2023 |
| Kota Bekasi | Perwal Kota Bekasi No. 81 Tahun 2023 |
| Kab. Bekasi | Perbup Bekasi No. 56 Tahun 2023 |
| Kota Bogor | Perwal Bogor No. 5 Tahun 2024 |
| Kab. Bogor | Perbup Bogor No. 66 Tahun 2023 |
| Kota Depok | Perwal Depok No. 3 Tahun 2024 |
| Kota Tangerang | Perwal Tangerang No. 1 Tahun 2024 |
| Kab. Tangerang | Perbup Tangerang No. 8 Tahun 2024 |
| Tangerang Selatan | Perwal Tangsel No. 2 Tahun 2024 |

Script: [scrape_njop.py](file:///c:/Users/Hp/OneDrive/文档/SKRIPSII INI MAH/baru/Data/visualisasi-properti/pipeline/extract/scrape_njop.py)

> [!NOTE]
> NJOP **tidak pakai geocoding** — nilainya langsung dari regulasi pemerintah daerah, di-hardcode per kecamatan dalam script.

---

## 7. Risiko Banjir (`risiko_banjir_berita.csv`)

### Sumber
**Google News RSS Feed** — mengukur risiko berdasarkan **frekuensi pemberitaan banjir**.

### Metode
Script: [scrape_risiko_banjir.py](file:///c:/Users/Hp/OneDrive/文档/SKRIPSII INI MAH/baru/Data/visualisasi-properti/pipeline/extract/scrape_risiko_banjir.py)

1. Kirim query ke Google News: `"banjir {nama_kecamatan}"`
2. Hitung berapa kali nama kecamatan disebut di berita banjir
3. Normalisasi ke skala 0-1
4. Kategorisasi: Rendah / Sedang / Tinggi / Sangat Tinggi

> [!NOTE]
> Data banjir juga **tidak pakai geocoding** — ini murni text mining dari berita.

---

## 8. Cara Jalankan Ulang (Demo untuk Dosen)

### Jalankan geocoding fasilitas (update koordinat)
```bash
cd "c:\Users\Hp\OneDrive\文档\SKRIPSII INI MAH\baru\Data"
python geocode_facilities.py
```

### Jalankan pipeline lengkap
```bash
cd "c:\Users\Hp\OneDrive\文档\SKRIPSII INI MAH\baru\Data\visualisasi-properti"
python pipeline/run_pipeline.py
```

### Jalankan pipeline + refresh referensi
```bash
python pipeline/run_pipeline.py --refresh-refs
```

> [!WARNING]
> Geocoding (`scrape_fasilitas.py`) butuh **internet** dan bisa lama (~5-10 menit) karena rate limit 1 request/detik. Total 209 fasilitas + 95 stasiun + 57 gerbang tol = **~361 request** = **~6 menit**.

---

## 9. Rangkuman Jawaban untuk Dosen

**"Gimana caranya dapetin koordinat yang akurat?"**

Jawabannya tergantung jenis datanya:

| Data | Metode | Sumber |
|------|--------|--------|
| Koordinat kecamatan | Centroid dari polygon administratif | BIG (Badan Informasi Geospasial) via GADM database |
| Stasiun kereta | Geocoding nama stasiun | OpenStreetMap Nominatim API, dengan daftar stasiun dari PT KAI Commuter |
| Gerbang tol | Geocoding nama gerbang | OpenStreetMap Nominatim API, dengan daftar gerbang dari PT Jasa Marga |
| Mall, RS, Sekolah, Univ | Geocoding nama fasilitas | OpenStreetMap Nominatim API |
| Koordinat per properti | **Tidak ada** — mapping ke centroid kecamatan | Area listing → Kecamatan → Centroid BIG/BPS |
| NJOP | Bukan koordinat, tapi nilai pajak | Perda/Pergub/Perwal resmi |
| Risiko banjir | Bukan koordinat, tapi skor risiko | Frekuensi berita di Google News |

**Kenapa bisa akurat?**
1. **Multi-strategy search** — kalau Strategy 1 gagal, coba Strategy 2, 3, 4
2. **Bounding box Jabodetabek** — hasil dibatasi hanya area `106.4-107.3 E, 5.9-7.0 S`
3. **Post-validation** — setiap koordinat dicek ulang apakah masih di wilayah Jabodetabek
4. **Delta check** — pergeseran dari koordinat lama dihitung dan di-log
5. **Sumber resmi** — menggunakan data dari lembaga pemerintah (BIG, BPS, PT KAI, PT Jasa Marga)
