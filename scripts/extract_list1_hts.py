import pdfplumber
import pandas as pd
import os
import re

# --- CONFIG ---
input_pdf = "pdfs/List 1.pdf"
output_csv = "exports/list1_hts_extracted.csv"
os.makedirs(os.path.dirname(output_csv), exist_ok=True)

# --- HTS Pattern ---
# Matches patterns like: 2845.90.00 or 8411.11.40
hts_pattern = re.compile(r'(\d{4}\.\d{2}\.\d{2})\s+(.+?)(?=\s*\d{4}\.\d{2}\.\d{2}|$)', re.DOTALL)

# --- Collect Rows ---
all_rows = []
print("\n📄 Extracting HTS codes from List 1...")

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
df['List'] = '1'  # This is List 1

# --- Save to CSV ---
df.to_csv(output_csv, index=False)
print(f"\n✅ Extraction complete. Found {len(df)} unique HTS codes from List 1.")
print(f"📁 Saved to: {output_csv}")