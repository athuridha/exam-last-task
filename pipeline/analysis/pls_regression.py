import pandas as pd
import numpy as np
import os
from sklearn.cross_decomposition import PLSRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import cross_val_predict


def encode_access_column(series):
    """Encode akses transport categories to ordinal numeric values."""
    mapping = {
        'tidak ada': 0,
        'sangat terbatas': 1,
        'terbatas': 2,
        'sedang': 3,
        'mudah': 4,
        'sangat mudah': 5
    }
    if pd.api.types.is_numeric_dtype(series):
        return pd.to_numeric(series, errors='coerce')
    return series.astype(str).str.strip().str.lower().map(mapping)

def calculate_vip(pls_model, X, y):
    """Calculate VIP (Variable Importance in Projection) scores"""
    T = pls_model.x_scores_     # Scores
    W = pls_model.x_weights_    # Weights
    Q = pls_model.y_loadings_   # Y loadings
    
    p, h = W.shape
    
    # Calculate the explained variance for each component
    s = np.zeros(h)
    for i in range(h):
        s[i] = (Q[0, i]**2) * (T[:, i] @ T[:, i])
    
    total_s = np.sum(s)
    
    # VIP
    vip = np.zeros(p)
    for j in range(p):
        weight_sum = np.sum(s * (W[j, :] / np.linalg.norm(W[:, :], axis=0))**2)
        vip[j] = np.sqrt(p * weight_sum / total_s)
    
    return vip

def run_pls_analysis(input_csv):
    """
    Menjalankan PLS Regression untuk mengetahui faktor dominan rasio Harga/NJOP.
    """
    print("=" * 60)
    print("ANALISIS PLS (PARTIAL LEAST SQUARES) REGRESSION")
    print("=" * 60)
    
    if not os.path.exists(input_csv):
        print(f"❌ File tidak ditemukan: {input_csv}")
        return
        
    df = pd.read_csv(input_csv)
    
    # Feature independent list
    pls_features = [
        'Luas Bangunan (m²)', 'Luas Tanah (m²)', 'Kamar Tidur', 'Kamar Mandi',
        'Jarak_ke_Pusat_Kota_km', 'Risiko_Banjir', 'Indeks_Kejahatan',
        'Skor_Legalitas', 'Skor_Fasilitas', 'Akses_Tol', 'Akses_Kereta',
        'NJOP_per_m2'
    ]
    
    # Pastikan feature ada di dataset
    available_features = [f for f in pls_features if f in df.columns]
    
    if len(available_features) == 0:
        print("❌ Tidak ada fitur yang tersedia untuk PLS.")
        return
        
    print(f"Menggunakan {len(available_features)} fitur untuk PLS Regression.")
    
    target_candidates = ['Rasio_Harga_NJOP', 'Rasio_Harga_NJOP_per_m2']
    target_col = next((c for c in target_candidates if c in df.columns), None)
    if target_col is None:
        print(f"❌ Kolom target rasio tidak ditemukan. Cek salah satu: {target_candidates}")
        return

    # Prepare data: encode fitur kategorikal lalu paksa seluruh fitur ke numerik
    X_raw = df[available_features].copy()
    for access_col in ['Akses_Tol', 'Akses_Kereta']:
        if access_col in X_raw.columns:
            X_raw[access_col] = encode_access_column(X_raw[access_col])

    X_pls = X_raw.apply(pd.to_numeric, errors='coerce').dropna()
    y_pls = pd.to_numeric(df.loc[X_pls.index, target_col], errors='coerce')
    valid_mask = y_pls.notna() & np.isfinite(y_pls)
    X_pls = X_pls[valid_mask]
    y_pls = y_pls[valid_mask]
    
    # Buang ekstrem outlier (1% bawah, 1% atas)
    Q1 = y_pls.quantile(0.01)
    Q3 = y_pls.quantile(0.99)
    mask_outlier = (y_pls >= Q1) & (y_pls <= Q3)
    X_pls = X_pls[mask_outlier]
    y_pls = y_pls[mask_outlier]
    print(f"Data valid (setelah hapus missing & outlier): {len(X_pls)} baris")

    if len(X_pls) < 10:
        print("❌ Data tidak cukup untuk PLS setelah preprocessing/filtering.")
        return
    
    # Target rasio biasanya lebih stabil. Log-transform hanya jika masih sangat skewed.
    y_skewness = y_pls.skew()
    use_log_transform = abs(y_skewness) > 1.0
    if use_log_transform:
        print(f"⚠️ Distribusi {target_col} masih skewed (skew={y_skewness:.3f}), pakai log1p transform.")
        y_model = np.log1p(y_pls)
    else:
        print(f"✅ Distribusi {target_col} cukup stabil (skew={y_skewness:.3f}), tanpa log transform.")
        y_model = y_pls
    
    # Standardisasi
    scaler_X = StandardScaler()
    scaler_y = StandardScaler()
    X_scaled = scaler_X.fit_transform(X_pls)
    y_scaled = scaler_y.fit_transform(y_model.values.reshape(-1, 1))
    
    # Pemilihan Jumlah Komponen Optimal
    max_comp = min(10, len(available_features))
    cv_r2_scores = []
    
    print("\n⏳ Mencari komponen optimal (Cross-Validation)...")
    for nc in range(1, max_comp + 1):
        y_pred_cv_temp = cross_val_predict(PLSRegression(n_components=nc), X_scaled, y_scaled, cv=5)
        ss_res_temp = np.sum((y_scaled - y_pred_cv_temp) ** 2)
        ss_tot_temp = np.sum((y_scaled - np.mean(y_scaled)) ** 2)
        cv_r2_temp = 1 - ss_res_temp / ss_tot_temp
        cv_r2_scores.append(cv_r2_temp)
    
    best_n_components = np.argmax(cv_r2_scores) + 1
    best_r2_cv = cv_r2_scores[best_n_components-1]
    print(f"✅ Optimal: {best_n_components} komponen (CV-R² = {best_r2_cv:.4f})")
    
    # Fit model akhir
    pls = PLSRegression(n_components=best_n_components)
    pls.fit(X_scaled, y_scaled)
    
    train_r2 = pls.score(X_scaled, y_scaled)
    print(f"\n📊 Evaluasi Model:")
    print(f"  R² Score (Training) : {train_r2:.4f}")
    print(f"  R² Score (CV 5-Fold): {best_r2_cv:.4f}")
    
    # Hitung dan tampilkan VIP Scores
    vip_scores = calculate_vip(pls, X_scaled, y_scaled)
    
    print("\n🌟 VIP Scores (Variable Importance in Projection) 🌟")
    print(f"Variabel dengan VIP > 1.0 dianggap signifikan memengaruhi {target_col}.")
    print("-" * 65)
    
    vip_df = pd.DataFrame({
        'Variabel': available_features,
        'VIP_Score': vip_scores,
        'Koefisien': pls.coef_.flatten()
    }).sort_values('VIP_Score', ascending=False)
    
    for _, row in vip_df.iterrows():
        sig = "***" if row['VIP_Score'] > 1.0 else ("**" if row['VIP_Score'] > 0.8 else "")
        print(f"  {row['Variabel']:30s}: VIP={row['VIP_Score']:.4f}  Koef={row['Koefisien']:+.4f} {sig}")
        
    print("\nSelesai.")

if __name__ == "__main__":
    run_pls_analysis('../data/final/properti_jabodetabek_enriched.csv')
