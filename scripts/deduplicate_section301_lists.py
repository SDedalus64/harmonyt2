import pandas as pd

print("📋 Deduplicating Section 301 Lists")
print("=" * 70)
print("Rule: Latest controlling legal text wins")
print("Chronology: List 1 → List 2 → List 3 → List 4A")
print()

# Load the combined file
df = pd.read_csv('exports/section301_all_lists_combined.csv')
print(f"📊 Starting with {len(df):,} total entries")

# Create a priority mapping (higher number = more recent = higher priority)
list_priority = {
    '1': 1,
    '2': 2,
    '3': 3,
    '4a': 4
}

# Add priority column
df['priority'] = df['List'].astype(str).map(lambda x: list_priority.get(x, 0))

# Find duplicates
duplicates = df[df.duplicated(subset=['HTS_Code'], keep=False)]
unique_codes = df[~df.duplicated(subset=['HTS_Code'], keep=False)]

print(f"\n🔍 Found {len(duplicates.HTS_Code.unique()):,} HTS codes appearing in multiple lists")
print(f"   These represent {len(duplicates):,} total duplicate entries")

# For duplicates, keep only the one with highest priority (most recent list)
dedup_df = df.sort_values(['HTS_Code', 'priority'], ascending=[True, False])
dedup_df = dedup_df.drop_duplicates(subset=['HTS_Code'], keep='first')

# Remove the priority column from final output
dedup_df = dedup_df.drop('priority', axis=1)

# Sort by HTS code for easy lookup
dedup_df = dedup_df.sort_values('HTS_Code')

# Save deduplicated file
output_file = 'exports/section301_deduplicated.csv'
dedup_df.to_csv(output_file, index=False)

print(f"\n✅ Deduplicated data saved to: {output_file}")
print(f"   Final count: {len(dedup_df):,} unique HTS codes")

# Show examples of what changed
print("\n📝 Examples of deduplicated codes:")
print("-" * 70)

# Find codes that were moved from 25% to 7.5%
moved_to_4a = duplicates.loc[duplicates['List'].astype(str) == '4a', 'HTS_Code'].unique()
moved_to_4a_list = list(moved_to_4a)
moved_from_25 = duplicates.loc[
    (duplicates['HTS_Code'].isin(moved_to_4a_list)) & 
    (duplicates['List'].astype(str).isin(['1', '2', '3'])), 
    'HTS_Code'
].unique()

if len(moved_from_25) > 0:
    print(f"\n🔄 {len(moved_from_25)} codes moved from 25% lists to List 4A (7.5%):")
    for code in sorted(moved_from_25)[:10]:  # Show first 10
        old_lists = duplicates[
            (duplicates['HTS_Code'] == code) & 
            (duplicates['List'].astype(str).isin(['1', '2', '3']))
        ]['List'].tolist()
        old_lists_str = ', '.join([str(l) for l in sorted(old_lists)])
        print(f"   {code}: Was on List(s) {old_lists_str} (25%) → Now on List 4a (7.5%)")
    if len(moved_from_25) > 10:
        print(f"   ... and {len(moved_from_25) - 10} more")

# Summary by list
print("\n📊 Final Distribution by List:")
print("-" * 40)
summary = dedup_df.groupby('List').size()
for list_num, count in summary.items():
    tariff_rate = "25%" if str(list_num) in ['1', '2', '3'] else "7.5%" if str(list_num) == '4a' else "Unknown"
    print(f"   List {list_num}: {count:,} items ({tariff_rate} tariff)")

print("\n💡 Note: This follows USTR's rule that when a code appears on multiple lists,")
print("   the most recent list controls (reflecting deletions from earlier lists).") 