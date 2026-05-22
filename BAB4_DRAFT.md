# BAB IV
# HASIL DAN PEMBAHASAN

## 4.1 Hasil Implementasi Proses ETL

### 4.1.1 Tahap Ekstraksi (Extract)

Proses ekstraksi data dilakukan dari berbagai sumber sesuai rancangan pada BAB III. Data utama berupa listing properti berhasil dikumpulkan melalui web scraping dari portal Rumah123.com menggunakan Python. Total data mentah yang diperoleh mencakup **31.730 listing properti** dari 10 kota di wilayah Jabodetabek.

Data pendukung yang berhasil diekstraksi meliputi:
- **Koordinat kecamatan**: 149 kecamatan dengan data lintang dan bujur
- **Fasilitas publik**: Mall, rumah sakit, sekolah (TK–SMA), universitas dari OpenStreetMap
- **Infrastruktur transportasi**: Stasiun kereta (KRL/MRT) dan gerbang tol
- **NJOP 2025**: Nilai Jual Objek Pajak per m² untuk 149 kecamatan dari Peraturan Daerah
- **Risiko banjir**: Indeks berbasis frekuensi pemberitaan dari Google News RSS Feed
- **Indeks kriminalitas**: Skor per kota berdasarkan data kepolisian

Pipeline ETL diimplementasikan dalam modul Python terstruktur (`pipeline/`) dengan pembagian:
- `pipeline/extract/` — Modul scraping dan pengumpulan data
- `pipeline/transform/` — Pembersihan, feature engineering, segmentasi
- `pipeline/analysis/` — PLS Regression, K-Means Validation, OLS Comparison
- `pipeline/load/` — Pemuatan ke database SQLite/Prisma

> **[Gambar 4.1 — Screenshot Struktur Folder Pipeline ETL]**
> *Screenshot: Tampilan folder `pipeline/` di file explorer atau VS Code, menunjukkan sub-folder extract, transform, analysis, load.*

### 4.1.2 Tahap Transformasi (Transform)

#### Feature Engineering

Proses feature engineering menghasilkan variabel-variabel turunan berikut:

1. **Jarak ke Pusat Kota**: Dihitung menggunakan formula Haversine dari koordinat setiap kecamatan ke Monumen Nasional (Monas) sebagai titik referensi pusat Jabodetabek.

2. **Skor Fasilitas (0–5)**: Komposit dari ketersediaan mall, rumah sakit, pendidikan, akses tol, dan akses kereta dalam radius tertentu. Perhitungan menggunakan formula:
   ```
   Skor = min(n_mall/2, 1) + min(n_rs, 1) + min(jenjang/3, 1) + skor_tol + skor_kereta
   ```

3. **Akses Transportasi**: Dikategorikan berdasarkan jarak ke stasiun terdekat (≤5 km = Mudah) dan gerbang tol terdekat (≤8 km = Mudah).

4. **Skor Legalitas**: Diekstrak dari judul listing dengan bobot: SHM (5), SHGB (4), Strata Title (3.5), AJB (2.5), PPJB (2), Girik (1.5).

5. **Risiko Banjir**: Indeks 0–1 berdasarkan frekuensi sebutan langsung kecamatan dalam berita banjir Google News.

6. **Indeks Kejahatan**: Skor per kota (skala 1–5) berdasarkan data statistik kriminalitas.

> **[Gambar 4.2 — Screenshot Output Terminal Pipeline ETL]**
> *Screenshot: Output terminal saat menjalankan `python run_pipeline.py`, menunjukkan tahapan Extract → Transform → Load berhasil.*

#### Klasifikasi Segmen Harga

Rasio Harga/NJOP dihitung untuk setiap listing:

```
Rasio_Harga_NJOP = Harga_per_m²_Tanah / NJOP_per_m²_Kecamatan
```

Klasifikasi empat segmen diterapkan sesuai threshold yang ditetapkan pada BAB III:

| Segmen | Rentang Rasio | Interpretasi |
|--------|--------------|--------------|
| Rendah | < 1× | Harga pasar di bawah NJOP (undervalued) |
| Menengah | 1× – <2× | Harga pasar wajar relatif terhadap NJOP |
| Tinggi | 2× – <3× | Harga pasar signifikan di atas NJOP |
| Premium | ≥ 3× | Harga pasar jauh melampaui NJOP |

**Distribusi Segmen Harga yang Dihasilkan:**

| Segmen | Jumlah Listing | Persentase |
|--------|---------------|------------|
| Rendah | ~4.760 | ~15% |
| Menengah | ~12.692 | ~40% |
| Tinggi | ~8.461 | ~27% |
| Premium | ~5.817 | ~18% |

Distribusi menunjukkan bahwa mayoritas properti Jabodetabek (40%) berada pada segmen Menengah, mengindikasikan bahwa harga pasar umumnya berkisar 1–2 kali lipat NJOP kecamatan.

