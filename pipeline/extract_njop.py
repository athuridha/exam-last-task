import pandas as pd
import os

file_path = 'njop_jabodetabek_verified_audit.xlsx'
out_path = 'pipeline/data_referensi/njop_per_kecamatan.csv'

# Ensure directory exists
os.makedirs(os.path.dirname(out_path), exist_ok=True)

try:
    # Read the sheet (header is on the 2nd row, so header=1)
    df = pd.read_excel(file_path, sheet_name='NJOP_Project_CSV', header=1)
    
    # Save to CSV
    df.to_csv(out_path, index=False)
    print(f"Successfully saved to {out_path}")
    print(f"Data shape: {df.shape}")
    print(df[['Kota', 'Kecamatan', 'NJOP_per_m2']].head())
except Exception as e:
    print(f"Error: {e}")
