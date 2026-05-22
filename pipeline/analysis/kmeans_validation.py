import pandas as pd
import numpy as np
import os
from sklearn.cluster import KMeans
from sklearn.mixture import GaussianMixture
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    silhouette_score,
    davies_bouldin_score,
    adjusted_rand_score,
)


def _silhouette_subsample(X, labels, sample_size=5000, seed=42):
    """Silhouette pakai subsample untuk dataset besar."""
    rng = np.random.default_rng(seed)
    n = len(X)
    if n > sample_size:
        idx = rng.choice(n, sample_size, replace=False)
        return float(silhouette_score(X[idx], np.asarray(labels)[idx]))
    return float(silhouette_score(X, labels))


def run_kmeans_validation(input_csv, return_results=False):
    """
    Validasi segmentasi interval (Rasio Harga/NJOP) dengan dua metode unsupervised:
      1. K-Means Clustering (k=4)
      2. Gaussian Mixture Model (k=4) + BIC sweep

    Cluster di-rank berdasarkan median Rasio_Harga_NJOP supaya labelnya
    sebanding dengan Segmen_Harga (Rendah → Premium). Metrik yang
    dihasilkan: Silhouette, Davies-Bouldin, ARI vs segmentasi interval,
    dan k optimal versi BIC.
    """
    print("=" * 60)
    print("VALIDASI SEGMENTASI — K-Means + GMM (k=4)")
    print("=" * 60)

    if not os.path.exists(input_csv):
        print(f"❌ File tidak ditemukan: {input_csv}")
        return

    df = pd.read_csv(input_csv)

    target_col = 'Rasio_Harga_NJOP'
    if 'Segmen_Harga_Encoded' not in df.columns or target_col not in df.columns:
        print("❌ Butuh kolom 'Segmen_Harga_Encoded' dan 'Rasio_Harga_NJOP'.")
        return

    # Feature space yang relevan untuk struktur rasio (mirror dengan PLS)
    feature_candidates = [
        'Jarak_ke_Pusat_Kota_km', 'Skor_Fasilitas', 'NJOP_per_m2',
        'Risiko_Banjir', 'Indeks_Kejahatan', 'Skor_Legalitas',
        'Luas Tanah (m²)', 'Luas Bangunan (m²)',
    ]
    features = [c for c in feature_candidates if c in df.columns]
    print(f"Fitur clustering: {len(features)}")

    df_clean = df.dropna(subset=features + ['Segmen_Harga_Encoded', target_col]).copy()
    # Buang outlier 1% di rasio
    q1, q3 = df_clean[target_col].quantile([0.01, 0.99])
    df_clean = df_clean[(df_clean[target_col] >= q1) & (df_clean[target_col] <= q3)]

    X = df_clean[features].values
    X_scaled = StandardScaler().fit_transform(X)
    n_clusters = 4

    # --- K-Means ---
    print(f"\n⏳ K-Means k={n_clusters}...")
    km = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    km_labels = km.fit_predict(X_scaled)

    sil_km = _silhouette_subsample(X_scaled, km_labels)
    db_km = float(davies_bouldin_score(X_scaled, km_labels))
    print(f"  Silhouette : {sil_km:.4f}")
    print(f"  DB Index   : {db_km:.4f}")

    # Map cluster id ke nama segmen berdasarkan rank median Rasio
    df_clean['_km'] = km_labels
    rasio_per_cluster = df_clean.groupby('_km')[target_col].median().sort_values()
    seg_names = ['Rendah', 'Menengah', 'Tinggi', 'Premium']
    seg_to_idx = {s: i for i, s in enumerate(seg_names)}
    cluster_to_seg = {cid: seg_names[i] for i, cid in enumerate(rasio_per_cluster.index)}
    df_clean['_km_seg'] = df_clean['_km'].map(cluster_to_seg)
    df_clean['_km_seg_idx'] = df_clean['_km_seg'].map(seg_to_idx)

    ari_km = float(adjusted_rand_score(
        df_clean['Segmen_Harga_Encoded'], df_clean['_km_seg_idx']
    ))
    print(f"  ARI vs Segmen Interval: {ari_km:.4f}")

    print("\n📊 Profil cluster K-Means (rank by median Rasio):")
    for cid, rasio_med in rasio_per_cluster.items():
        seg = cluster_to_seg[cid]
        n = (df_clean['_km'] == cid).sum()
        print(f"  Cluster {cid} → {seg:10s}: median rasio={rasio_med:.2f}× | n={n}")

    print("\n📊 Cross-Tabulation K-Means(mapped) vs Segmen Interval (%):")
    ct = pd.crosstab(df_clean['_km_seg'], df_clean['Segmen_Harga'],
                     normalize='index') * 100
    print(ct.round(1).to_string())

    # --- GMM ---
    print(f"\n⏳ Gaussian Mixture k={n_clusters}...")
    gmm = GaussianMixture(n_components=n_clusters, random_state=42)
    gmm_labels = gmm.fit_predict(X_scaled)
    sil_gmm = _silhouette_subsample(X_scaled, gmm_labels)
    db_gmm = float(davies_bouldin_score(X_scaled, gmm_labels))

    df_clean['_gmm'] = gmm_labels
    rasio_per_gmm = df_clean.groupby('_gmm')[target_col].median().sort_values()
    gmm_to_seg = {cid: seg_names[i] for i, cid in enumerate(rasio_per_gmm.index)}
    df_clean['_gmm_seg_idx'] = df_clean['_gmm'].map(
        lambda cid: seg_to_idx[gmm_to_seg[cid]]
    )
    ari_gmm = float(adjusted_rand_score(
        df_clean['Segmen_Harga_Encoded'], df_clean['_gmm_seg_idx']
    ))
    print(f"  Silhouette : {sil_gmm:.4f}")
    print(f"  DB Index   : {db_gmm:.4f}")
    print(f"  ARI vs Segmen Interval: {ari_gmm:.4f}")

    # BIC sweep untuk cari k optimal GMM
    print("\n⏳ BIC sweep GMM k=2..8...")
    bic_scores = {}
    sample = X_scaled if len(X_scaled) <= 8000 else X_scaled[
        np.random.default_rng(42).choice(len(X_scaled), 8000, replace=False)
    ]
    for k in range(2, 9):
        try:
            g = GaussianMixture(n_components=k, random_state=42).fit(sample)
            bic_scores[k] = float(g.bic(sample))
        except Exception:
            bic_scores[k] = None
    valid_bic = {k: v for k, v in bic_scores.items() if v is not None}
    bic_optimal = min(valid_bic, key=valid_bic.get) if valid_bic else None
    print(f"  BIC scores: " + ", ".join(f"k={k}:{v:.0f}" for k, v in valid_bic.items()))
    print(f"  k optimal (BIC minimum): {bic_optimal}")

    # Silhouette interval (segmen pakar) — hitung di feature space yang sama
    sil_interval = _silhouette_subsample(
        X_scaled, df_clean['Segmen_Harga_Encoded'].values
    )
    print(f"\n📈 Silhouette segmentasi interval (pakar) : {sil_interval:.4f}")
    print(f"📈 Silhouette K-Means                       : {sil_km:.4f}")
    print(f"📈 Silhouette GMM                           : {sil_gmm:.4f}")

    if return_results:
        return {
            "n_clusters": int(n_clusters),
            "silhouette_score_interval": float(sil_interval),
            "silhouette_score_kmeans": float(sil_km),
            "silhouette_score_gmm": float(sil_gmm),
            "davies_bouldin_kmeans": db_km,
            "davies_bouldin_gmm": db_gmm,
            "ari_interval_vs_kmeans": ari_km,
            "ari_interval_vs_gmm": ari_gmm,
            "bic_optimal_k_gmm": int(bic_optimal) if bic_optimal else None,
        }


if __name__ == "__main__":
    run_kmeans_validation('../data/final/properti_jabodetabek_enriched.csv')
