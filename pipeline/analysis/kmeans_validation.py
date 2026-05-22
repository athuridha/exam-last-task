import pandas as pd
import numpy as np
import os
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score
import matplotlib.pyplot as plt
import seaborn as sns

def run_kmeans_validation(input_csv):
    """
    Validasi segmentasi manual (heuristik) dengan algoritma K-Means Clustering
    secara unsupervised.
    """
    print("=" * 60)
    print("ANALISIS K-MEANS CLUSTERING (VALIDASI SEGMENTASI)")
    print("=" * 60)
    
    if not os.path.exists(input_csv):
        print(f"❌ File tidak ditemukan: {input_csv}")
        return
        
    df = pd.read_csv(input_csv)
    
    if 'Segmen_Harga_Encoded' not in df.columns:
        print("❌ Dataset belum memiliki kolom segmentasi. Jalankan segmentasi.py dulu.")
        return
        
    # Menggunakan fitur yang relevan untuk clustering
    features = [
        'Luas Bangunan (m²)', 'Luas Tanah (m²)', 'Kamar Tidur', 'Kamar Mandi',
        'Jarak_ke_Pusat_Kota_km', 'NJOP_per_m2', 'Skor_Fasilitas', 
        'Akses_Transportasi_Avg'
    ]
    
    available_features = [f for f in features if f in df.columns]
    
    print(f"Menggunakan {len(available_features)} fitur untuk K-Means Clustering.")
    
    # Pre-processing
    df_clean = df.dropna(subset=available_features + ['Segmen_Harga_Encoded']).copy()
    
    # Buang ekstrem outlier pada Harga agar tidak merusak cluster
    Q1 = df_clean['Harga'].quantile(0.01)
    Q3 = df_clean['Harga'].quantile(0.99)
    df_clean = df_clean[(df_clean['Harga'] >= Q1) & (df_clean['Harga'] <= Q3)]
    
    X = df_clean[available_features]
    
    # Standardisasi
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Jumlah cluster ditetapkan 4 agar selaras dengan segmentasi rasio Harga/NJOP
    n_clusters = 4
    print(f"\n⏳ Menjalankan K-Means dengan K = {n_clusters} (Rendah, Menengah, Tinggi, Premium)...")
    
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    df_clean['Cluster_KMeans'] = kmeans.fit_predict(X_scaled)
    
    # Evaluasi dengan Silhouette Score (bisa memakan waktu untuk dataset besar)
    # Gunakan sample agar lebih cepat
    sample_size = min(5000, len(X_scaled))
    indices = np.random.choice(len(X_scaled), sample_size, replace=False)
    sil_score = silhouette_score(X_scaled[indices], df_clean['Cluster_KMeans'].iloc[indices])
    
    print(f"\n✅ Silhouette Score: {sil_score:.4f} (Mendekati 1 lebih baik)")
    
    # Bandingkan profil cluster K-Means vs Segmen Heuristik
    print("\n📊 Rata-rata Harga per Cluster (K-Means):")
    cluster_prices = df_clean.groupby('Cluster_KMeans')['Harga'].median().sort_values()
    
    # Map Cluster to Segment Name via ranking of median prices
    cluster_mapping = {}
    segmen_names = ['Rendah', 'Menengah', 'Tinggi', 'Premium']
    
    for i, (cluster_id, _) in enumerate(cluster_prices.items()):
        if i < len(segmen_names):
            cluster_mapping[cluster_id] = segmen_names[i]
            
    df_clean['Cluster_Mapped_Name'] = df_clean['Cluster_KMeans'].map(cluster_mapping)
    
    for cluster_id, median_price in cluster_prices.items():
        name = cluster_mapping.get(cluster_id, "Unknown")
        print(f"  Cluster {cluster_id} -> {name:15s}: Rp {median_price/1e9:.2f} Miliar")
        
    # Crosstab untuk melihat kecocokan antara K-Means dan Segmen Manual
    print("\n📊 Cross-Tabulation: K-Means (Mapped) vs Manual Heuristic")
    ct = pd.crosstab(df_clean['Cluster_Mapped_Name'], df_clean['Segmen_Harga'], normalize='index') * 100
    print(ct.round(1).to_string())
    
    print("\nKesimpulan:")
    print("Jika angka diagonal tinggi (mendekati 100%), berarti segmentasi heuristik (berbasis harga)")
    print("sangat sejalan dengan struktur intrinsik data yang ditemukan K-Means secara unsupervised.")

if __name__ == "__main__":
    run_kmeans_validation('../data/final/properti_jabodetabek_enriched.csv')
