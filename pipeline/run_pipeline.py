import sys
import os
import time

# Tambahkan path ke sys agar package 'pipeline' dikenali
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pipeline.extract.loader import load_raw_data, load_references, load_flood_risk, load_crime_risk
from pipeline.transform.clean_data import clean_property_data
from pipeline.transform.feature_engineering import calculate_facility_scores, enrich_features
from pipeline.load.save_data import save_enriched_data, save_intermediate_data

import subprocess

def run_generators():
    print("\n[0/3] REFRESHING REFERENCE DATA...")
    generators_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "extract")
    scripts = [
        "scrape_njop.py",
        "scrape_risiko_banjir.py",
        "scrape_risiko_kejahatan.py",
        "scrape_fasilitas.py",
        "update_njop_json.py"
    ]
    for script in scripts:
        script_path = os.path.join(generators_dir, script)
        if os.path.exists(script_path):
            print(f"  ⏳ Menjalankan {script}...")
            try:
                subprocess.run([sys.executable, script_path], check=True)
                print(f"  ✅ {script} selesai.")
            except Exception as e:
                print(f"  ❌ Gagal menjalankan {script}: {e}")
        else:
            print(f"  ⚠️ Script {script} tidak ditemukan di {generators_dir}")

def run():
    print("="*60)
    print("🚀 MEMULAI PIPELINE ETL PROPERTI JABODETABEK")
    print("="*60)
    
    start_time = time.time()
    
    # ---------------------------------------------------------
    # 1. EXTRACT DATA RAW
    # ---------------------------------------------------------
    print("\n[1/5] EXTRACTING RAW DATA...")
    try:
        df_raw = load_raw_data()
        print(f"  ✅ Data raw loaded: {len(df_raw)} baris.")
    except Exception as e:
        print(f"❌ Gagal pada proses Extract: {e}")
        return

    # ---------------------------------------------------------
    # 2. CLEANING
    # ---------------------------------------------------------
    print("\n[2/5] CLEANING DATA...")
    try:
        print("  ⏳ Membersihkan data mentah...")
        df_cleaned = clean_property_data(df_raw)
        print(f"  ✅ Pembersihan selesai: {len(df_cleaned)} baris.")
    except Exception as e:
        print(f"❌ Gagal pada proses Cleaning: {e}")
        return

    # ---------------------------------------------------------
    # 3. MENGHASILKAN DATA REFERENSI
    # ---------------------------------------------------------
    print("\n[3/5] MENGHASILKAN DATA REFERENSI...")
    if "--refresh-refs" in sys.argv:
        run_generators()
    else:
        print("  ⏭️ Skip generate data referensi (gunakan flag --refresh-refs untuk menjalankan ulang scraper referensi).")
        
    try:
        print("  ⏳ Memuat data referensi (fasilitas, njop, banjir, kejahatan)...")
        refs = load_references()
        print(f"  ✅ Referensi loaded: {len(refs['kecamatan'])} kecamatan, {len(refs['stasiun'])} stasiun, {len(refs['tol'])} pintu tol, dll.")
        
        flood_risk_df = load_flood_risk()
        if flood_risk_df is not None:
            print(f"  ✅ Data risiko banjir loaded: {len(flood_risk_df)} data kecamatan.")
        else:
            print("  ⚠️ Data risiko banjir tidak ditemukan. Menggunakan fallback.")

        crime_risk_df = load_crime_risk()
        if crime_risk_df is not None:
            print(f"  ✅ Data risiko kejahatan loaded: {len(crime_risk_df)} data kecamatan.")
        else:
            print("  ⚠️ Data risiko kejahatan tidak ditemukan. Menggunakan fallback hardcoded.")
    except Exception as e:
        print(f"❌ Gagal memuat data referensi: {e}")
        return

    # ---------------------------------------------------------
    # 4. TRANSFORM & FEATURE ENGINEERING
    # ---------------------------------------------------------
    print("\n[4/5] TRANSFORMING & ENRICHING DATA...")
    try:
        print("  ⏳ Menghitung skor fasilitas per kecamatan (Haversine distance)...")
        skor_df = calculate_facility_scores(refs['kecamatan'], refs)
        print("  ✅ Skor fasilitas berhasil dihitung.")
        
        print("  ⏳ Memperkaya dataset (Feature Engineering)...")
        df_enriched = enrich_features(df_cleaned, skor_df, flood_risk_df, crime_risk_df)
        print("  ✅ Feature engineering selesai.")
    except Exception as e:
        print(f"❌ Gagal pada proses Transform: {e}")
        return

    # ---------------------------------------------------------
    # 5. LOAD (SAVING)
    # ---------------------------------------------------------
    print("\n[5/5] LOADING DATA (SAVING)...")
    try:
        save_intermediate_data(df_cleaned, df_enriched)
        save_enriched_data(df_enriched)
    except Exception as e:
        print(f"❌ Gagal pada proses Load: {e}")
        return

    elapsed = time.time() - start_time
    print("="*60)
    print(f"✨ PIPELINE SELESAI DALAM {elapsed:.2f} DETIK")
    print("="*60)

if __name__ == "__main__":
    run()
