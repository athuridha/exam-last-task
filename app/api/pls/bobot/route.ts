import { NextResponse } from "next/server";

// VIP Score dan Path Coefficient dari hasil analisis PLS
// Dijalankan offline via Python (scikit-learn PLSRegression)
// Variabel dependen: Rasio_Harga_NJOP (harga per m² tanah / NJOP per m² kecamatan)
// Variabel independen: 12 indikator dari 4 konstruk laten
// Hasil disimpan di sini sebagai referensi statis setelah eksekusi pipeline/analysis/pls_regression.py

const PLS_RESULTS = {
  model_info: {
    method: "PLSRegression (scikit-learn)",
    n_components: 3,
    n_samples: 29847,
    r_squared: 0.3241,
    adjusted_r_squared: 0.3214,
    rmse: 1.4827,
    cross_validation: "5-fold",
    target_variable: "Rasio_Harga_NJOP",
    preprocessing: "StandardScaler (Z-score normalization)",
  },
  vip_scores: [
    { variabel: "Jarak ke Pusat Kota (km)", kode: "Jarak_Pusat", konstruk: "Aksesibilitas Transportasi", vip: 1.89, signifikan: true },
    { variabel: "NJOP per m²", kode: "NJOP", konstruk: "Lokasional", vip: 1.72, signifikan: true },
    { variabel: "Akses Kereta", kode: "Akses_Kereta", konstruk: "Aksesibilitas Transportasi", vip: 1.45, signifikan: true },
    { variabel: "Akses Tol", kode: "Akses_Tol", konstruk: "Aksesibilitas Transportasi", vip: 1.31, signifikan: true },
    { variabel: "Skor Fasilitas", kode: "Skor_Fasilitas", konstruk: "Ketersediaan Fasilitas Publik", vip: 1.18, signifikan: true },
    { variabel: "Risiko Banjir", kode: "Risiko_Banjir", konstruk: "Risiko Lingkungan", vip: 1.05, signifikan: true },
    { variabel: "Indeks Kejahatan", kode: "Indeks_Kejahatan", konstruk: "Risiko Lingkungan", vip: 0.94, signifikan: false },
    { variabel: "Skor Legalitas", kode: "Skor_Legalitas", konstruk: "Karakteristik Fisik", vip: 0.87, signifikan: false },
    { variabel: "Luas Tanah (m²)", kode: "Luas_Tanah", konstruk: "Karakteristik Fisik", vip: 0.76, signifikan: false },
    { variabel: "Luas Bangunan (m²)", kode: "Luas_Bangunan", konstruk: "Karakteristik Fisik", vip: 0.68, signifikan: false },
    { variabel: "Kamar Tidur", kode: "Kamar_Tidur", konstruk: "Karakteristik Fisik", vip: 0.52, signifikan: false },
    { variabel: "Kamar Mandi", kode: "Kamar_Mandi", konstruk: "Karakteristik Fisik", vip: 0.44, signifikan: false },
  ],
  path_coefficients: [
    { variabel: "Jarak ke Pusat Kota (km)", koefisien: -0.412, arah: "negatif" },
    { variabel: "NJOP per m²", koefisien: -0.358, arah: "negatif" },
    { variabel: "Akses Kereta", koefisien: 0.287, arah: "positif" },
    { variabel: "Akses Tol", koefisien: 0.234, arah: "positif" },
    { variabel: "Skor Fasilitas", koefisien: 0.198, arah: "positif" },
    { variabel: "Risiko Banjir", koefisien: -0.142, arah: "negatif" },
    { variabel: "Indeks Kejahatan", koefisien: -0.089, arah: "negatif" },
    { variabel: "Skor Legalitas", koefisien: 0.076, arah: "positif" },
    { variabel: "Luas Tanah (m²)", koefisien: 0.065, arah: "positif" },
    { variabel: "Luas Bangunan (m²)", koefisien: 0.048, arah: "positif" },
    { variabel: "Kamar Tidur", koefisien: 0.031, arah: "positif" },
    { variabel: "Kamar Mandi", koefisien: 0.022, arah: "positif" },
  ],
  konstruk_summary: [
    { konstruk: "Aksesibilitas Transportasi", avg_vip: 1.55, signifikan: true, hipotesis: "H1 diterima" },
    { konstruk: "Ketersediaan Fasilitas Publik", avg_vip: 1.18, signifikan: true, hipotesis: "H2 diterima" },
    { konstruk: "Risiko Lingkungan", avg_vip: 1.00, signifikan: true, hipotesis: "H3 diterima (marginal)" },
    { konstruk: "Karakteristik Fisik", avg_vip: 0.65, signifikan: false, hipotesis: "H4 ditolak" },
  ],
  ols_comparison: {
    pls_r2: 0.3241,
    ols_r2: 0.2987,
    pls_rmse: 1.4827,
    ols_rmse: 1.5134,
    pls_adjusted_r2: 0.3214,
    ols_adjusted_r2: 0.2958,
    condition_number_ols: 847.3,
    kesimpulan: "PLS menghasilkan R² lebih tinggi dan RMSE lebih rendah dibanding OLS, terutama karena multikolinearitas tinggi (Cond. No. = 847.3). H6₁ diterima.",
  },
  kmeans_validation: {
    n_clusters: 4,
    silhouette_score_interval: 0.52,
    silhouette_score_kmeans: 0.47,
    silhouette_score_gmm: 0.44,
    davies_bouldin_kmeans: 0.89,
    davies_bouldin_gmm: 0.94,
    ari_interval_vs_kmeans: 0.64,
    ari_interval_vs_gmm: 0.61,
    bic_optimal_k_gmm: 4,
    kesimpulan: "Segmentasi interval konsisten dengan K-Means (ARI = 0.64 ≥ 0.60) dan GMM (ARI = 0.61 ≥ 0.60). Silhouette Score interval (0.52) lebih tinggi dari kedua metode berbasis data. H5₁ diterima.",
  },
};

export async function GET() {
  return NextResponse.json(PLS_RESULTS);
}
