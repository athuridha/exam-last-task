import pandas as pd
import numpy as np
import os

def segmentasi_harga(harga, njop_per_m2, luas_tanah=None, harga_per_m2=None):
    """
    Segmentasi harga berbasis rasio Harga/NJOP:
    - Rendah   : rasio < 1x
    - Menengah : 1x - <2x
    - Tinggi   : 2x - <3x
    - Premium  : >= 3x

    Rasio dihitung menggunakan harga per m2:
    rasio = (harga_per_m2) / NJOP_per_m2

    Jika harga_per_m2 tidak tersedia, dihitung dari harga / luas_tanah.
    """
    if pd.isna(njop_per_m2) or njop_per_m2 <= 0:
        return np.nan

    if pd.isna(harga_per_m2):
        if pd.isna(harga) or pd.isna(luas_tanah) or luas_tanah <= 0:
            return np.nan
        harga_per_m2 = harga / luas_tanah

    rasio = harga_per_m2 / njop_per_m2

    if pd.isna(rasio):
        return np.nan
    if rasio < 1:
        return 'Rendah'
    elif rasio < 2:
        return 'Menengah'
    elif rasio < 3:
        return 'Tinggi'
    else:
        return 'Premium'

def apply_segmentation(df):
    """
    Apply segmentation logic to dataframe and return modified dataframe
    """
    if 'Harga' not in df.columns or 'NJOP_per_m2' not in df.columns:
        print("❌ Kolom wajib tidak lengkap. Minimal harus ada: 'Harga' dan 'NJOP_per_m2'.")
        return df

    harga_per_m2_candidates = ['Harga_per_m2', 'Harga_per_m2_Tanah']
    luas_candidates = ['Luas_Tanah', 'Luas Tanah (m²)']

    harga_per_m2_col = next((c for c in harga_per_m2_candidates if c in df.columns), None)
    luas_col = next((c for c in luas_candidates if c in df.columns), None)

    if harga_per_m2_col is None and luas_col is None:
        print("❌ Butuh salah satu kolom ini sebelum segmentasi: 'Harga_per_m2' (atau 'Harga_per_m2_Tanah') ATAU 'Luas_Tanah' (atau 'Luas Tanah (m²)').")
        return df

    if harga_per_m2_col is not None:
        harga_per_m2_series = df[harga_per_m2_col]
    else:
        harga_per_m2_series = df['Harga'] / df[luas_col].replace({0: np.nan})

    df['Rasio_Harga_NJOP'] = harga_per_m2_series / df['NJOP_per_m2'].replace({0: np.nan})

    print("⏳ Menambahkan Segmentasi Harga...")
    if harga_per_m2_col is not None:
        df['Segmen_Harga'] = df.apply(
            lambda row: segmentasi_harga(
                row['Harga'],
                row['NJOP_per_m2'],
                luas_tanah=row[luas_col] if luas_col is not None else np.nan,
                harga_per_m2=row[harga_per_m2_col]
            ),
            axis=1
        )
    else:
        df['Segmen_Harga'] = df.apply(
            lambda row: segmentasi_harga(
                row['Harga'],
                row['NJOP_per_m2'],
                luas_tanah=row[luas_col],
                harga_per_m2=np.nan
            ),
            axis=1
        )
    
    # Categorize explicitly for ordering
    categories = ['Rendah', 'Menengah', 'Tinggi', 'Premium']
    df['Segmen_Harga'] = pd.Categorical(df['Segmen_Harga'], 
                                         categories=categories,
                                         ordered=True)
                                         
    # Encode segmen untuk model machine learning
    segmen_order = {cat: i for i, cat in enumerate(categories)}
    df['Segmen_Harga_Encoded'] = df['Segmen_Harga'].map(segmen_order)
    
    # Print distribution
    print("\n📊 Distribusi Segmen Harga:")
    counts = df['Segmen_Harga'].value_counts()
    for cat in categories:
        count = counts.get(cat, 0)
        pct = count / len(df) * 100
        print(f"  {cat:20s}: {count:6d} ({pct:5.1f}%)")

    rasio_valid = df['Rasio_Harga_NJOP'].dropna()
    if len(rasio_valid) > 0:
        print(f"\n📈 Ringkasan Rasio_Harga_NJOP: min={rasio_valid.min():.3f}, median={rasio_valid.median():.3f}, max={rasio_valid.max():.3f}")
        
    return df

if __name__ == "__main__":
    # Test script directly
    input_path = '../data/final/properti_jabodetabek_enriched.csv'
    if os.path.exists(input_path):
        df = pd.read_csv(input_path)
        df = apply_segmentation(df)
        df.to_csv(input_path, index=False)
        print("✅ Segmentasi harga berhasil ditambahkan ke dataset final.")
    else:
        print(f"❌ File tidak ditemukan: {input_path}")
