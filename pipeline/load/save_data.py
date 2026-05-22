import os
import sys
import sqlite3

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import ENRICHED_DATA_PATH, OUTPUT_CLEANED_DATA_PATH, OUTPUT_FEATURES_DATA_PATH


def save_intermediate_data(df_cleaned, df_features):
    """
    Save the intermediate cleaned data and features data.
    """
    try:
        df_cleaned.to_csv(OUTPUT_CLEANED_DATA_PATH, index=False)
        print(f"✅ Data cleaned berhasil disimpan ke: {OUTPUT_CLEANED_DATA_PATH}")
        df_features.to_csv(OUTPUT_FEATURES_DATA_PATH, index=False)
        print(f"✅ Data with features berhasil disimpan ke: {OUTPUT_FEATURES_DATA_PATH}")
    except Exception as e:
        print(f"❌ Gagal menyimpan data intermediate: {e}")

def save_enriched_data(df):
    """
    Save the final enriched dataset and apply DB fixes.
    """
    try:
        df.to_csv(ENRICHED_DATA_PATH, index=False)
        print(f"✅ Data berhasil disimpan ke: {ENRICHED_DATA_PATH}")
        print(f"✅ Total baris: {len(df)}, Kolom: {len(df.columns)}")
        print(f"ℹ️ Load ke Postgres sekarang di-handle oleh 'node prisma/seed_prisma.js'")
    except Exception as e:
        print(f"❌ Gagal menyimpan data: {e}")
