#!/usr/bin/env python3
"""
Extract Section 301 HTS codes from USTR PDF lists.
Converts PDF data to JSON/CSV format for use in tariff calculations.
"""

import json
import csv
import re
import sys
import os
from datetime import datetime

# Note: Install required packages with:
# pip install pdfplumber tabula-py PyPDF2

def extract_with_pdfplumber(pdf_path):
    """Extract HTS codes using pdfplumber (good for complex layouts)"""
    try:
        import pdfplumber
        
        hts_codes = []
        
        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages, 1):
                print(f"Processing page {page_num}...")
                
                # Extract tables if present
                tables = page.extract_tables()
                for table in tables:
                    for row in table:
                        # Look for HTS code patterns (8-10 digits)
                        for cell in row:
                            if cell and re.match(r'^\d{4}\.\d{2}(\.\d{2})?$', str(cell).strip()):
                                hts_codes.append({
                                    'hts_code': cell.strip(),
                                    'page': page_num,
                                    'source': 'table'
                                })
                
                # Also extract from text
                text = page.extract_text()
                if text:
                    # Find HTS codes in text (format: XXXX.XX or XXXX.XX.XX)
                    matches = re.findall(r'\b(\d{4}\.\d{2}(?:\.\d{2})?)\b', text)
                    for match in matches:
                        if match not in [h['hts_code'] for h in hts_codes]:
                            hts_codes.append({
                                'hts_code': match,
                                'page': page_num,
                                'source': 'text'
                            })
        
        return hts_codes
    
    except ImportError:
        print("pdfplumber not installed. Install with: pip install pdfplumber")
        return []

def extract_with_tabula(pdf_path):
    """Extract HTS codes using tabula-py (best for tabular data)"""
    try:
        import tabula
        
        hts_codes = []
        
        # Read all tables from PDF
        tables = tabula.read_pdf(pdf_path, pages='all', multiple_tables=True)
        
        for table_idx, df in enumerate(tables):
            print(f"Processing table {table_idx + 1}...")
            
            # Convert dataframe to string and search for HTS codes
            for col in df.columns:
                for value in df[col].dropna():
                    value_str = str(value).strip()
                    if re.match(r'^\d{4}\.\d{2}(\.\d{2})?$', value_str):
                        hts_codes.append({
                            'hts_code': value_str,
                            'table': table_idx + 1,
                            'source': 'tabula'
                        })
        
        return hts_codes
    
    except ImportError:
        print("tabula-py not installed. Install with: pip install tabula-py")
        return []

def extract_with_pypdf2(pdf_path):
    """Extract HTS codes using PyPDF2 (basic text extraction)"""
    try:
        import PyPDF2
        
        hts_codes = []
        
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                text = page.extract_text()
                
                # Find HTS codes in text
                matches = re.findall(r'\b(\d{4}\.\d{2}(?:\.\d{2})?)\b', text)
                for match in matches:
                    hts_codes.append({
                        'hts_code': match,
                        'page': page_num + 1,
                        'source': 'pypdf2'
                    })
        
        return hts_codes
    
    except ImportError:
        print("PyPDF2 not installed. Install with: pip install PyPDF2")
        return []

def deduplicate_codes(hts_codes):
    """Remove duplicate HTS codes, keeping the first occurrence"""
    seen = set()
    unique_codes = []
    
    for item in hts_codes:
        code = item['hts_code']
        if code not in seen:
            seen.add(code)
            unique_codes.append(item)
    
    return unique_codes

def format_for_section301(hts_codes, list_number, rate):
    """Format extracted codes for Section 301 implementation"""
    return {
        'list_number': list_number,
        'rate': rate,
        'effective_date': get_effective_date(list_number),
        'hts_codes': [item['hts_code'] for item in hts_codes],
        'total_codes': len(hts_codes),
        'extraction_date': datetime.now().isoformat()
    }

def get_effective_date(list_number):
    """Get the effective date for each Section 301 list"""
    dates = {
        '1': '2018-07-06',
        '2': '2018-08-23',
        '3': '2018-09-24',
        '4A': '2019-09-01',
        '4a': '2019-09-01'
    }
    return dates.get(str(list_number), 'unknown')

def save_to_json(data, output_file):
    """Save extracted data to JSON file"""
    with open(output_file, 'w') as f:
        json.dump(data, f, indent=2)
    print(f"Saved to {output_file}")

def save_to_csv(hts_codes, output_file, list_number, rate):
    """Save extracted data to CSV file"""
    with open(output_file, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['hts_code', 'list_number', 'rate', 'effective_date'])
        
        effective_date = get_effective_date(list_number)
        for item in hts_codes:
            writer.writerow([item['hts_code'], list_number, rate, effective_date])
    
    print(f"Saved to {output_file}")

def main():
    if len(sys.argv) < 4:
        print("Usage: python extract_section301_from_pdf.py <pdf_file> <list_number> <rate>")
        print("Example: python extract_section301_from_pdf.py list1.pdf 1 25")
        print("         python extract_section301_from_pdf.py list4a.pdf 4A 7.5")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    list_number = sys.argv[2]
    rate = float(sys.argv[3])
    
    if not os.path.exists(pdf_path):
        print(f"Error: PDF file '{pdf_path}' not found")
        sys.exit(1)
    
    print(f"Extracting Section 301 List {list_number} from {pdf_path}...")
    
    # Try different extraction methods
    hts_codes = []
    
    # Method 1: Try pdfplumber first (most reliable)
    codes = extract_with_pdfplumber(pdf_path)
    if codes:
        hts_codes.extend(codes)
        print(f"Found {len(codes)} codes with pdfplumber")
    
    # Method 2: Try tabula if no results or as supplement
    if not hts_codes:
        codes = extract_with_tabula(pdf_path)
        if codes:
            hts_codes.extend(codes)
            print(f"Found {len(codes)} codes with tabula")
    
    # Method 3: Fallback to PyPDF2
    if not hts_codes:
        codes = extract_with_pypdf2(pdf_path)
        if codes:
            hts_codes.extend(codes)
            print(f"Found {len(codes)} codes with PyPDF2")
    
    if not hts_codes:
        print("No HTS codes found. The PDF might have a complex format.")
        print("Consider manual extraction or using a different tool.")
        sys.exit(1)
    
    # Deduplicate
    hts_codes = deduplicate_codes(hts_codes)
    print(f"\nTotal unique HTS codes found: {len(hts_codes)}")
    
    # Format data
    data = format_for_section301(hts_codes, list_number, rate)
    
    # Save outputs
    base_name = os.path.splitext(os.path.basename(pdf_path))[0]
    json_file = f"section301_list{list_number}_{base_name}.json"
    csv_file = f"section301_list{list_number}_{base_name}.csv"
    
    save_to_json(data, json_file)
    save_to_csv(hts_codes, csv_file, list_number, rate)
    
    # Print sample
    print("\nSample of extracted codes:")
    for code in hts_codes[:10]:
        print(f"  - {code['hts_code']}")
    if len(hts_codes) > 10:
        print(f"  ... and {len(hts_codes) - 10} more")

if __name__ == '__main__':
    main() 