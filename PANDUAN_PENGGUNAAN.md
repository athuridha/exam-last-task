# Panduan Lengkap Penggunaan Sistem Visualisasi dan Analisis Properti Jabodetabek

Panduan komprehensif ini menjelaskan arsitektur sistem, alur pemrosesan data, konfigurasi lingkungan, langkah operasional ETL (Extract, Transform, Load), seeding database relasional bermodel *Star Schema* berbasis PostgreSQL, eksekusi model statistik regresi PLS & validasi unsupervised, hingga panduan lengkap penggunaan antarmuka web dashboard Next.js.

---

## Daftar Isi
1. [Arsitektur & Alur Kerja Sistem](#1-arsitektur--alur-kerja-sistem)
2. [Spesifikasi Sumber Data](#2-spesifikasi-sumber-data)
3. [Prasyarat Sistem (Prerequisites)](#3-prasyarat-sistem-prerequisites)
4. [Struktur Folder Proyek](#4-struktur-folder-proyek)
5. [Langkah 1: Konfigurasi Environment](#langkah-1-konfigurasi-environment)
6. [Langkah 2: Menjalankan Pipeline ETL Python](#langkah-2-menjalankan-pipeline-etl-python)
7. [Langkah 3: Sinkronisasi Skema & Seeding Database (Prisma)](#langkah-3-sinkronisasi-skema--seeding-database-prisma)
8. [Langkah 4: Analisis Statistik & Machine Learning Lanjutan](#langkah-4-analisis-statistik--machine-learning-lanjutan)
9. [Langkah 5: Menjalankan Dashboard Next.js](#langkah-5-menjalankan-dashboard-next.js)
10. [Panduan Pengoperasian Aplikasi Web (User Manual)](#10-panduan-pengoperasian-aplikasi-web-user-manual)
11. [Penjelasan Komponen Visual & Penilaian Analitik](#11-penjelasan-komponen-visual--penilaian-analitik)
12. [Arsitektur & Spesifikasi API Routes (17 Endpoints)](#arsitektur--spesifikasi-api-routes-17-endpoints)
13. [Panduan Pemecahan Masalah (Troubleshooting)](#panduan-pemecahan-masalah-troubleshooting)

---

## 1. Arsitektur & Alur Kerja Sistem

Sistem ini dirancang untuk memetakan deviasi nilai transaksi properti pasar bebas terhadap Nilai Jual Objek Pajak (NJOP) menggunakan pendekatan *Data Warehouse* (Star Schema) dan *Structural Equation Modeling* berbasis *Partial Least Squares* (PLS-SEM). 

```mermaid
graph TD
    A[Sumber Data Raw: Rumah123, OSM, RSS, PERDA] -->|1. Run Pipeline ETL| B[pipeline/run_pipeline.py]
    B -->|Cleaning & Feature Engineering| C[Cleaned CSV & JSON Files]
    C -->|2. Seed Staging Table| D[node prisma/seed_prisma.js]
    D -->|3. Populate Star Schema| E[node prisma/seed_star_schema.js]
    E -->|Database Postgres Cloud| F[(PostgreSQL Database)]
    F -->|4. Run Stats Models| G[python run_full_analysis.py]
    G -->|Update PlsRun, OLS, KMeans| F
    F -->|5. Serve API Routes| H[Next.js API Endpoints]
    H -->|6. Render UI Components| I[Recharts, Leaflet Map & Stats Cards]
```

---

## 2. Spesifikasi Sumber Data

Proses visualisasi properti ini didukung oleh data primer dan sekunder sebagai berikut:
1. **Listing Rumah123** (`rumah123_jabodetabek_cleaned.csv`): Berisi data hasil scraping portal properti sebanyak **31.730 listing** dengan fitur: `Judul`, `Harga`, `Kamar Tidur`, `Kamar Mandi`, `Luas Bangunan (m²)`, `Luas Tanah (m²)`, `Lokasi` (Area, Kota), `URL Properti`, dan `Gambar`.
2. **Koordinat Kecamatan** (`data_referensi/koordinat_kecamatan.csv`): Lintang dan bujur dari 152 kecamatan di Jabodetabek untuk visualisasi spasial.
3. **Fasilitas Publik** (`fasilitas.json`): Data sebaran mal, rumah sakit, sekolah, stasiun KRL/MRT, dan gerbang tol hasil ekstraksi OpenStreetMap API.
4. **Data Risiko Banjir** (`scrape_risiko_banjir.py`): Indeks frekuensi banjir berdasarkan scraping pencarian berita kecamatan pada Google News RSS Feed.
5. **Indeks Kejahatan** (`scrape_risiko_kejahatan.py`): Indeks kriminalitas tingkat kota yang dikompilasi dari Polda Metro Jaya dan scraping berita media lokal.
6. **NJOP Fiskal 2025** (`njop_per_kecamatan.csv` & `njop_jabodetabek_verified_audit.xlsx`): Nilai ketetapan NJOP per m² tingkat kecamatan hasil kompilasi Peraturan Daerah (PERDA).

---

## 3. Prasyarat Sistem (Prerequisites)

Sistem membutuhkan lingkungan berikut untuk berjalan dengan benar:

- **Node.js** (v18.0.0 atau yang lebih baru) & **npm** (v9.0.0+)
- **Python** (v3.9.x s.d. v3.11.x)
- **PostgreSQL** (Postgres 14+ atau server cloud seperti Prisma Postgres)

### Pemasangan Dependensi Python
Jalankan perintah ini di dalam folder `pipeline/`:
```bash
pip install -r requirements.txt
```

### Pemasangan Dependensi Next.js
Jalankan perintah ini di root folder proyek (`visualisasi-properti/`):
```bash
npm install
```

---

## 4. Struktur Folder Proyek

```
visualisasi-properti/
├── app/                       # Next.js App Router (Page & API Routes)
│   ├── api/                   # 17 API Routes Backend Next.js
│   ├── globals.css            # Desain system CSS (Tailwind v4)
│   └── page.tsx               # View utama Dashboard BI
├── components/                # Leaf UI Components (Leaflet Map, Recharts, Filters)
├── pipeline/                  # Data Science Pipeline (Python)
│   ├── analysis/              # Script PLS, OLS, K-Means & DB Saver
│   ├── data/                  # Folder penyimpanan CSV (raw, cleaned, enriched)
│   └── run_pipeline.py        # Orchestrator Pipeline ETL
├── prisma/                    # Konfigurasi ORM Database
│   ├── schema.prisma          # Definisi Relasional & Star Schema
│   └── seed_star_schema.js    # Seeder data warehouse star schema
└── gambar-uji-program/        # Aset gambar panduan visualisasi program
```

![Struktur Direktori Proyek](gambar-uji-program/1_struktur_folder.png)
*Gambar 1: Visualisasi struktur berkas proyek pada editor VS Code.*

---

## Langkah 1: Konfigurasi Environment

Salin kredensial PostgreSQL ke dalam file `.env` di root folder proyek (`visualisasi-properti/`).

```env
# Koneksi Database Utama
DATABASE_URL="postgresql://username:password@db.prisma.io:5432/postgres?sslmode=require"
POSTGRES_URL="postgresql://username:password@db.prisma.io:5432/postgres?sslmode=require"
PRISMA_DATABASE_URL="postgresql://username:password@db.prisma.io:5432/postgres?sslmode=require"
```

---

## Langkah 2: Menjalankan Pipeline ETL Python

Jalankan perintah berikut dari folder root proyek untuk memproses data mentah:
```bash
python pipeline/run_pipeline.py
```

### Kalkulasi Utama Feature Engineering:
- **Jarak Monas (Haversine)**: Mengukur jarak garis lengkung bumi dari koordinat geografis pusat kecamatan ke Monumen Nasional (Monas):
  $$d = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\text{lat}}{2}\right) + \cos(\text{lat}_1)\cos(\text{lat}_2)\sin^2\left(\frac{\Delta\text{lon}}{2}\right)}\right)$$
- **Skor Fasilitas Spasial (0–5)**: Dihitung secara komposit per kecamatan:
  $$\text{Skor} = \min\left(\frac{N_{\text{mall}}}{2}, 1.0\right) + \min(N_{\text{RS}}, 1.0) + \min\left(\frac{\text{Jenjang Pendidikan}}{3}, 1.0\right) + \text{Skor}_{\text{Tol}} + \text{Skor}_{\text{Stasiun}}$$

![Terminal Output Pipeline ETL](gambar-uji-program/2_run_pipeline.png)
*Gambar 2: Proses ETL Python berhasil memproses 31.729 data.*

---

## Langkah 3: Sinkronisasi Skema & Seeding Database (Prisma)

### 1. Mendorong Definisi Schema ke PostgreSQL
```bash
npx prisma db push
```

### 2. Memuat Data Mentah ke Tabel Staging
```bash
node prisma/seed_prisma.js
```

### 3. Transformasi Staging ke Tabel Star Schema
```bash
node prisma/seed_star_schema.js
```
*Tabel fakta `FactHargaRumah` dan tabel dimensi spasial-temporal akan terpopulasi dengan aman (termasuk audit SCD Type 2 pada tabel `DimNJOP` untuk mendeteksi perubahan historis nilai ketetapan pajak).*

![Log Seeder Star Schema](gambar-uji-program/3_seed_star_schema.png)
*Gambar 3: Eksekusi seed_star_schema.js berhasil memuat tabel dimensi spasial-temporal.*

### 4. Memverifikasi Isi Database dengan Prisma Studio
```bash
npx prisma studio
```

![Tampilan Prisma Studio](gambar-uji-program/4_prisma_studio.png)
*Gambar 4: Tampilan Prisma Studio menampilkan record data FactHargaRumah.*

---

## Langkah 4: Analisis Statistik & Machine Learning Lanjutan

Jalankan perintah berikut untuk mengkalibrasi model regresi PLS, komparasi OLS, dan validasi klasterisasi unsupervised:
```bash
python pipeline/analysis/run_full_analysis.py
```
*Skrip ini menghitung VIP scores PLS, melakukan pengujian multikolinearitas OLS (Condition Number), menghitung kerapatan klaster natural K-Means/GMM (Silhouette & ARI), lalu mempersistensi hasilnya ke database Postgres.*

```carousel
![Terminal Output Analisis PLS](gambar-uji-program/5_run_analysis.png)
<!-- slide -->
![Summary Analisis OLS](gambar-uji-program/6_ols_summary.png)
<!-- slide -->
![Metrik Validasi Klastering](gambar-uji-program/7_kmeans_validation.png)
```
*Gambar 5-7: Log eksekusi run_full_analysis.py, detail statistik OLS, dan validasi K-Means & GMM.*

---

## Langkah 5: Menjalankan Dashboard Next.js

Jalankan server pengembangan web Next.js:
```bash
npm run dev
```
Buka browser Anda dan akses: `http://localhost:3000`

---

## 10. Panduan Pengoperasian Aplikasi Web (User Manual)

Bagian ini memandu Anda langkah demi langkah dalam menggunakan antarmuka grafis (UI) sistem visualisasi dashboard.

### Alur Eksplorasi Pengguna (User Flow)
```mermaid
graph LR
    Start([Buka localhost:3000]) --> ViewMap[Peta Interaktif]
    ViewMap --> Filter[Atur Kota/Kecamatan/Segmen]
    Filter --> InteractMap[Klik Kecamatan di Peta]
    InteractMap --> Popup[Baca Info Skor & Detail]
    Popup --> DrillDown[Klik 'Lihat Listing' di Popup]
    DrillDown --> Modal[Tampil Listing Modal]
    Filter --> TabAnalytics[Pindah Tab Analitik]
    TabAnalytics --> ReadCharts[Analisis Grafik & VIP PLS]
    TabAnalytics --> SearchTable[Cari Data di Tabel Properti]
    Start --> TabRisk[Eksplorasi Tab Banjir / Kejahatan / Berita]
```

### Langkah 1: Membuka Aplikasi & Membaca Status Server
1. Buka peramban browser di alamat `http://localhost:3000`.
2. Di pojok kanan atas **Header**, amati panel status:
   - **Indikator Titik Warna**: Hijau menandakan sistem terhubung langsung (*Live*) dengan RSS Feed Google News, Kuning menandakan proses sedang memuat (*Loading*), dan Abu-Abu berarti menggunakan data cadangan lokal (*Statis/Fallback*).
   - **Tombol Refresh**: Klik ikon `Refresh` di samping indikator jika Anda ingin memicu ulang *scraping* berita banjir, kejahatan, dan RSS feeds secara real-time dari internet.
   - **Metadata Info**: Di bawah judul utama, baca jumlah total data properti dan kecamatan terdaftar di database saat ini.

### Langkah 2: Menggunakan Panel Filter Global
Filter ini terletak langsung di bawah kartu KPI pada Tab Peta dan Tab Analitik, berfungsi membatasi data properti yang diolah secara reaktif:
1. **Dropdown Pilih Kota**: Pilih salah satu kota (contoh: "Jakarta Selatan"). Peta akan memfokuskan koordinat ke wilayah kota terpilih, kartu KPI akan memperbarui angkanya, dan tabel properti hanya menampilkan data kota tersebut.
2. **Dropdown Pilih Kecamatan**: Setelah kota dipilih, daftar kecamatan akan secara dinamis membatasi diri hanya pada kecamatan yang berada di dalam kota tersebut. Pilih kecamatan tertentu untuk analisis mikro.
3. **Dropdown Pilih Segmen Harga**: Batasi visualisasi berdasarkan segmentasi nilai rasio:
   - *Rendah* (undervalued, rasio < 1x)
   - *Menengah* (wajar, rasio 1x - < 2x)
   - *Tinggi* (overvalued, rasio 2x - < 3x)
   - *Premium* (sangat mahal, rasio $\ge$ 3x)
4. **Membersihkan Filter**: Untuk mengembalikan data ke keseluruhan Jabodetabek, kembalikan pilihan dropdown ke pilihan kosong ("Pilih Kota/Kecamatan/Segmen").

### Langkah 3: Interaksi dan Navigasi Peta Spasial (Tab "Peta Interaktif")
Tab ini merupakan halaman beranda visualisasi utama.
1. **Menggeser (Panning) & Memperbesar (Zooming)**: Gunakan klik-tahan-tarik pada mouse untuk menggeser peta. Gunakan tombol `+` / `-` di sudut kiri atas peta, atau scroll mouse untuk memperbesar dan memperkecil daerah.
2. **Membaca Gradasi Warna Wilayah (Choropleth)**: 
   - Warna **merah gelap/merah** menunjukkan kecamatan dengan rata-rata rasio Harga/NJOP yang sangat tinggi (Segmen Premium).
   - Warna **kuning/hijau muda** menunjukkan wilayah menengah/wajar.
   - Warna **hijau tua** melambangkan wilayah undervalued (harga pasar relatif murah dibanding baseline NJOP perpajakan).
3. **Mengaktifkan Titik Fasilitas (Layer Control)**: Di pojok kanan atas peta, hover mouse pada ikon layer bertumpuk:
   - Centang **Mall** (titik kuning) untuk menampilkan mal terdekat.
   - Centang **Rumah Sakit** (titik merah) untuk melihat rumah sakit dalam radius.
   - Centang **Stasiun** (titik biru) untuk menampilkan stasiun KRL/MRT.
   - Centang **Gerbang Tol** (titik hijau) untuk melihat infrastruktur jalan bebas hambatan.
4. **Menampilkan Informasi Kecamatan (Popup)**: Klik pada area poligon salah satu kecamatan. Balon informasi (popup) akan muncul menampilkan detail statistik:
   - Rerata harga median, skor fasilitas (skala 0-5), stasiun & gerbang tol terdekat, tingkat risiko banjir, serta NJOP fiskal 2025.
5. **Menelusuri Listing Rumah (Drill-Down)**: Di dalam popup kecamatan, klik tombol biru **"Lihat Listing"**. Sebuah modal dialog window (*ListingPanel*) akan muncul menampilkan seluruh rumah yang diiklankan di kecamatan tersebut beserta gambar, harga, luas tanah/bangunan, dan URL tautan iklan aslinya. Tekan tombol `Tutup` atau tombol `Esc` di keyboard untuk menutup modal.

### Langkah 4: Membaca Statistik Pasar & Bobot Laten (Tab "Analitik")
Klik tombol tab **"Analitik"** pada navigasi atas untuk berpindah halaman.
1. **Grafik Distribusi Segmen**: Grafik lingkaran (Donut Chart) di sebelah kiri menampilkan proporsi pangsa pasar. Hover kursor pada potongan lingkaran untuk melihat jumlah persis listing di tiap segmen.
2. **Grafik Rata-rata Rasio per Kota**: Grafik batang horizontal di sebelah kanan mengurutkan deviasi harga kota dari yang tertinggi (paling mahal terhadap NJOP) ke terendah.
3. **Grafik Top 5 Kecamatan**: Menampilkan kecamatan dengan lonjakan deviasi pasar tertinggi. Wilayah ini menjadi perhatian khusus bagi penilai pajak (fiskal) untuk penyesuaian NJOP baru.
4. **Grafik VIP Scores PLS**: Menampilkan tingkat kepentingan variabel terhadap penentuan rasio harga. 
   - Garis putus-putus merah menandakan batas **threshold signifikansi (VIP = 1.0)**.
   - Balok grafik yang melebihi garis merah tersebut merupakan variabel penentu utama yang memengaruhi deviasi nilai properti.

### Langkah 5: Melakukan Pencarian Data pada Tabel Properti
Tabel interaktif terletak di bagian bawah Tab Analitik dan Tab Peta.
1. **Mencari Kata Kunci (Search Box)**: Ketik nama kecamatan, kota, judul rumah, atau kriteria lain pada kotak input pencarian. Tabel akan menyaring data secara real-time.
2. **Mengurutkan Data (Sorting)**: Klik pada kepala kolom tabel (contoh: klik kolom "Harga" atau "Rasio H/NJOP") untuk mengurutkan data dari terkecil ke terbesar, atau sebaliknya.
3. **Navigasi Halaman (Pagination)**: Gunakan tombol `Sebelumnya` dan `Selanjutnya` di kanan bawah tabel untuk menelusuri data listing.

### Langkah 6: Menganalisis Risiko Lingkungan & Berita (Tab "Banjir", "Kejahatan", & "Berita")
1. **Mengevaluasi Risiko Banjir**: Klik tab **"Risiko Banjir"**. Anda akan disajikan daftar tabel kecamatan di Jabodetabek diurutkan berdasarkan skor risiko banjir (0 hingga 1). 
   - Klik tombol **"Lihat di Peta"** pada salah satu baris kecamatan untuk secara otomatis berpindah ke tab peta interaktif dengan kecamatan tersebut berada di fokus utama.
2. **Mengevaluasi Kriminalitas**: Klik tab **"Risiko Kejahatan"**. Panel ini menampilkan profil kriminalitas per kota beserta rangkuman statistik indeks kejahatan (Aman, Cukup Aman, Rawan, Sangat Rawan). Di bagian kanan, Anda dapat membaca rangkuman berita kejahatan setempat yang diperoleh dari portal media.
3. **Membaca RSS Feeds Berita Terbaru**: Klik tab **"Berita"**. Panel ini mengompilasi berita-berita terbaru yang berkaitan dengan isu banjir dan kriminalitas di wilayah Jabodetabek. Anda dapat mengeklik judul berita untuk dialihkan ke halaman berita eksternal asli.

---

## 11. Penjelasan Komponen Visual & Penilaian Analitik

### 1. Kartu KPI (Key Performance Indicator)
Menyajikan status makro pasar properti saat ini:
- **Total Listing**: Menampilkan volume data listing aktif.
- **Rerata Rasio H/NJOP**: Rata-rata faktor kelipatan harga pasar terhadap NJOP.
- **Median Harga**: Nilai tengah harga rumah untuk menghindari pencemaran rata-rata dari nilai properti yang terlalu ekstrim.
- **Segmen Dominan**: Menunjukkan kelas rasio yang paling banyak menguasai ekosistem listing terfilter.

![Dashboard Utama & KPI](gambar-uji-program/8_dashboard_main.png)
*Gambar 8: Panel atas dashboard menampilkan kartu KPI spasial.*

### 2. Grafik Bobot Analitik
* **Grafik Donat Segmen**: Visualisasi klasifikasi segmen harga wajar hingga premium.
* **Grafik Rasio per Kota**: Bar chart yang menunjukkan kota mana saja yang mengalami pertumbuhan harga pasar paling jauh meninggalkan NJOP fiskal resmi.

```carousel
![Grafik Segmen](gambar-uji-program/9_donut_segmen.png)
<!-- slide -->
![Rasio per Kota](gambar-uji-program/10_rasio_kota.png)
```
*Gambar 9-10: Grafik representasi statistika deskriptif segmentasi dan perbandingan kota.*

* **Top 5 Kecamatan**: Bar chart kecamatan dengan rasio deviasi paling ekstrim.
* **VIP Scores PLS**: Menampilkan pentingnya pengaruh variabel spasial/fisik terhadap deviasi harga. Indikator dengan balok melewati garis merah menandakan variabel tersebut signifikan memengaruhi nilai properti.

```carousel
![Top 5 Kecamatan](gambar-uji-program/11_top_kecamatan.png)
<!-- slide -->
![Grafik VIP PLS](gambar-uji-program/12_vip_scores.png)
```
*Gambar 11-12: Grafik deteksi kecamatan ekstrim dan visualisasi bobot prediktor PLS.*

### 3. Eksplorasi Geospasial
* **Peta Choropleth**: Peta tematik pembagian warna rasio kelipatan harga per wilayah kecamatan.
* **Popup Info**: Detail ringkasan spasial kecamatan hasil klik area poligon peta.
* **Listing Modal**: Daftar properti detail per kecamatan hasil tombol drill-down.

```carousel
![Leaflet Choropleth](gambar-uji-program/14_peta_overview.png)
<!-- slide -->
![Popup Detail](gambar-uji-program/15_peta_popup.png)
<!-- slide -->
![Modal Tabel Properti](gambar-uji-program/16_listing_modal.png)
```
*Gambar 14-16: Antarmuka peta tematik, balon popup informasi, dan jendela modal drill-down properti.*

---

## Arsitektur & Spesifikasi API Routes (17 Endpoints)

Sistem menyajikan data melalui 17 endpoint REST API internal Next.js:

| No | Endpoint Path | Method | Fungsi Utama | Parameter Query |
|----|---------------|--------|--------------|-----------------|
| 1 | `/api/dashboard-stats` | GET | Mengembalikan statistik ringkasan KPI, distribusi segmen, dan rata-rata rasio berdasarkan filter kota/kecamatan/segmen. | `kota`, `kecamatan`, `segmen` |
| 2 | `/api/kecamatan` | GET | Memuat semua data kecamatan beserta skor fasilitas, risiko banjir, dan NJOP. | - |
| 3 | `/api/kecamatan/top` | GET | Mengambil 5 kecamatan teratas dengan rasio Harga/NJOP tertinggi. | - |
| 4 | `/api/kota/komparasi` | GET | Membandingkan rasio Harga/NJOP rata-rata antar kota. | - |
| 5 | `/api/segmen/distribusi` | GET | Memperoleh proporsi empat segmen harga. | `kota` |
| 6 | `/api/pls/bobot` | GET | Mengambil hasil kalkulasi regresi PLS terakhir (VIP Scores, OLS metrics, dan K-Means validation metrics) dari database. | - |
| 7 | `/api/star/segmen` | GET | Mengambil agregasi segmen harga langsung dari tabel fakta star schema `FactHargaRumah`. | - |
| 8 | `/api/star/njop-history` | GET | Mengambil data riwayat historis NJOP per m² dari tabel dimensi SCD2 `DimNJOP`. | `onlyCurrent` (boolean) |
| 9 | `/api/fasilitas` | GET | Mengambil semua titik koordinat fasilitas umum (mall, rs, sekolah). | `kota`, `jenis` |
| 10 | `/api/stasiun` | GET | Mengambil sebaran stasiun kereta KRL/MRT. | - |
| 11 | `/api/gerbang-tol` | GET | Mengambil koordinat gerbang tol terdekat. | - |
| 12 | `/api/listings` | GET | Memuat daftar properti paginasi lengkap untuk tabel. | `page`, `limit`, `search`, `kota`, `kecamatan` |
| 13 | `/api/properti/list` | GET | Mengambil data listing properti spesifik per kecamatan untuk modal popup peta. | `kecamatan` |
| 14 | `/api/summary` | GET | Menghitung total data listing dan kecamatan untuk indikator status server. | - |
| 15 | `/api/scrape-flood` | GET | Menjalankan live scraping RSS Feed berita banjir terbaru. | `kecamatan` |
| 16 | `/api/scrape-crime` | GET | Menjalankan live scraping RSS Feed berita kejahatan. | `kota` |
| 17 | `/api/article-content` | GET | Mengambil konten teks murni dari artikel berita eksternal. | `url` |

### Pengujian Output Endpoint Utama (Respons JSON)

#### 1. Verifikasi Data PLS Live (`/api/pls/bobot`)
* Perintah: `curl http://localhost:3000/api/pls/bobot`
* Tampilan respons JSON:
  ![API Response Bobot PLS](gambar-uji-program/20_api_pls_bobot.png)
  *Gambar 20: Respons JSON dari endpoint API /api/pls/bobot.*

#### 2. Verifikasi SCD Type 2 NJOP (`/api/star/njop-history`)
* Perintah: `curl http://localhost:3000/api/star/njop-history?onlyCurrent=true`
* Tampilan respons JSON:
  ![API Response SCD2 History](gambar-uji-program/21_api_njop_history.png)
  *Gambar 21: Respons JSON riwayat NJOP per kecamatan dari dimensi DimNJOP.*

#### 3. Verifikasi Query Fact Table Star Schema (`/api/star/segmen`)
* Perintah: `curl http://localhost:3000/api/star/segmen`
* Tampilan respons JSON:
  ![API Response Star Schema Segmen](gambar-uji-program/22_api_star_segmen.png)
  *Gambar 22: Respons JSON statistik segmen properti dari Fact Table.*

---

## Panduan Pemecahan Masalah (Troubleshooting)

### 1. Error: "DATABASE_URL tidak ditemukan di .env" saat menjalankan Python Analysis
* **Penyebab**: Script Python tidak dapat membaca path file `.env` karena dieksekusi di luar folder root.
* **Solusi**: Pastikan Anda menjalankan perintah dari root folder `visualisasi-properti/` (bukan dari dalam folder `pipeline/analysis/`).

### 2. Gagal menginstal `psycopg2` pada Python
* **Penyebab**: Kompilasi driver Postgres C membutuhkan dependensi PostgreSQL lokal di komputer.
* **Solusi**: Gunakan package pre-compiled binary dengan menjalankan:
  ```bash
  pip install psycopg2-binary
  ```

### 3. Error: "Prisma Client did not generate yet"
* **Penyebab**: Prisma client belum di-generate untuk arsitektur mesin Anda setelah pemasangan package.
* **Solusi**: Jalankan perintah pen-generate client secara manual:
  ```bash
  npx prisma generate
  ```

### 4. Leaflet Map tidak muncul di Browser atau Error "window is not defined"
* **Penyebab**: Leaflet memanipulasi DOM browser secara langsung sehingga tidak dapat di-render langsung di sisi server (SSR Next.js).
* **Solusi**: Komponen peta wajib di-import menggunakan dynamic import Next.js dengan opsi `ssr: false`:
  ```typescript
  import dynamic from 'next/dynamic';
  const MapComponent = dynamic(() => import('@/components/MapView'), { ssr: false });
  ```

### 5. Port 3000 sudah terpakai (Port Conflict)
* **Penyebab**: Server Next.js sebelumnya belum dimatikan dengan benar dan mengunci port 3000.
* **Solusi**: Hentikan proses pada port 3000 menggunakan perintah PowerShell:
  ```powershell
  Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force
  ```
  Atau jalankan Next.js di port alternatif:
  ```bash
  npx next dev -p 3001
  ```