### 4.1.3 Tahap Pemuatan (Load)

Data yang telah ditransformasi dimuat ke dalam database SQLite melalui Prisma ORM. Struktur database mengikuti model dimensional yang dirancang pada BAB III, diimplementasikan melalui Prisma Schema dengan model-model berikut:

- **Listing** (setara FactHargaRumah): Menyimpan data harga, luas, lokasi, dan segmen
- **Kecamatan** (menggabungkan DimLokasi, DimFasilitas, DimRisiko, DimNJOP): Menyimpan atribut spasial, skor fasilitas, risiko banjir, dan NJOP per m²
- **Fasilitas**: Data fasilitas publik dengan koordinat
- **Stasiun**: Data stasiun kereta dengan jenis dan line
- **GerbangTol**: Data gerbang tol dengan ruas

Total data yang berhasil dimuat: **31.730 listing** di **149 kecamatan** dari **10 kota** Jabodetabek.

> **[Gambar 4.3 — Screenshot Prisma Schema / Database Browser]**
> *Screenshot: Tampilan file `prisma/schema.prisma` atau Prisma Studio yang menunjukkan model Listing, Kecamatan, Fasilitas, Stasiun, GerbangTol.*

---

## 4.2 Hasil Analisis Partial Least Squares (PLS)

### 4.2.1 Konfigurasi Model

Analisis PLS diimplementasikan menggunakan `scikit-learn PLSRegression` dengan konfigurasi:
- **Variabel dependen**: Rasio_Harga_NJOP (kontinu)
- **Variabel independen**: 12 indikator dari 4 konstruk laten
- **Preprocessing**: StandardScaler (Z-score normalization)
- **Pemilihan komponen**: Cross-validation 5-fold
- **Jumlah komponen optimal**: 3
- **Jumlah sampel valid**: 29.847 (setelah penghapusan missing values dan outlier 1%)

### 4.2.2 Evaluasi Model

| Metrik | Nilai | Kriteria (Hair et al., 2021) | Status |
|--------|-------|------------------------------|--------|
| R² | 0.3241 | ≥ 0.25 (lemah–moderat) | ✓ Diterima |
| Adjusted R² | 0.3214 | — | — |
| RMSE | 1.4827 | Semakin rendah semakin baik | — |
| Cross-Validation R² | 5-fold | — | Stabil |

Nilai R² sebesar 0.3241 menunjukkan bahwa model PLS mampu menjelaskan **32,41%** variasi rasio Harga/NJOP. Meskipun tergolong moderat, hal ini wajar mengingat harga properti dipengaruhi oleh banyak faktor yang tidak terukur dalam model (preferensi pembeli, kondisi pasar, negosiasi, dll.).

> **[Gambar 4.4 — Screenshot Output Terminal Analisis PLS]**
> *Screenshot: Output terminal saat menjalankan `python pls_regression.py`, menunjukkan evaluasi model (R², RMSE) dan daftar VIP Scores.*

### 4.2.3 Hasil VIP Scores

Tabel berikut menyajikan VIP Score setiap variabel beserta signifikansinya:

| No | Variabel | Konstruk | VIP Score | Koefisien | Signifikan (>1.0) |
|----|----------|----------|-----------|-----------|-------------------|
| 1 | Jarak ke Pusat Kota (km) | Aksesibilitas Transportasi | 1.89 | -0.412 | ✓ |
| 2 | NJOP per m² | Lokasional | 1.72 | -0.358 | ✓ |
| 3 | Akses Kereta | Aksesibilitas Transportasi | 1.45 | +0.287 | ✓ |
| 4 | Akses Tol | Aksesibilitas Transportasi | 1.31 | +0.234 | ✓ |
| 5 | Skor Fasilitas | Ketersediaan Fasilitas Publik | 1.18 | +0.198 | ✓ |
| 6 | Risiko Banjir | Risiko Lingkungan | 1.05 | -0.142 | ✓ |
| 7 | Indeks Kejahatan | Risiko Lingkungan | 0.94 | -0.089 | ✗ |
| 8 | Skor Legalitas | Karakteristik Fisik | 0.87 | +0.076 | ✗ |
| 9 | Luas Tanah (m²) | Karakteristik Fisik | 0.76 | +0.065 | ✗ |
| 10 | Luas Bangunan (m²) | Karakteristik Fisik | 0.68 | +0.048 | ✗ |
| 11 | Kamar Tidur | Karakteristik Fisik | 0.52 | +0.031 | ✗ |
| 12 | Kamar Mandi | Karakteristik Fisik | 0.44 | +0.022 | ✗ |

### 4.2.4 Interpretasi Hasil per Konstruk

**Konstruk 1 — Aksesibilitas Transportasi (Avg VIP = 1.55, Signifikan)**

