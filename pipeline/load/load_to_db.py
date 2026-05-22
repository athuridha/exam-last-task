import sqlite3
import pandas as pd
import os

def load_csv_to_sqlite(csv_path, db_path, table_name="Properti"):
    """
    Fungsi untuk memuat data CSV final langsung ke dalam database SQLite.
    Bisa digunakan untuk menginisialisasi database dari hasil pipeline.
    """
    if not os.path.exists(csv_path):
        print(f"❌ File CSV tidak ditemukan: {csv_path}")
        return

    print(f"⏳ Menyimpan data dari {csv_path} ke tabel '{table_name}' di database {db_path}...")
    
    try:
        df = pd.read_csv(csv_path)
        
        # Connect to SQLite
        conn = sqlite3.connect(db_path)
        
        # Save to database (replace jika sudah ada, atau append sesuai kebutuhan)
        df.to_sql(table_name, conn, if_exists='replace', index=False)
        
        conn.commit()
        conn.close()
        print(f"✅ Berhasil menyimpan {len(df)} baris ke tabel '{table_name}'.")
    except Exception as e:
        print(f"❌ Gagal menyimpan ke database: {e}")

if __name__ == "__main__":
    # Contoh pemakaian
    # load_csv_to_sqlite('../data/final/properti_jabodetabek_enriched.csv', '../../prisma/dev.db')
    pass
