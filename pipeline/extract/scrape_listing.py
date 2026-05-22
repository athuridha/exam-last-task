"""
Scrape Listing or Geocode Property (Contoh)

File ini dapat digunakan sebagai referensi untuk mendapatkan koordinat (latitude, longitude)
dari alamat listing properti yang tidak memiliki koordinat.

Karena data listing utama (rumah123_1770940489084.csv) sudah memiliki koordinat,
script ini disediakan sebagai contoh/template jika ada data baru yang butuh di-geocode.
"""
import pandas as pd
from geopy.geocoders import Nominatim
from geopy.extra.rate_limiter import RateLimiter
import time

def geocode_address(address, user_agent="properti_geocoder_123"):
    """
    Fungsi untuk mencari latitude dan longitude dari teks alamat.
    """
    geolocator = Nominatim(user_agent=user_agent)
    
    # Menggunakan rate limiter agar tidak diblokir oleh Nominatim (1 request per detik)
    geocode = RateLimiter(geolocator.geocode, min_delay_seconds=1.5)
    
    try:
        location = geocode(address)
        if location:
            return location.latitude, location.longitude
        else:
            return None, None
    except Exception as e:
        print(f"Error geocoding {address}: {e}")
        return None, None

def fill_missing_coordinates(df):
    """
    Fungsi untuk mengisi kolom 'latitude' dan 'longitude' yang kosong pada DataFrame.
    Memerlukan kolom 'alamat' atau 'lokasi'.
    """
    print(f"Mengecek data yang tidak memiliki koordinat...")
    
    # Misalkan kolom aslinya bernama 'lokasi'
    if 'lokasi' not in df.columns:
        print("Kolom 'lokasi' tidak ditemukan!")
        return df
        
    mask_missing = df['latitude'].isna() | df['longitude'].isna()
    missing_count = mask_missing.sum()
    
    if missing_count == 0:
        print("Semua data sudah memiliki koordinat.")
        return df
        
    print(f"Ditemukan {missing_count} baris tanpa koordinat. Memulai geocoding...")
    
    for idx, row in df[mask_missing].iterrows():
        alamat = row['lokasi']
        print(f"Geocoding: {alamat}...")
        lat, lng = geocode_address(alamat)
        if lat and lng:
            df.at[idx, 'latitude'] = lat
            df.at[idx, 'longitude'] = lng
            print(f"  -> Sukses: {lat}, {lng}")
        else:
            print(f"  -> Gagal mendapatkan koordinat.")
            
    return df

if __name__ == "__main__":
    # Contoh Penggunaan:
    print("Testing Geocoding: 'Monas, Jakarta Pusat'")
    lat, lng = geocode_address("Monumen Nasional, Jakarta Pusat")
    print(f"Hasil: {lat}, {lng}")
