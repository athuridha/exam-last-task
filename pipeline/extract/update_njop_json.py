"""
Merge NJOP data into kecamatan_stats.json and update summary.json
"""
import json
import csv
import os
import statistics

BASE = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE, "visualisasi-properti", "public", "data")

# ------------------------------------------------------------------
# 1. Load NJOP reference
# ------------------------------------------------------------------
njop_map: dict[tuple[str, str], int] = {}
with open(os.path.join(BASE, "data_referensi", "njop_per_kecamatan.csv"), "r", encoding="utf-8-sig") as f:
    reader = csv.DictReader(f)
    for row in reader:
        njop_map[(row["Kota"], row["Kecamatan"])] = int(row["NJOP_per_m2"])

print(f"Loaded {len(njop_map)} NJOP records")

# ------------------------------------------------------------------
# 2. Update kecamatan_stats.json
# ------------------------------------------------------------------
kec_path = os.path.join(DATA_DIR, "kecamatan_stats.json")
with open(kec_path, "r", encoding="utf-8") as f:
    kec_stats = json.load(f)

matched = 0
njop_values = []
for rec in kec_stats:
    key = (rec["Kota"], rec["Kecamatan"])
    njop = njop_map.get(key, 0)
    rec["NJOP_per_m2"] = njop
    if njop > 0:
        matched += 1
        njop_values.append(njop)

print(f"Matched NJOP for {matched}/{len(kec_stats)} kecamatan")

tmp_kec = kec_path + ".tmp"
with open(tmp_kec, "w", encoding="utf-8") as f:
    json.dump(kec_stats, f, ensure_ascii=False)
os.replace(tmp_kec, kec_path)
print("Updated kecamatan_stats.json")

# ------------------------------------------------------------------
# 3. Update summary.json
# ------------------------------------------------------------------
sum_path = os.path.join(DATA_DIR, "summary.json")
with open(sum_path, "r", encoding="utf-8") as f:
    summary = json.load(f)

if njop_values:
    summary["njop_median"] = int(statistics.median(njop_values))
    summary["njop_mean"] = int(statistics.mean(njop_values))
    summary["njop_min"] = min(njop_values)
    summary["njop_max"] = max(njop_values)
else:
    summary["njop_median"] = 0
    summary["njop_mean"] = 0
    summary["njop_min"] = 0
    summary["njop_max"] = 0

# NJOP per segmen (average NJOP by dominant segment)
segmen_njop: dict[str, list[int]] = {}
for rec in kec_stats:
    seg = rec.get("Segmen_Dominan", "")
    njop = rec.get("NJOP_per_m2", 0)
    if seg and njop > 0:
        segmen_njop.setdefault(seg, []).append(njop)

summary["njop_per_segmen"] = {
    seg: int(statistics.mean(vals)) for seg, vals in segmen_njop.items()
}

tmp_sum = sum_path + ".tmp"
with open(tmp_sum, "w", encoding="utf-8") as f:
    json.dump(summary, f, ensure_ascii=False, indent=2)
os.replace(tmp_sum, sum_path)
print("Updated summary.json")

# ------------------------------------------------------------------
# 4. Also merge NJOP into main CSV
# ------------------------------------------------------------------
csv_path = os.path.join(BASE, "rumah123_jabodetabek_with_features.csv")
if os.path.exists(csv_path):
    out_rows = []
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = list(reader.fieldnames or [])
        if "NJOP_per_m2" not in fieldnames:
            fieldnames.append("NJOP_per_m2")
        for row in reader:
            key = (row.get("Kota", ""), row.get("Kecamatan", ""))
            row["NJOP_per_m2"] = str(njop_map.get(key, 0))
            out_rows.append(row)

    tmp_csv = csv_path + ".tmp"
    with open(tmp_csv, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(out_rows)
    os.replace(tmp_csv, csv_path)
    print(f"Updated main CSV with NJOP column ({len(out_rows)} rows)")
else:
    print("Main CSV not found, skipping")

print("\nDone!")
