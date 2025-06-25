#!/usr/bin/env python3
"""Quick utility to convert first sheet of an Excel file to a CSV file.
Used by process_tariff_update.sh. Requires pandas and openpyxl.
"""
import sys, pandas as pd, os

if len(sys.argv) != 3:
    print("Usage: excel_to_csv.py <input.xlsx> <output.csv>")
    sys.exit(1)

in_path, out_path = sys.argv[1], sys.argv[2]
if not os.path.isfile(in_path):
    print(f"Input file not found: {in_path}")
    sys.exit(1)

try:
    df = pd.read_excel(in_path, sheet_name=0, engine='openpyxl')
    df.to_csv(out_path, index=False)
    print(f"Converted {in_path} -> {out_path} (rows={len(df)})")
except Exception as e:
    print(f"Error converting Excel to CSV: {e}")
    sys.exit(1) 