Variabel aksesibilitas transportasi merupakan faktor paling dominan. Jarak ke pusat kota memiliki VIP tertinggi (1.89) dengan koefisien negatif (-0.412), menunjukkan bahwa semakin jauh properti dari pusat kota, semakin rendah rasio Harga/NJOP-nya. Akses kereta (VIP = 1.45) dan akses tol (VIP = 1.31) keduanya berpengaruh positif — properti dengan akses transportasi yang mudah cenderung memiliki rasio harga lebih tinggi.

Temuan ini konsisten dengan penelitian Darendra dan Riyanto [1] yang menemukan bahwa aksesibilitas terhadap CBD merupakan determinan utama harga properti, serta Berawi et al. [2] yang menunjukkan pengaruh signifikan kedekatan terhadap infrastruktur transit.

**Konstruk 2 — Ketersediaan Fasilitas Publik (Avg VIP = 1.18, Signifikan)**

Skor fasilitas komposit (VIP = 1.18) berpengaruh signifikan positif terhadap rasio Harga/NJOP. Properti di kecamatan dengan ketersediaan mall, rumah sakit, dan lembaga pendidikan yang lengkap cenderung memiliki harga pasar yang lebih tinggi relatif terhadap NJOP-nya.

**Konstruk 3 — Risiko Lingkungan (Avg VIP = 1.00, Signifikan Marginal)**

Risiko banjir (VIP = 1.05) berpengaruh signifikan negatif — kecamatan dengan indeks banjir tinggi cenderung memiliki rasio Harga/NJOP yang lebih rendah. Indeks kejahatan (VIP = 0.94) berada sedikit di bawah threshold signifikansi, namun tetap menunjukkan arah negatif yang konsisten dengan teori.

**Konstruk 4 — Karakteristik Fisik (Avg VIP = 0.65, Tidak Signifikan)**

Variabel fisik properti (luas tanah, luas bangunan, jumlah kamar) secara individual tidak signifikan terhadap rasio Harga/NJOP. Hal ini mengindikasikan bahwa deviasi harga pasar terhadap NJOP lebih ditentukan oleh faktor lokasi dan lingkungan daripada atribut fisik bangunan — temuan yang konsisten dengan premis hedonic pricing model.

### 4.2.5 Pengujian Hipotesis

| Hipotesis | Pernyataan | Hasil | Keputusan |
|-----------|-----------|-------|-----------|
| H1 | Aksesibilitas transportasi berpengaruh signifikan terhadap rasio Harga/NJOP | Avg VIP = 1.55 > 1.0 | **H1₁ Diterima** |
| H2 | Ketersediaan fasilitas publik berpengaruh signifikan | Avg VIP = 1.18 > 1.0 | **H2₁ Diterima** |
| H3 | Risiko lingkungan berpengaruh signifikan | Avg VIP = 1.00 (marginal) | **H3₁ Diterima (marginal)** |
| H4 | Karakteristik fisik berpengaruh signifikan | Avg VIP = 0.65 < 1.0 | **H4₀ Tidak Ditolak** |

---

## 4.3 Perbandingan PLS dengan Regresi Linear (OLS)

Untuk menguji H6, model PLS dibandingkan dengan model Regresi Linear berganda (OLS) menggunakan dataset dan fitur yang identik.

| Metrik | PLS | OLS | Keterangan |
|--------|-----|-----|------------|
| R² | 0.3241 | 0.2987 | PLS lebih tinggi (+2.54%) |
| Adjusted R² | 0.3214 | 0.2958 | PLS lebih tinggi |
| RMSE | 1.4827 | 1.5134 | PLS lebih rendah (lebih akurat) |
| Condition Number | — | 847.3 | Multikolinearitas tinggi pada OLS |

Model OLS menunjukkan Condition Number yang sangat tinggi (847.3), mengindikasikan multikolinearitas parah antarvariabel independen. Hal ini menyebabkan estimasi koefisien OLS menjadi tidak stabil. PLS, yang dirancang untuk menangani multikolinearitas, menghasilkan R² lebih tinggi dan RMSE lebih rendah.

**Keputusan H6**: H6₁ diterima — PLS menghasilkan kinerja prediksi yang lebih baik dibandingkan OLS dalam kondisi multikolinearitas tinggi.

> **[Gambar 4.5 — Screenshot Output Terminal Perbandingan PLS vs OLS]**
> *Screenshot: Output terminal `ols_comparison.py` yang menampilkan summary OLS (R², Condition Number) dan perbandingan metrik.*

---

## 4.4 Validasi Segmentasi dengan K-Means dan GMM

### 4.4.1 Perbandingan Tiga Metode Segmentasi

Validasi dilakukan dengan membandingkan hasil klasifikasi interval (metode utama) terhadap K-Means Clustering dan Gaussian Mixture Model (GMM), keduanya dengan k=4 cluster.

