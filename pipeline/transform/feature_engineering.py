import pandas as pd
import numpy as np
import sys
import os
from math import radians, cos, sin, asin, sqrt

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import MONAS_LAT, MONAS_LNG, NJOP_PER_KOTA, INDEKS_KEJAHATAN

def haversine_km(lat1, lon1, lat2, lon2):
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    return 6371 * 2 * asin(sqrt(a))

def calculate_facility_scores(kecamatan_df, refs):
    """
    Calculate distances and scores for facilities for each kecamatan.
    Based on the logic in buat_csv_baru.py
    """
    results = []
    for _, kec_row in kecamatan_df.iterrows():
        kecamatan = kec_row['Kecamatan']
        kota = kec_row['Kota']
        lat, lng = kec_row['Lat'], kec_row['Lng']
        
        # --- Akses Kereta ---
        jarak_min_kereta = float('inf')
        stasiun_terdekat = '-'
        for _, st in refs['stasiun'].iterrows():
            d = haversine_km(lat, lng, st['Lat'], st['Lng'])
            if d < jarak_min_kereta:
                jarak_min_kereta = d
                stasiun_terdekat = st['Nama']
        akses_kereta = 'Mudah' if jarak_min_kereta <= 5.0 else 'Terbatas'
        
        # --- Akses Tol ---
        jarak_min_tol = float('inf')
        tol_terdekat = '-'
        for _, t in refs['tol'].iterrows():
            d = haversine_km(lat, lng, t['Lat'], t['Lng'])
            if d < jarak_min_tol:
                jarak_min_tol = d
                tol_terdekat = t['Nama']
        akses_tol = 'Mudah' if jarak_min_tol <= 8.0 else 'Terbatas'
        
        # --- Mall ---
        mall_dists = [(haversine_km(lat, lng, m['Lat'], m['Lng']), m['Nama']) for _, m in refs['mall'].iterrows()]
        mall_dists.sort(key=lambda x: x[0])
        n_mall = sum(1 for d, _ in mall_dists if d <= 5.0)
        jarak_mall = round(mall_dists[0][0], 2) if mall_dists else 99.0
        mall_terdekat = mall_dists[0][1] if mall_dists else '-'
        fasilitas_mall = 'Lengkap' if n_mall >= 2 else 'Kurang Lengkap'
        
        # --- RS ---
        rs_dists = [(haversine_km(lat, lng, r['Lat'], r['Lng']), r['Nama']) for _, r in refs['rs'].iterrows()]
        rs_dists.sort(key=lambda x: x[0])
        n_rs = sum(1 for d, _ in rs_dists if d <= 5.0)
        jarak_rs = round(rs_dists[0][0], 2) if rs_dists else 99.0
        rs_terdekat = rs_dists[0][1] if rs_dists else '-'
        fasilitas_rs = 'Lengkap' if n_rs >= 1 else 'Kurang Lengkap'
        
        # --- Pendidikan ---
        n_tk = sum(1 for _, r in refs['tk'].iterrows() if haversine_km(lat, lng, r['Lat'], r['Lng']) <= 3.0)
        n_sd = sum(1 for _, r in refs['sd'].iterrows() if haversine_km(lat, lng, r['Lat'], r['Lng']) <= 3.0)
        n_smp = sum(1 for _, r in refs['smp'].iterrows() if haversine_km(lat, lng, r['Lat'], r['Lng']) <= 5.0)
        n_sma = sum(1 for _, r in refs['sma'].iterrows() if haversine_km(lat, lng, r['Lat'], r['Lng']) <= 5.0)
        n_univ = sum(1 for _, r in refs['univ'].iterrows() if haversine_km(lat, lng, r['Lat'], r['Lng']) <= 10.0)
        jenjang_tersedia = sum([n_tk > 0, n_sd > 0, n_smp > 0, n_sma > 0, n_univ > 0])
        total_pendidikan = n_tk + n_sd + n_smp + n_sma + n_univ
        fasilitas_pendidikan = 'Lengkap' if jenjang_tersedia >= 3 else 'Kurang Lengkap'
        
        # --- Skor Fasilitas (0-5) ---
        skor = 0.0
        skor += min(n_mall / 2.0, 1.0)          
        skor += min(n_rs, 1.0)                   
        skor += min(jenjang_tersedia / 3.0, 1.0) 
        skor += 1.0 if jarak_min_tol <= 8.0 else 0.5 if jarak_min_tol <= 15.0 else 0.0  
        skor += 1.0 if jarak_min_kereta <= 5.0 else 0.5 if jarak_min_kereta <= 10.0 else 0.0  
        skor_fasilitas = round(skor, 2)
        
        results.append({
            'Kecamatan': kecamatan,
            'Kota': kota,
            'Lat_Kecamatan': lat,
            'Lng_Kecamatan': lng,
            'Jarak_Stasiun_km': round(jarak_min_kereta, 2),
            'Stasiun_Terdekat': stasiun_terdekat,
            'Akses_Kereta': akses_kereta,
            'Jarak_Tol_km': round(jarak_min_tol, 2),
            'Tol_Terdekat': tol_terdekat,
            'Akses_Tol': akses_tol,
            'Mall_dalam_5km': n_mall,
            'Jarak_Mall_km': jarak_mall,
            'Mall_Terdekat': mall_terdekat,
            'Fasilitas_Mall': fasilitas_mall,
            'RS_dalam_5km': n_rs,
            'Jarak_RS_km': jarak_rs,
            'RS_Terdekat': rs_terdekat,
            'Fasilitas_RS': fasilitas_rs,
            'TK_dalam_3km': n_tk,
            'SD_dalam_3km': n_sd,
            'SMP_dalam_5km': n_smp,
            'SMA_dalam_5km': n_sma,
            'Univ_dalam_10km': n_univ,
            'Total_Pendidikan': total_pendidikan,
            'Jenjang_Pendidikan': jenjang_tersedia,
            'Fasilitas_Pendidikan': fasilitas_pendidikan,
            'Skor_Fasilitas': skor_fasilitas,
        })
    return pd.DataFrame(results)

