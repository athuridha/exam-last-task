import pandas as pd
import numpy as np

def _parse_harga(harga_str):
    """
    Mengubah format string 'Rp 3.250.000.000' menjadi angka (integer).
    """
    if pd.isna(harga_str):
        return np.nan
    # Hapus 'Rp ', titik, spasi, dan pastikan huruf kecil
    h = str(harga_str).lower().replace('rp', '').replace('.', '').replace(' ', '').strip()
    
    # Kadang ada penulisan seperti '3,25 miliar' dsb.
    # Namun format standard dari scrape kita adalah 'Rp 3.250.000.000'
    try:
        return int(h)
    except:
        return np.nan

def clean_property_data(df):
    """
    Membersihkan data properti mentah hasil scraping dari Rumah123.
    """
    print("Mulai membersihkan data mentah...")
    
    # 1. Menghapus duplikat
    initial_len = len(df)
    # Gunakan URL sebagai unique identifier jika ada
    if 'URL Properti' in df.columns:
        df = df.drop_duplicates(subset=['URL Properti'])
    else:
        df = df.drop_duplicates()
    print(f"Menghapus {initial_len - len(df)} baris duplikat.")
    
    # 2. Parsing Harga
    if 'Harga (IDR)' in df.columns and 'Harga' not in df.columns:
        df['Harga'] = df['Harga (IDR)'].apply(_parse_harga)
        
    # Drop yang tidak punya Harga
    df = df.dropna(subset=['Harga'])
    
    # 3. Parsing Lokasi menjadi Area dan Kota
    if 'Lokasi' in df.columns:
        def split_lokasi(lokasi_str):
            if pd.isna(lokasi_str):
                return None, None
            parts = [p.strip() for p in str(lokasi_str).split(',')]
            if len(parts) >= 2:
                # Format: "Area, Kota" (misal: "Sunter, Jakarta Utara")
                # Area bisa mengandung koma juga, jadi ambil elemen terakhir sebagai Kota
                kota = parts[-1]
                area = ", ".join(parts[:-1])
                return area, kota
            return str(lokasi_str), str(lokasi_str)
            
        lokasi_parsed = df['Lokasi'].apply(split_lokasi)
        df['Area'] = [p[0] for p in lokasi_parsed]
        df['Kota'] = [p[1] for p in lokasi_parsed]
    
    # 4. Menentukan Wilayah berdasarkan Kota
    def get_wilayah(kota):
        if pd.isna(kota): return None
        k = str(kota).lower()
        if 'jakarta' in k: return 'Jakarta'
        if 'bogor' in k: return 'Bogor'
        if 'depok' in k: return 'Depok'
        if 'tangerang' in k: return 'Tangerang'
        if 'bekasi' in k: return 'Bekasi'
        return 'Lainnya'
        
    if 'Kota' in df.columns:
        df['Wilayah'] = df['Kota'].apply(get_wilayah)
        
    # 5. Fitur Dasar Luas dan Kamar
    if 'Kamar Tidur' in df.columns and 'Kamar Mandi' in df.columns:
        df['Kamar Tidur'] = pd.to_numeric(df['Kamar Tidur'], errors='coerce').fillna(0)
        df['Kamar Mandi'] = pd.to_numeric(df['Kamar Mandi'], errors='coerce').fillna(0)
        df['Total_Kamar'] = df['Kamar Tidur'] + df['Kamar Mandi']
        
    # 6. Fitur Luas dan Turunannya (Rasio & Harga per m2)
    luas_cols = ['Luas Bangunan (m²)', 'Luas Tanah (m²)']
    for col in luas_cols:
        if col in df.columns:
            # Kadang ada string ' m2' dsb
            df[col] = pd.to_numeric(df[col].astype(str).str.replace(r'[^\d.]', '', regex=True), errors='coerce')
            
    # Hapus baris yang luas tanah atau bangunannya kosong / 0
    df = df.dropna(subset=luas_cols)
    df = df[(df['Luas Tanah (m²)'] > 0) & (df['Luas Bangunan (m²)'] > 0)]
    
    df['Rasio_Bangunan_Tanah'] = df['Luas Bangunan (m²)'] / df['Luas Tanah (m²)']
    
    # Batasi rasio yang tidak masuk akal (misal salah input luas bangunan 1000 tapi tanah 10)
    # Tapi kita biarkan dulu, atau handle dengan batas atas (misal apartemen)
    df['Harga_per_m2_Bangunan'] = df['Harga'] / df['Luas Bangunan (m²)']
    df['Harga_per_m2_Tanah'] = df['Harga'] / df['Luas Tanah (m²)']
    
    # Hapus outlier ekstrem (opsional, tergantung dari analisis EDA sebelumnya)
    # Misalnya, hapus yang harganya < 50 Juta atau > 500 Miliar (indikasi salah input)
    df = df[(df['Harga'] >= 50_000_000) & (df['Harga'] <= 500_000_000_000)]
    
    print("Pembersihan data selesai.")
    return df