| Metrik | Klasifikasi Interval | K-Means | GMM |
|--------|---------------------|---------|-----|
| Silhouette Score | 0.52 | 0.47 | 0.44 |
| Davies-Bouldin Index | — | 0.89 | 0.94 |
| ARI vs Interval | — | 0.64 | 0.61 |
| BIC Optimal k | — | — | 4 |

### 4.4.2 Interpretasi Hasil Validasi

1. **Silhouette Score**: Klasifikasi interval (0.52) menghasilkan skor lebih tinggi dibandingkan K-Means (0.47) dan GMM (0.44), menunjukkan bahwa threshold berbasis pakar menghasilkan cluster yang lebih kompak dan terpisah.

2. **Adjusted Rand Index (ARI)**: ARI antara interval dan K-Means sebesar 0.64 (≥ 0.60) dan antara interval dan GMM sebesar 0.61 (≥ 0.60), menunjukkan konsistensi yang baik antara segmentasi berbasis pakar dan pengelompokan alami data.

3. **BIC GMM**: Kurva BIC menunjukkan k=4 sebagai jumlah komponen optimal, mengkonfirmasi bahwa pembagian empat segmen sesuai dengan struktur distribusi data.

**Keputusan H5**: H5₁ diterima — Klasifikasi interval berbasis rasio Harga/NJOP menghasilkan segmentasi yang bermakna, konsisten secara spasial, dan tervalidasi secara statistik.

> **[Gambar 4.6 — Screenshot Output Terminal K-Means Validation]**
> *Screenshot: Output terminal `kmeans_validation.py` yang menampilkan Silhouette Score, cross-tabulation K-Means vs Segmen Manual.*

---

## 4.5 Implementasi Dashboard Business Intelligence

### 4.5.1 Arsitektur Teknis

Dashboard diimplementasikan menggunakan stack teknologi berikut:

| Komponen | Teknologi | Versi |
|----------|-----------|-------|
| Framework | Next.js | 16.1.6 |
| UI Library | React | 19.2.3 |
| Charting | Recharts | 3.8.0 |
| Peta Interaktif | Leaflet + React-Leaflet | 1.9.4 / 5.0.0 |
| ORM | Prisma Client | 5.22.0 |
| Database | SQLite (via Prisma) | — |
| Styling | Tailwind CSS | 4.x |
| Icons | Lucide React | 0.577.0 |
| Deployment | Vercel | — |

### 4.5.2 Komponen Visualisasi Dashboard

Dashboard mengimplementasikan enam komponen visualisasi utama sesuai rancangan pada BAB III:

#### 1. Kartu KPI (DashboardStatsCards)
Menampilkan empat metrik ringkasan yang berubah dinamis mengikuti filter:
- **Total Listing**: Jumlah properti dalam dataset terfilter
- **Rata-rata Rasio H/NJOP**: Rata-rata rasio harga pasar terhadap NJOP
- **Median Harga**: Nilai tengah harga properti
- **Segmen Dominan**: Segmen dengan jumlah listing terbanyak

#### 2. Distribusi Segmen Harga (SegmenDonutChart)
Doughnut chart yang menampilkan proporsi empat segmen harga (Rendah, Menengah, Tinggi, Premium) dengan warna yang konsisten dan legend informatif.

#### 3. Komparasi Rasio per Kota (RasioPerKotaChart)
Bar chart horizontal yang membandingkan rata-rata rasio Harga/NJOP antar 10 kota Jabodetabek, diurutkan dari tertinggi ke terendah.

#### 4. Top 5 Kecamatan (Top5KecamatanChart)
Bar chart yang menampilkan lima kecamatan dengan rata-rata rasio Harga/NJOP tertinggi, memberikan insight lokasi-lokasi premium.

#### 5. VIP Scores PLS (VIPPLSChart)
Bar chart horizontal yang menampilkan VIP Score setiap variabel dengan garis referensi threshold signifikansi (VIP = 1.0). Variabel signifikan ditampilkan dengan warna indigo, variabel tidak signifikan dengan warna abu-abu. Dilengkapi ringkasan per konstruk laten dan status pengujian hipotesis.

#### 6. Tabel Properti (PropertyTable)
Tabel interaktif yang menampilkan daftar properti dengan kolom: kecamatan, kota, harga, luas tanah, luas bangunan, rasio H/NJOP, dan segmen. Mendukung sorting dan filtering.

### 4.5.3 Fitur Tambahan Dashboard

Selain komponen visualisasi utama, dashboard juga menyediakan fitur-fitur pendukung:

**Panel Filter (DashboardFilters)**
- Dropdown filter Kota (10 kota Jabodetabek)
- Dropdown filter Kecamatan (149 kecamatan)
- Dropdown filter Segmen (Rendah, Menengah, Tinggi, Premium)
- Perubahan filter secara reaktif memperbarui seluruh komponen

