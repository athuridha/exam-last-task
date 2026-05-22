import pandas as pd
import numpy as np
import os
import statsmodels.api as sm
from sklearn.preprocessing import StandardScaler


def _encode_access(series):
    mapping = {
        'tidak ada': 0, 'sangat terbatas': 1, 'terbatas': 2,
        'sedang': 3, 'mudah': 4, 'sangat mudah': 5,
    }
    if pd.api.types.is_numeric_dtype(series):
        return pd.to_numeric(series, errors='coerce')
    return series.astype(str).str.strip().str.lower().map(mapping)

def run_ols_analysis(input_csv, return_results=False):
    """
    Menjalankan OLS (Ordinary Least Squares) Regression untuk analisis statistik
    signifikansi variabel (p-value).

    Jika return_results=True, function akan mengembalikan dict berisi metrik
    OLS (R², RMSE, condition number) untuk dikomparasi dengan PLS.
    """
    print("=" * 60)
    print("ANALISIS OLS (ORDINARY LEAST SQUARES) REGRESSION")
    print("=" * 60)
    
    if not os.path.exists(input_csv):
        print(f"❌ File tidak ditemukan: {input_csv}")
        return
        
    df = pd.read_csv(input_csv)
    
    # Fitur untuk OLS
    ols_features = [
        'Luas Bangunan (m²)', 'Luas Tanah (m²)', 'Kamar Tidur', 'Kamar Mandi',
        'Jarak_ke_Pusat_Kota_km', 'Risiko_Banjir', 'Indeks_Kejahatan',
        'Skor_Legalitas', 'Skor_Fasilitas', 'Akses_Tol', 'Akses_Kereta',
        'NJOP_per_m2'
    ]
    
    available_features = [f for f in ols_features if f in df.columns]
    
    if len(available_features) == 0:
        print("❌ Tidak ada fitur yang tersedia untuk OLS.")
        return
        
    print(f"Menggunakan {len(available_features)} fitur untuk OLS Regression.")
    
    # Pre-processing (sama seperti PLS untuk komparasi yang adil)
    # Target: Rasio_Harga_NJOP — identik dengan PLS supaya bisa dibandingkan apple-to-apple
    target_candidates = ['Rasio_Harga_NJOP', 'Rasio_Harga_NJOP_per_m2']
    target_col = next((c for c in target_candidates if c in df.columns), None)
    if target_col is None:
        print(f"❌ Kolom target tidak ditemukan. Cek: {target_candidates}")
        return

    X_ols = df[available_features].copy()
    for col in ['Akses_Tol', 'Akses_Kereta']:
        if col in X_ols.columns:
            X_ols[col] = _encode_access(X_ols[col])
    X_ols = X_ols.apply(pd.to_numeric, errors='coerce').dropna()
    y_ols = pd.to_numeric(df.loc[X_ols.index, target_col], errors='coerce')
    valid = y_ols.notna() & np.isfinite(y_ols)
    X_ols = X_ols[valid]
    y_ols = y_ols[valid]
    
    # Buang ekstrem outlier (1% bawah, 1% atas)
    Q1 = y_ols.quantile(0.01)
    Q3 = y_ols.quantile(0.99)
    mask_outlier = (y_ols >= Q1) & (y_ols <= Q3)
    X_ols = X_ols[mask_outlier]
    y_ols = y_ols[mask_outlier]
    
    # Skewness check — log-transform hanya jika |skew| > 1
    skew = y_ols.skew()
    if abs(skew) > 1.0:
        y_ols_model = np.log1p(y_ols)
        print(f"⚠️ Target {target_col} skewed (skew={skew:.3f}), pakai log1p.")
    else:
        y_ols_model = y_ols
        print(f"✅ Target {target_col} cukup stabil (skew={skew:.3f}), tanpa log.")
    
    # Standardisasi agar koefisien bisa saling dibandingkan
    scaler_X = StandardScaler()
    X_scaled = scaler_X.fit_transform(X_ols)
    X_scaled_df = pd.DataFrame(X_scaled, columns=available_features)
    
    # Tambahkan konstan untuk statsmodels (intercept)
    X_scaled_df = sm.add_constant(X_scaled_df)
    
    # Fit OLS model
    model = sm.OLS(y_ols_model.values, X_scaled_df)
    results = model.fit()
    
    # Cetak hasil (Summary)
    print("\n📊 Hasil Regresi OLS:\n")
    print(results.summary())
    
    print("\n🌟 Kesimpulan OLS 🌟")
    print("Variabel dengan P>|t| (p-value) kurang dari 0.05 dianggap signifikan.")
    
    # Tampilkan hanya variabel signifikan
    pvalues = results.pvalues
    coefs = results.params
    
    sig_vars = pvalues[pvalues < 0.05].index.tolist()
    if 'const' in sig_vars:
        sig_vars.remove('const')
        
    print(f"\nVariabel yang signifikan secara statistik (p < 0.05):")
    for var in sig_vars:
        print(f"  - {var:25s} (Koef: {coefs[var]:+.4f})")
        
    print("\nPerhatikan Multikolinearitas (cek Cond. No.). Jika sangat tinggi,")
    print("maka PLS adalah pilihan yang lebih baik dari OLS untuk dataset ini.")

    if return_results:
        try:
            cond_no = float(getattr(results, "condition_number", 0.0))
        except Exception:
            cond_no = 0.0
        rmse = float(np.sqrt(np.mean(results.resid ** 2)))
        return {
            "ols_r2": float(results.rsquared),
            "ols_adjusted_r2": float(results.rsquared_adj),
            "ols_rmse": rmse,
            "condition_number_ols": cond_no,
            "n_samples": int(results.nobs),
            "p_values": results.pvalues.to_dict(),
        }

if __name__ == "__main__":
    run_ols_analysis('../data/final/properti_jabodetabek_enriched.csv')
