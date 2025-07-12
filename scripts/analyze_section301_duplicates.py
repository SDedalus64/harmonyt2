import pandas as pd

# Load the combined file
df = pd.read_csv('exports/section301_all_lists_combined.csv')

# Find duplicates
duplicates = df[df.duplicated(subset=['HTS_Code'], keep=False)]

# Group by HTS code and show which lists they appear in
print("📊 HTS Codes that appear in multiple Section 301 lists:")
print("=" * 70)

# Create a summary of duplicates
dup_summary = duplicates.groupby('HTS_Code')['List'].apply(lambda x: sorted(list(x))).reset_index()
dup_summary.columns = ['HTS_Code', 'Lists']
dup_summary['Count'] = dup_summary['Lists'].apply(len)

# Sort by count and HTS code
dup_summary = dup_summary.sort_values(['Count', 'HTS_Code'], ascending=[False, True])

# Display top duplicates
print(f"\nTotal unique HTS codes appearing in multiple lists: {len(dup_summary)}")
print("\nTop 20 duplicate HTS codes:")
print("-" * 70)

for idx, row in dup_summary.head(20).iterrows():
    lists_str = ', '.join([f"List {l}" for l in row['Lists']])
    tariffs = []
    for l in row['Lists']:
        if str(l) in ['1', '2', '3']:
            tariffs.append('25%')
        elif str(l) == '4a':
            tariffs.append('7.5%')
    tariffs_str = ', '.join(tariffs)
    print(f"{row['HTS_Code']} - Appears in: {lists_str} (Tariffs: {tariffs_str})")

# Show summary by list combination
print("\n📈 Summary by List Combinations:")
print("-" * 50)
dup_summary['Lists_Str'] = dup_summary['Lists'].apply(lambda x: ', '.join([str(l) for l in x]))
combo_counts = dup_summary['Lists_Str'].value_counts()
for combo, count in combo_counts.items():
    print(f"   Lists {combo}: {count} HTS codes") 