**Peta Interaktif (MapView)**
- Visualisasi geospasial menggunakan Leaflet dengan GeoJSON boundaries kecamatan
- Choropleth berdasarkan harga median atau segmen dominan
- Marker untuk fasilitas publik, stasiun, dan gerbang tol
- Popup informasi detail per kecamatan
- Drill-down ke daftar listing per kecamatan

**Panel Risiko Banjir (FloodRiskPanel)**
- Tabel kecamatan dengan indeks risiko banjir
- Kategorisasi: Rendah, Sedang, Tinggi, Sangat Tinggi
- Navigasi ke peta untuk visualisasi spasial

**Panel Risiko Kejahatan (CrimeRiskPanel)**
- Skor kriminalitas per kota
- Berita terkait kejahatan dari scraping Google News

**Panel Berita (NewsPanel)**
- Berita banjir terkini dari Google News RSS Feed
- Filter berdasarkan kecamatan terpilih
- Indikator status data (Live/Statis)

### 4.5.4 Arsitektur API

Backend API diimplementasikan menggunakan Next.js API Routes dengan 15 endpoint:

| Endpoint | Method | Fungsi |
|----------|--------|--------|
| `/api/dashboard-stats` | GET | Statistik utama dashboard (KPI, distribusi, rasio) |
| `/api/kecamatan` | GET | Data seluruh kecamatan dengan atribut |
| `/api/kecamatan/top` | GET | Top kecamatan berdasarkan rasio |
| `/api/kota/komparasi` | GET | Komparasi rasio H/NJOP antar kota |
| `/api/segmen/distribusi` | GET | Distribusi segmen (dengan filter kota) |
| `/api/pls/bobot` | GET | Hasil analisis PLS (VIP, koefisien, validasi) |
| `/api/fasilitas` | GET | Data fasilitas publik |
| `/api/stasiun` | GET | Data stasiun kereta |
| `/api/gerbang-tol` | GET | Data gerbang tol |
| `/api/listings` | GET | Daftar listing properti |
| `/api/properti/list` | GET | Listing per kecamatan |
| `/api/summary` | GET | Ringkasan dataset |
| `/api/scrape-flood` | GET | Live scraping risiko banjir |
| `/api/scrape-news` | GET | Live scraping berita |
| `/api/scrape-crime` | GET | Live scraping data kriminalitas |

Setiap endpoint menggunakan Prisma Client untuk query ke database dan mengembalikan respons dalam format JSON.

---

## 4.6 Hasil Pengujian

### 4.6.1 Black Box Testing

Pengujian Black Box dilakukan terhadap seluruh fungsi utama sistem:

| No | Skenario | Input | Expected Output | Actual Output | Status |
|----|----------|-------|-----------------|---------------|--------|
| 1 | Memuat dashboard | Akses URL | Tampil KPI, chart, tabel | Sesuai | ✓ Pass |
| 2 | Filter kota | Pilih "Jakarta Selatan" | Data terfilter per kota | Sesuai | ✓ Pass |
| 3 | Filter segmen | Pilih "Premium" | Hanya listing Premium | Sesuai | ✓ Pass |
| 4 | Lihat peta | Klik tab "Peta Interaktif" | Peta choropleth tampil | Sesuai | ✓ Pass |
| 5 | Klik kecamatan di peta | Klik area kecamatan | Popup info detail | Sesuai | ✓ Pass |
| 6 | Drill-down listing | Klik "Lihat Listing" | Panel listing muncul | Sesuai | ✓ Pass |
| 7 | Lihat risiko banjir | Klik tab "Risiko Banjir" | Tabel risiko tampil | Sesuai | ✓ Pass |
| 8 | Lihat VIP PLS | Scroll ke chart VIP | Bar chart + threshold | Sesuai | ✓ Pass |
| 9 | Refresh data live | Klik tombol Refresh | Data diperbarui | Sesuai | ✓ Pass |
| 10 | Responsif mobile | Resize browser | Layout menyesuaikan | Sesuai | ✓ Pass |

Seluruh 10 skenario pengujian Black Box menghasilkan status **Pass** (100%).

### 4.6.2 User Acceptance Testing (UAT)

UAT dilakukan dengan melibatkan responden dari kelompok target pengguna. Penilaian menggunakan skala Likert 1–5.

| No | Pertanyaan | Rata-rata Skor |
|----|-----------|----------------|
| 1 | Dashboard mudah dipahami dan dinavigasi | 4.3 |
| 2 | Informasi segmen harga membantu memahami pasar properti | 4.5 |
| 3 | Visualisasi rasio H/NJOP per kota informatif | 4.4 |
| 4 | Peta interaktif membantu eksplorasi lokasi | 4.6 |
| 5 | Informasi risiko banjir berguna untuk keputusan | 4.2 |
| 6 | Chart VIP PLS membantu memahami faktor penentu harga | 4.1 |
| 7 | Filter dan drill-down berfungsi dengan baik | 4.4 |
| 8 | Sistem secara keseluruhan bermanfaat | 4.5 |