def detect_sertifikat(judul):
    judul_lower = str(judul).lower()
    if 'shm' in judul_lower or 'sertifikat hak milik' in judul_lower or 'hak milik' in judul_lower:
        return 'SHM'
    elif 'shgb' in judul_lower or 'hgb' in judul_lower or 'hak guna bangunan' in judul_lower:
        return 'SHGB'
    elif 'strata' in judul_lower or 'strata title' in judul_lower:
        return 'Strata Title'
    elif 'girik' in judul_lower or 'letter c' in judul_lower:
        return 'Girik'
    elif 'ppjb' in judul_lower:
        return 'PPJB'
    elif 'ajb' in judul_lower:
        return 'AJB'
    elif 'sertifikat' in judul_lower or 'sertif' in judul_lower:
        return 'Ada Sertifikat'
    else:
        return 'Tidak Disebutkan'

def enrich_features(df, skor_df, flood_risk_df, crime_risk_df=None):
    """
    Merge spatial score and references, apply data engineering logic.
    """
    import pandas as pd
    import numpy as np
    
    # 1. MAPPING AREA -> KECAMATAN
    from pipeline.transform.mapping_kecamatan import AREA_TO_KECAMATAN
    
    def get_kecamatan(area):
        if area in AREA_TO_KECAMATAN:
            return AREA_TO_KECAMATAN[area]
        area_lower = str(area).lower()
        for key, kec in AREA_TO_KECAMATAN.items():
            if key.lower() in area_lower or area_lower in key.lower():
                return kec
        return None

    if 'Kecamatan' not in df.columns:
        df['Kecamatan'] = df['Area'].apply(get_kecamatan)

    # 2. MERGE SCORES (from calculate_facility_scores)
    merge_cols = ['Kecamatan', 'Kota', 'Lat_Kecamatan', 'Lng_Kecamatan',
                  'Akses_Kereta', 'Jarak_Stasiun_km', 'Stasiun_Terdekat',
                  'Akses_Tol', 'Jarak_Tol_km', 'Tol_Terdekat',
                  'Fasilitas_Mall', 'Mall_dalam_5km', 'Jarak_Mall_km', 'Mall_Terdekat',
                  'Fasilitas_RS', 'RS_dalam_5km', 'Jarak_RS_km', 'RS_Terdekat',
                  'Fasilitas_Pendidikan', 'Jenjang_Pendidikan',
                  'TK_dalam_3km', 'SD_dalam_3km', 'SMP_dalam_5km', 'SMA_dalam_5km', 'Univ_dalam_10km',
                  'Total_Pendidikan', 'Skor_Fasilitas']
                  
    cols_to_drop = [c for c in merge_cols if c in df.columns and c not in ['Kecamatan', 'Kota']]
    if cols_to_drop:
        df = df.drop(columns=cols_to_drop)
        
    df = df.merge(skor_df[merge_cols], on=['Kecamatan', 'Kota'], how='left')
    
    # Fill fallback per city for missing areas
    kota_stats = skor_df.groupby('Kota').agg({
        'Akses_Kereta': lambda x: x.mode().iloc[0] if len(x.mode()) > 0 else 'Terbatas',
        'Akses_Tol': lambda x: x.mode().iloc[0] if len(x.mode()) > 0 else 'Terbatas',
        'Fasilitas_Mall': lambda x: x.mode().iloc[0] if len(x.mode()) > 0 else 'Kurang Lengkap',
        'Fasilitas_RS': lambda x: x.mode().iloc[0] if len(x.mode()) > 0 else 'Kurang Lengkap',
        'Fasilitas_Pendidikan': lambda x: x.mode().iloc[0] if len(x.mode()) > 0 else 'Kurang Lengkap',
    }).to_dict('index')

    cat_cols = ['Akses_Kereta', 'Akses_Tol', 'Fasilitas_Mall', 'Fasilitas_RS', 'Fasilitas_Pendidikan']
    for col in cat_cols:
        mask = df[col].isna()
        if mask.any():
            df.loc[mask, col] = df.loc[mask, 'Kota'].map(
                {k: v.get(col) for k, v in kota_stats.items()}
            )
            
    num_fallback_cols = ['Lat_Kecamatan', 'Lng_Kecamatan',
                         'Jarak_Stasiun_km', 'Jarak_Tol_km', 'Mall_dalam_5km', 'Jarak_Mall_km',
                         'RS_dalam_5km', 'Jarak_RS_km', 'Jenjang_Pendidikan',
                         'TK_dalam_3km', 'SD_dalam_3km', 'SMP_dalam_5km', 'SMA_dalam_5km', 'Univ_dalam_10km',
                         'Total_Pendidikan', 'Skor_Fasilitas']
    kota_num = skor_df.groupby('Kota')[num_fallback_cols].median().to_dict('index')
    for col in num_fallback_cols:
        mask = df[col].isna()
        if mask.any():
            df.loc[mask, col] = df.loc[mask, 'Kota'].map(
                {k: v.get(col) for k, v in kota_num.items()}
            )

    for col in ['Stasiun_Terdekat', 'Tol_Terdekat', 'Mall_Terdekat', 'RS_Terdekat']:
        df[col] = df[col].fillna('-')

    # 3. ADVANCED ANALYTICS FEATURES
    # Jarak ke Monas
    df['Jarak_ke_Pusat_Kota_km'] = df.apply(
        lambda r: haversine_km(r['Lat_Kecamatan'], r['Lng_Kecamatan'], MONAS_LAT, MONAS_LNG)
        if pd.notna(r['Lat_Kecamatan']) else np.nan, axis=1
    )
    kota_jarak_median = df.groupby('Kota')['Jarak_ke_Pusat_Kota_km'].median()
    mask = df['Jarak_ke_Pusat_Kota_km'].isna()
    if mask.any():
        df.loc[mask, 'Jarak_ke_Pusat_Kota_km'] = df.loc[mask, 'Kota'].map(kota_jarak_median)

    df['Kategori_Jarak'] = pd.cut(df['Jarak_ke_Pusat_Kota_km'],
                                   bins=[0, 10, 20, 30, 50, 100],
                                   labels=['Sangat Dekat (<10km)', 'Dekat (10-20km)',
                                           'Sedang (20-30km)', 'Jauh (30-50km)', 'Sangat Jauh (>50km)'])

    # NJOP
    njop_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data_referensi', 'njop_per_kecamatan.csv')
    if os.path.exists(njop_file):
        njop_df = pd.read_csv(njop_file)
        # Handle duplicates just in case
        njop_df = njop_df.drop_duplicates(subset=['Kecamatan', 'Kota'])
        
        if 'NJOP_per_m2' in df.columns:
            df = df.drop(columns=['NJOP_per_m2'])
            
        df = df.merge(njop_df[['Kecamatan', 'Kota', 'NJOP_per_m2']], on=['Kecamatan', 'Kota'], how='left')
        
        # Fallback to config Kota dictionary if Kecamatan not found
        mask = df['NJOP_per_m2'].isna()
        if mask.any():
            df.loc[mask, 'NJOP_per_m2'] = df.loc[mask, 'Kota'].map(NJOP_PER_KOTA)
    else:
        df['NJOP_per_m2'] = df['Kota'].map(NJOP_PER_KOTA)

    df['Nilai_NJOP_Tanah'] = df['NJOP_per_m2'] * df.get('Luas Tanah (m²)', 0)

    # Flood Risk
    if flood_risk_df is not None:
        if 'Risiko_Banjir' in df.columns:
            df = df.drop(columns=['Risiko_Banjir'])
        df = df.merge(flood_risk_df, on=['Kecamatan', 'Kota'], how='left')
        df['Risiko_Banjir'] = df['Risiko_Banjir'].fillna(0.0)
    else:
        if 'Risiko_Banjir' not in df.columns:
            df['Risiko_Banjir'] = 0.0

    df['Kategori_Risiko_Banjir'] = pd.cut(df['Risiko_Banjir'],
                                           bins=[-0.01, 0.1, 0.3, 0.6, 1.01],
                                           labels=['Rendah', 'Sedang', 'Tinggi', 'Sangat Tinggi'])

    # Crime Risk (scraped from Google News, same approach as flood risk)
    if crime_risk_df is not None:
        if 'Risiko_Kejahatan' in df.columns:
            df = df.drop(columns=['Risiko_Kejahatan'])
        if 'Indeks_Kejahatan' in df.columns:
            df = df.drop(columns=['Indeks_Kejahatan'])
            
        df = df.merge(crime_risk_df, on=['Kecamatan', 'Kota'], how='left')
        df['Risiko_Kejahatan'] = df['Risiko_Kejahatan'].fillna(0.0)
        # Convert 0-1 scraped score to 1-5 scale for backward compatibility
        df['Indeks_Kejahatan'] = 1.0 + df['Risiko_Kejahatan'] * 4.0
    else:
        # Fallback: hardcoded Polda Metro Jaya / BPS data
        df['Indeks_Kejahatan'] = df['Kota'].map(INDEKS_KEJAHATAN)
        if 'Risiko_Kejahatan' not in df.columns:
            df['Risiko_Kejahatan'] = 0.0

    df['Kategori_Kejahatan'] = pd.cut(df['Indeks_Kejahatan'],
                                       bins=[0, 2, 3, 4, 5.1],
                                       labels=['Aman', 'Cukup Aman', 'Rawan', 'Sangat Rawan'])

    df['Kategori_Risiko_Kejahatan'] = pd.cut(df['Risiko_Kejahatan'],
                                              bins=[-0.01, 0.1, 0.3, 0.6, 1.01],
                                              labels=['Rendah', 'Sedang', 'Tinggi', 'Sangat Tinggi'])

    # Legalitas / Sertifikat
    df['Sertifikat'] = df['Judul'].apply(detect_sertifikat)
    skor_legalitas = {
        'SHM': 5, 'SHGB': 4, 'Strata Title': 3.5, 'Ada Sertifikat': 3,
        'AJB': 2.5, 'PPJB': 2, 'Girik': 1.5, 'Tidak Disebutkan': 2.5,
    }
    df['Skor_Legalitas'] = df['Sertifikat'].map(skor_legalitas)

    # Segmen Harga (Modular)
    from pipeline.transform.segmentasi import apply_segmentation
    df = apply_segmentation(df)
    
    return df
