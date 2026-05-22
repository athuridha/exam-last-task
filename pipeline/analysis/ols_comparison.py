import pandas as pd
import numpy as np
import os
import statsmodels.api as sm
from sklearn.preprocessing import StandardScaler

def run_ols_analysis(input_csv):
    """
    Menjalankan OLS (Ordinary Least Squares) Regression untuk analisis statistik
    signifikansi variabel (p-value).
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
    X_ols = df[available_features].dropna()
    y_ols = df.loc[X_ols.index, 'Harga']
    
    # Buang ekstrem outlier (1% bawah, 1% atas)
    Q1 = y_ols.quantile(0.01)
    Q3 = y_ols.quantile(0.99)
    mask_outlier = (y_ols >= Q1) & (y_ols <= Q3)
    X_ols = X_ols[mask_outlier]
    y_ols = y_ols[mask_outlier]
    
    # Log-transform target
    y_ols_log = np.log1p(y_ols)
    
    # Standardisasi agar koefisien bisa saling dibandingkan
    scaler_X = StandardScaler()
    X_scaled = scaler_X.fit_transform(X_ols)
    X_scaled_df = pd.DataFrame(X_scaled, columns=available_features)
    
    # Tambahkan konstan untuk statsmodels (intercept)
    X_scaled_df = sm.add_constant(X_scaled_df)
    
    # Fit OLS model
    model = sm.OLS(y_ols_log.values, X_scaled_df)
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

if __name__ == "__main__":
    run_ols_analysis('../data/final/properti_jabodetabek_enriched.csv')