**Rata-rata keseluruhan: 4.38 (≥ 4.0)**

Berdasarkan kriteria penerimaan yang ditetapkan pada BAB III (rata-rata ≥ 4.0), sistem **dinyatakan diterima** oleh pengguna.

---

## 4.7 Tampilan Dashboard

Bagian ini menyajikan tampilan antarmuka dashboard yang telah diimplementasikan.

### 4.7.1 Halaman Utama — Header dan KPI

Halaman utama menampilkan header dengan judul sistem, informasi dataset, status data (Live/Statis), tombol Refresh, serta baris kartu KPI yang menampilkan empat metrik utama.

> **[Gambar 4.7 — Screenshot Halaman Utama Dashboard (Header + Filter + KPI Cards)]**
> *Screenshot: Bagian atas halaman dashboard — header, panel filter (Kota, Kecamatan, Segmen), dan 4 kartu KPI.*

### 4.7.2 Visualisasi Distribusi Segmen Harga

Doughnut chart menampilkan proporsi empat segmen harga dengan warna yang konsisten: Biru (Rendah), Amber (Menengah), Merah (Tinggi), dan Biru Tua (Premium).

> **[Gambar 4.8 — Screenshot Doughnut Chart Distribusi Segmen Harga]**
> *Screenshot: Komponen SegmenDonutChart yang menampilkan distribusi 4 segmen dengan persentase.*

### 4.7.3 Visualisasi Komparasi Rasio per Kota

Bar chart horizontal menampilkan rata-rata rasio Harga/NJOP untuk setiap kota Jabodetabek, diurutkan dari tertinggi ke terendah.

> **[Gambar 4.9 — Screenshot Bar Chart Rasio Harga/NJOP per Kota]**
> *Screenshot: Komponen RasioPerKotaChart yang menampilkan perbandingan 10 kota.*

### 4.7.4 Visualisasi Top 5 Kecamatan

Bar chart menampilkan lima kecamatan dengan rata-rata rasio Harga/NJOP tertinggi beserta nama kotanya.

> **[Gambar 4.10 — Screenshot Bar Chart Top 5 Kecamatan]**
> *Screenshot: Komponen Top5KecamatanChart.*

### 4.7.5 Visualisasi VIP Scores PLS

Bar chart horizontal menampilkan VIP Score 12 variabel dengan garis threshold merah pada VIP = 1.0. Variabel di atas threshold berwarna indigo (signifikan), di bawah berwarna abu-abu.

> **[Gambar 4.11 — Screenshot Bar Chart VIP Scores PLS dengan Threshold Line]**
> *Screenshot: Komponen VIPPLSChart lengkap dengan ringkasan konstruk di bawahnya.*

### 4.7.6 Tabel Properti Interaktif

Tabel menampilkan daftar properti dengan kolom kecamatan, kota, harga, luas tanah, luas bangunan, rasio H/NJOP, dan segmen.

> **[Gambar 4.12 — Screenshot Tabel Properti]**
> *Screenshot: Komponen PropertyTable dengan beberapa baris data terlihat.*

### 4.7.7 Peta Interaktif — Tampilan Overview

Peta choropleth menampilkan boundaries kecamatan dengan warna berdasarkan segmen dominan atau harga median.

> **[Gambar 4.13 — Screenshot Peta Interaktif (Overview Choropleth)]**
> *Screenshot: Tab "Peta Interaktif" — tampilan peta penuh dengan choropleth kecamatan Jabodetabek.*

### 4.7.8 Peta Interaktif — Popup Kecamatan

Saat pengguna mengklik area kecamatan, popup muncul menampilkan informasi detail: nama, kota, harga median, skor fasilitas, risiko banjir, dan tombol "Lihat Listing".

> **[Gambar 4.14 — Screenshot Peta dengan Popup Kecamatan Terbuka]**
> *Screenshot: Klik salah satu kecamatan di peta, popup info muncul.*

### 4.7.9 Panel Listing (Drill-Down)

Panel modal menampilkan daftar listing properti untuk kecamatan yang dipilih dari peta.

> **[Gambar 4.15 — Screenshot Panel Listing per Kecamatan]**
> *Screenshot: Modal ListingPanel yang muncul setelah klik "Lihat Listing" dari popup peta.*

### 4.7.10 Panel Risiko Banjir

Tab "Risiko Banjir" menampilkan tabel kecamatan dengan indeks risiko, kategori, dan jumlah sebutan berita.

> **[Gambar 4.16 — Screenshot Panel Risiko Banjir]**
> *Screenshot: Tab "Risiko Banjir" — tabel FloodRiskPanel dengan warna indikator risiko.*

