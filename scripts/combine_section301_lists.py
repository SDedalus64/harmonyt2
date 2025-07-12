import pandas as pd
import os
import glob

# --- CONFIG ---
exports_dir = "exports"
output_file = "exports/section301_all_lists_combined.csv"

# Find all list files
list_files = glob.glob(os.path.join(exports_dir, "list*_hts_extracted.csv"))
list_files.sort()  # Sort to ensure consistent order

if not list_files:
    print("❌ No list files found in exports directory!")
    print("Please run the extraction scripts first.")
    exit(1)

print("📄 Found the following list files:")
for f in list_files:
    print(f"  - {os.path.basename(f)}")

# Combine all lists
all_dfs = []
for file in list_files:
    df = pd.read_csv(file)
    all_dfs.append(df)
    print(f"✓ Loaded {len(df)} entries from {os.path.basename(file)}")

# Concatenate all dataframes
combined_df = pd.concat(all_dfs, ignore_index=True)

# Remove any duplicates (in case same HTS appears in multiple lists)
# Keep first occurrence and note if there are duplicates
duplicates = combined_df.duplicated(subset=['HTS_Code'], keep=False)
if duplicates.any():
    print(f"\n⚠️  Found {duplicates.sum()} duplicate HTS codes across lists")
    dup_codes = combined_df.loc[duplicates, 'HTS_Code'].drop_duplicates().tolist()
    print(f"   Duplicate codes: {', '.join(dup_codes[:5])}{'...' if len(dup_codes) > 5 else ''}")

# Sort by HTS code and list
combined_df.sort_values(['HTS_Code', 'List'], inplace=True)

# Save combined file
combined_df.to_csv(output_file, index=False)

print(f"\n✅ Combined {len(combined_df)} total entries")
print(f"📁 Saved to: {output_file}")

# Summary by list
print("\n📊 Summary by List:")
summary = combined_df.groupby('List').size()
for list_num, count in summary.items():
    tariff_rate = "25%" if str(list_num) in ['1', '2', '3'] else "7.5%" if str(list_num) == '4a' else "Unknown"
    print(f"   List {list_num}: {count:,} items ({tariff_rate} tariff)") 