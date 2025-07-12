import pdfplumber
import pandas as pd
import os
import re
import sys

# --- CONFIG ---
if len(sys.argv) < 2:
    print("Usage: python extract_section301_list.py <list_number>")
    print("Example: python extract_section301_list.py 2")
    print("         python extract_section301_list.py 4a")
    sys.exit(1)

list_number = sys.argv[1]
input_pdf = f"pdfs/List {list_number}.pdf"
output_csv = f"exports/list{list_number}_hts_extracted.csv"

# Check if input PDF exists
if not os.path.exists(input_pdf):
    print(f"❌ Error: {input_pdf} not found!")
    print("Please make sure the PDF file is in the pdfs/ directory")
    sys.exit(1)

os.makedirs(os.path.dirname(output_csv), exist_ok=True)

# --- HTS Pattern ---
# Matches patterns like: 2845.90.00 or 8411.11.40
hts_pattern = re.compile(r'(\d{4}\.\d{2}\.\d{2})\s+(.+?)(?=\s*\d{4}\.\d{2}\.\d{2}|$)', re.DOTALL)

# --- Collect Rows ---
all_rows = []
print(f"\n📄 Extracting HTS codes from List {list_number}...")

with pdfplumber.open(input_pdf) as pdf:
    # First pass: collect all text
    full_text = ""
    for i, page in enumerate(pdf.pages, start=1):
        page_text = page.extract_text()
        if page_text:
            # Clean up text - replace newlines with spaces, multiple spaces with single
            page_text = page_text.replace('\n', ' ')
            page_text = re.sub(r'\s+', ' ', page_text)
            full_text += page_text + " "
        print(f"✓ Page {i} processed.")
    
    # Second pass: extract HTS codes and descriptions
    matches = hts_pattern.findall(full_text)
    for hts_code, description in matches:
        # Clean up description
        description = description.strip()
        if description:
            all_rows.append([hts_code, description])

# --- Create DataFrame ---
df = pd.DataFrame(all_rows, columns=pd.Index(["HTS_Code", "Description"]))
df.drop_duplicates(inplace=True)

# Add List column to identify which Section 301 list this is from
df['List'] = list_number

# --- Save to CSV ---
df.to_csv(output_csv, index=False)
print(f"\n✅ Extraction complete. Found {len(df)} unique HTS codes from List {list_number}.")
print(f"📁 Saved to: {output_csv}")

# --- Show tariff rate info ---
if list_number in ['1', '2', '3']:
    print(f"💰 List {list_number} items are subject to 25% additional tariff")
elif list_number == '4a':
    print("💰 List 4a items are subject to 7.5% additional tariff") 