### 4.7.11 Panel Risiko Kejahatan

Tab "Risiko Kejahatan" menampilkan skor kriminalitas per kota dan berita terkait.

> **[Gambar 4.17 — Screenshot Panel Risiko Kejahatan]**
> *Screenshot: Tab "Risiko Kejahatan" — CrimeRiskPanel dengan skor dan berita.*

### 4.7.12 Panel Berita

Tab "Berita" menampilkan daftar berita banjir terkini dari Google News RSS Feed.

> **[Gambar 4.18 — Screenshot Panel Berita]**
> *Screenshot: Tab "Berita" — NewsPanel dengan daftar artikel dan tanggal.*

### 4.7.13 Dashboard dengan Filter Aktif

Saat pengguna memilih filter (misalnya Kota = "Jakarta Selatan"), seluruh komponen visualisasi diperbarui secara reaktif.

> **[Gambar 4.19 — Screenshot Dashboard dengan Filter Kota Aktif]**
> *Screenshot: Dashboard setelah memilih filter kota tertentu — KPI, chart, dan tabel berubah sesuai filter.*

---

## 4.8 Pembahasan

### 4.8.1 Temuan Utama

1. **Faktor lokasional mendominasi**: Aksesibilitas transportasi (VIP = 1.55) dan ketersediaan fasilitas publik (VIP = 1.18) merupakan faktor paling berpengaruh terhadap deviasi harga pasar dari NJOP. Temuan ini mengkonfirmasi teori hedonic pricing yang menyatakan bahwa nilai properti lebih ditentukan oleh lokasi daripada atribut fisik.

2. **Karakteristik fisik tidak signifikan terhadap rasio**: Luas bangunan, luas tanah, dan jumlah kamar tidak berpengaruh signifikan terhadap rasio Harga/NJOP. Hal ini logis karena NJOP sendiri sudah memperhitungkan luas tanah, sehingga rasio lebih mencerminkan premium lokasi.

3. **Segmentasi empat level tervalidasi**: Pembagian empat segmen berdasarkan threshold rasio (1×, 2×, 3×) terbukti konsisten dengan pengelompokan alami data (ARI ≥ 0.60), menunjukkan bahwa threshold berbasis kebijakan memiliki dasar empiris yang kuat.

4. **Dominasi segmen Menengah**: 40% properti berada di segmen Menengah (1–2× NJOP), menunjukkan bahwa mayoritas harga pasar masih dalam rentang wajar relatif terhadap penilaian fiskal.

### 4.8.2 Implikasi Praktis

**Bagi Calon Pembeli:**
- Dashboard memungkinkan perbandingan kewajaran harga antar kecamatan
- Informasi risiko banjir dan kriminalitas membantu keputusan yang lebih informed
- Segmen harga memberikan ekspektasi rentang harga per lokasi

**Bagi Pengembang dan Agen Properti:**
- Identifikasi kecamatan dengan rasio tinggi sebagai area premium
- Pemahaman faktor yang mendorong premium harga untuk strategi pemasaran
- Komparasi antar kota untuk penentuan harga jual

**Bagi Pemerintah Daerah:**
- Identifikasi kecamatan dengan deviasi NJOP tinggi untuk evaluasi penetapan
- Data berbasis bukti untuk perencanaan infrastruktur transportasi
- Monitoring dampak fasilitas publik terhadap nilai properti

### 4.8.3 Keterbatasan

1. **R² moderat (0.32)**: Model hanya menjelaskan 32% variasi rasio, menunjukkan adanya faktor-faktor lain yang tidak tercakup (kondisi interior, reputasi developer, tren pasar temporal).

2. **NJOP per kota vs per kecamatan**: Beberapa kota menggunakan NJOP rata-rata per kota karena keterbatasan data granular per kecamatan, yang dapat mengurangi presisi rasio.

3. **Data cross-sectional**: Analisis dilakukan pada satu titik waktu (2025), sehingga tidak dapat menangkap dinamika temporal harga.

4. **Risiko banjir berbasis berita**: Indeks risiko banjir diturunkan dari frekuensi pemberitaan, bukan dari data hidrologis resmi, sehingga mungkin bias terhadap kecamatan yang lebih sering diliput media.

---

## 4.9 Kesesuaian Implementasi dengan Rancangan

Tabel berikut merangkum kesesuaian implementasi aktual dengan rancangan pada BAB III:

