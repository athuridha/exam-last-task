import pandas as pd
import os
import sys

# Tambahkan path project ke sys.path agar bisa import module pipeline
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import RAW_DATA_PATH, CLEANED_DATA_PATH, REFERENCE_DIR

def load_raw_data():
    if not os.path.exists(RAW_DATA_PATH):
        raise FileNotFoundError(f"Raw data not found at {RAW_DATA_PATH}")
    return pd.read_csv(RAW_DATA_PATH)

def load_cleaned_data():
    if not os.path.exists(CLEANED_DATA_PATH):
        raise FileNotFoundError(f"Cleaned data not found at {CLEANED_DATA_PATH}")
    return pd.read_csv(CLEANED_DATA_PATH)

def load_references():
    kec_df = pd.read_csv(os.path.join(REFERENCE_DIR, 'koordinat_kecamatan.csv'))
    stasiun = pd.read_csv(os.path.join(REFERENCE_DIR, 'stasiun_kereta.csv'))
    tol = pd.read_csv(os.path.join(REFERENCE_DIR, 'gerbang_tol.csv'))
    fas = pd.read_csv(os.path.join(REFERENCE_DIR, 'fasilitas_publik.csv'))
    
    # Split fasilitas
    mall = fas[fas['Jenis'] == 'Mall']
    rs = fas[fas['Jenis'] == 'Rumah Sakit']
    tk = fas[fas['Jenis'] == 'TK']
    sd = fas[fas['Jenis'] == 'SD']
    smp = fas[fas['Jenis'] == 'SMP']
    sma = fas[fas['Jenis'] == 'SMA']
    univ = fas[fas['Jenis'] == 'Universitas']
    
    return {
        'kecamatan': kec_df,
        'stasiun': stasiun,
        'tol': tol,
        'mall': mall,
        'rs': rs,
        'tk': tk,
        'sd': sd,
        'smp': smp,
        'sma': sma,
        'univ': univ
    }

def load_flood_risk():
    flood_path = os.path.join(REFERENCE_DIR, 'risiko_banjir_berita.csv')
    if os.path.exists(flood_path):
        return pd.read_csv(flood_path)[['Kecamatan', 'Kota', 'Risiko_Banjir']]
    return None

def load_crime_risk():
    crime_path = os.path.join(REFERENCE_DIR, 'risiko_kejahatan_berita.csv')
    if os.path.exists(crime_path):
        return pd.read_csv(crime_path)[['Kecamatan', 'Kota', 'Risiko_Kejahatan']]
    return None
