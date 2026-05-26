import pandas as pd

file_path = 'njop_jabodetabek_verified_audit.xlsx'
try:
    xl = pd.ExcelFile(file_path)
    print("Sheets:", xl.sheet_names)
    for sheet in xl.sheet_names:
        print(f"\n--- Sheet: {sheet} ---")
        df = pd.read_excel(file_path, sheet_name=sheet)
        print("Columns:", df.columns.tolist())
        print("Shape:", df.shape)
        if df.shape[0] > 0:
            print("First 3 rows:")
            print(df.head(3))
except Exception as e:
    print(f"Error reading excel: {e}")