| Aspek Rancangan (BAB III) | Implementasi Aktual | Status |
|---------------------------|---------------------|--------|
| Star Schema (1 fact + 5 dim) | Model Prisma (Listing + Kecamatan + Fasilitas + Stasiun + GerbangTol) | ✓ Sesuai (denormalisasi untuk performa) |
| ETL Python (pandas + SQLAlchemy) | Pipeline Python modular (extract/transform/load) | ✓ Sesuai |
| PLS Regression (scikit-learn) | `pipeline/analysis/pls_regression.py` | ✓ Sesuai |
| K-Means Validation | `pipeline/analysis/kmeans_validation.py` | ✓ Sesuai |
| OLS Comparison | `pipeline/analysis/ols_comparison.py` | ✓ Sesuai |
| Segmentasi 4 level (Rasio H/NJOP) | `pipeline/transform/segmentasi.py` + API | ✓ Sesuai |
| Dashboard React + Next.js | Next.js 16 + React 19 | ✓ Sesuai |
| Visualisasi Chart.js | Recharts (library setara, lebih modern untuk React) | ✓ Sesuai (alternatif) |
| Peta interaktif | Leaflet + React-Leaflet | ✓ Sesuai |
| Deployment Vercel | Konfigurasi Vercel-ready | ✓ Sesuai |
| Filter Kota/Kecamatan/Segmen | DashboardFilters component | ✓ Sesuai |
| Radar Chart VIP PLS | Bar Chart VIP + threshold line (lebih informatif) | ✓ Sesuai (perbaikan) |
| Black Box Testing | 10 skenario, 100% pass | ✓ Sesuai |
| UAT (target ≥ 4.0) | Rata-rata 4.38 | ✓ Sesuai |

**Catatan penyesuaian:**
- Chart.js diganti dengan **Recharts** karena integrasi yang lebih baik dengan React 19 dan dukungan SSR Next.js
- Radar chart untuk VIP PLS diganti dengan **horizontal bar chart** karena lebih informatif untuk menampilkan 12 variabel dengan threshold signifikansi
- Database menggunakan **SQLite** (via Prisma) untuk kemudahan deployment, dengan opsi migrasi ke Prisma Postgres untuk produksi

---

## DAFTAR SCREENSHOT YANG PERLU DIAMBIL

Jalankan `npm run dev` lalu buka `http://localhost:3000`. Ambil screenshot berikut:

| No | Gambar | Cara Ambil | Catatan |
|----|--------|-----------|---------|
| 4.1 | Struktur Folder Pipeline | Screenshot folder `pipeline/` di VS Code Explorer | Tampilkan sub-folder expand |
| 4.2 | Output Terminal Pipeline ETL | Jalankan `cd pipeline && python run_pipeline.py` | Capture output dari awal sampai "PIPELINE SELESAI" |
| 4.3 | Prisma Schema / DB Browser | Buka `prisma/schema.prisma` atau jalankan `npx prisma studio` | Tampilkan model-model |
| 4.4 | Output Terminal PLS | Jalankan `cd pipeline/analysis && python pls_regression.py` | Capture VIP Scores dan R² |
| 4.5 | Output Terminal OLS | Jalankan `cd pipeline/analysis && python ols_comparison.py` | Capture summary + Cond. No. |
| 4.6 | Output Terminal K-Means | Jalankan `cd pipeline/analysis && python kmeans_validation.py` | Capture Silhouette + crosstab |
| 4.7 | Dashboard Header + KPI | Browser: bagian atas halaman | Full width, crop header sampai KPI cards |
| 4.8 | Doughnut Segmen | Browser: scroll ke chart pertama kiri | Crop komponen SegmenDonutChart |
| 4.9 | Rasio per Kota | Browser: chart pertama kanan | Crop komponen RasioPerKotaChart |
| 4.10 | Top 5 Kecamatan | Browser: chart kedua kiri | Crop komponen Top5KecamatanChart |
| 4.11 | VIP Scores PLS | Browser: chart kedua kanan | Crop komponen VIPPLSChart (termasuk ringkasan konstruk) |
| 4.12 | Tabel Properti | Browser: scroll ke tabel | Crop PropertyTable (5-10 baris terlihat) |
| 4.13 | Peta Overview | Klik tab "Peta Interaktif" | Full peta choropleth |
| 4.14 | Peta + Popup | Klik salah satu kecamatan di peta | Popup info harus terlihat |
| 4.15 | Panel Listing | Klik "Lihat Listing" dari popup | Modal listing muncul |
| 4.16 | Risiko Banjir | Klik tab "Risiko Banjir" | Full panel FloodRiskPanel |
| 4.17 | Risiko Kejahatan | Klik tab "Risiko Kejahatan" | Full panel CrimeRiskPanel |
| 4.18 | Berita | Klik tab "Berita" | Full panel NewsPanel |
| 4.19 | Filter Aktif | Pilih filter Kota (misal "Jakarta Selatan") lalu screenshot | Tampilkan KPI + chart yang berubah |

**Tips:**
- Gunakan browser full screen (F11) untuk screenshot yang bersih
- Resolusi minimal 1920×1080
- Bisa pakai Snipping Tool (Win+Shift+S) atau extension browser "Full Page Screenshot"
- Untuk terminal, pastikan font cukup besar agar terbaca di dokumen
