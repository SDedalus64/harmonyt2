#!/usr/bin/env python3
"""
Preprocess tariff data with Section 301 integration.
This script processes the raw tariff CSV data and integrates Section 301 data
to create a clean JSON file that's easier for the app to consume.

Usage:
  python preprocess_tariff_data_new.py <input_csv> <section301_csv> <output_json> [hts_revision] [--inject-extra-tariffs]

Arguments:
  <input_csv>              Path to the input tariff CSV file.
  <section301_csv>         Path to the Section 301 deduplicated CSV file.
  <output_json>            Path to the output JSON file.
  [hts_revision]           Optional HTS revision string.
  --inject-extra-tariffs   Optional flag to inject Reciprocal, Fentanyl, and IEEPA tariffs.
"""

import csv
import json
import re
from typing import Dict, Any, Optional, List
import sys
import os
from datetime import datetime
import argparse
import pandas as pd

# Special programs mapping based on the uploaded data
COUNTRY_TO_PROGRAMS = {
    'CA': {'code': 'CA', 'name': 'Canada', 'programs': ['USMCA', 'NAFTA']},
    'MX': {'code': 'MX', 'name': 'Mexico', 'programs': ['USMCA', 'NAFTA']},
    'AU': {'code': 'AU', 'name': 'Australia', 'programs': ['Australia FTA']},
    'BH': {'code': 'BH', 'name': 'Bahrain', 'programs': ['Bahrain FTA']},
    'CL': {'code': 'CL', 'name': 'Chile', 'programs': ['Chile FTA']},
    'CO': {'code': 'CO', 'name': 'Colombia', 'programs': ['Colombia TPA']},
    'CR': {'code': 'CR', 'name': 'Costa Rica', 'programs': ['CAFTA-DR']},
    'DO': {'code': 'DO', 'name': 'Dominican Republic', 'programs': ['CAFTA-DR']},
    'SV': {'code': 'SV', 'name': 'El Salvador', 'programs': ['CAFTA-DR']},
    'GT': {'code': 'GT', 'name': 'Guatemala', 'programs': ['CAFTA-DR']},
    'HN': {'code': 'HN', 'name': 'Honduras', 'programs': ['CAFTA-DR']},
    'NI': {'code': 'NI', 'name': 'Nicaragua', 'programs': ['CAFTA-DR']},
    'IL': {'code': 'IL', 'name': 'Israel', 'programs': ['Israel FTA']},
    'JO': {'code': 'JO', 'name': 'Jordan', 'programs': ['Jordan FTA']},
    'KR': {'code': 'KR', 'name': 'Korea', 'programs': ['Korea FTA']},
    'MA': {'code': 'MA', 'name': 'Morocco', 'programs': ['Morocco FTA']},
    'OM': {'code': 'OM', 'name': 'Oman', 'programs': ['Oman FTA']},
    'PA': {'code': 'PA', 'name': 'Panama', 'programs': ['Panama TPA']},
    'PE': {'code': 'PE', 'name': 'Peru', 'programs': ['Peru TPA']},
    'SG': {'code': 'SG', 'name': 'Singapore', 'programs': ['Singapore FTA']},
    'JP': {'code': 'JP', 'name': 'Japan', 'programs': ['Japan Agreement']},
    # Special program countries
    'A+': {'code': 'A+', 'name': 'GSP Least Developed', 'programs': ['GSP', 'GSP+']},
    'A': {'code': 'A', 'name': 'GSP', 'programs': ['GSP']},
    'E': {'code': 'E', 'name': 'CBERA', 'programs': ['Caribbean Basin']},
    'J': {'code': 'J', 'name': 'ATPA', 'programs': ['Andean Trade']},
    'D': {'code': 'D', 'name': 'AGOA', 'programs': ['Africa Growth']},
    # Countries with special duties
    'CN': {'code': 'CN', 'name': 'China', 'programs': ['Section 301', 'Reciprocal Tariff']},
    'RU': {'code': 'RU', 'name': 'Russia', 'programs': ['Column 2 - NTR Suspended']},
    'BY': {'code': 'BY', 'name': 'Belarus', 'programs': ['Column 2 - NTR Suspended']},
}

# Active US Additive Duties as of May 31, 2025
ADDITIVE_DUTIES = {
    'section_232_steel': {
        'name': 'Section 232 - Steel',
        'countries': 'global',
        'chapters': ['72', '73'],
        'rate': 0.50,  # 50% for all countries except UK
        'rate_uk': 0.25,  # 25% for UK only
        'effective': '2018-03-23',
        'uk_effective': '2025-06-04',
        'note': 'Increased from 25% to 50% on June 4, 2025 (except UK remains at 25%)',
        'uk_codes': ['9903.80.05', '9903.80.06', '9903.80.07', '9903.80.08']
    },
    'section_232_aluminum': {
        'name': 'Section 232 - Aluminum',
        'countries': 'global',
        'chapters': ['76'],
        'rate': 0.50,  # 50% for all countries except UK
        'rate_uk': 0.25,  # 25% for UK only
        'effective': '2018-03-23',
        'uk_effective': '2025-06-04',
        'note': 'Increased from 25% to 50% on June 4, 2025 (except UK remains at 25%)',
        'uk_codes': ['9903.85.12', '9903.85.13', '9903.85.14', '9903.85.15']
    },
    'reciprocal_china': {
        'name': 'Reciprocal Tariff - China',
        'countries': ['CN'],
        'rate': 0.10,  # 10% reciprocal tariff
        'effective': '2025-05-14',
        'expires': '2025-08-12',
        'note': 'Temporary 90-day agreement'
    },
    'fentanyl_china': {
        'name': 'Fentanyl Anti-Trafficking Tariff - China',
        'countries': ['CN'],
        'rate': 0.20,  # 20% fentanyl anti-trafficking tariff
        'effective': '2025-03-04',  # Same as other IEEPA tariffs
        'expires': None,  # No expiration - permanent
        'note': 'Anti-trafficking measure'
    },
    'ieepa_canada': {
        'name': 'IEEPA Tariff - Canada',
        'countries': ['CA'],
        'rate': 0.25,  # 25% standard rate
        'rate_energy_potash': 0.10,  # 10% for energy and potash
        'effective': '2025-03-04',
        'note': 'USMCA-origin goods exempt; Does not stack with Section 232',
        'legal_status': 'Under judicial review, currently in effect'
    },
    'ieepa_mexico': {
        'name': 'IEEPA Tariff - Mexico',
        'countries': ['MX'],
        'rate': 0.25,  # 25% standard rate
        'rate_potash': 0.10,  # 10% for potash only
        'effective': '2025-03-04',
        'note': 'USMCA-origin goods exempt; Does not stack with Section 232',
        'legal_status': 'Under judicial review, currently in effect'
    },
    'section_201_solar': {
        'name': 'Section 201 - Solar',
        'countries': 'global',
        'rate': 14.25,  # 14.25% current rate
        'effective': '2018-02-07',
        'expires': '2026-02-06',
        'exclusions': ['AU', 'BH', 'CA', 'CL', 'CO', 'CR', 'DO', 'SV', 'GT', 'HN',
                      'IL', 'JO', 'KR', 'MX', 'MA', 'NI', 'OM', 'PA', 'PE', 'SG'],
        'note': 'FTA partners and GSP beneficiaries excluded'
    }
}

# Load Section 301 data
SECTION_301_DATA = {}

# Load Section 201 data
SECTION_201_DATA = {}

def normalize_hts_code(hts_code: str) -> str:
    """Normalize HTS code to 8-digit format without dots for matching"""
    # Remove all non-digits
    code = re.sub(r'[^\d]', '', str(hts_code))
    
    # Remove leading zeros but ensure we have at least 8 digits
    code = code.lstrip('0') or '0'  # Keep at least one zero if all zeros
    
    # If less than 8 digits after removing leading zeros, pad on the right
    if len(code) < 8:
        code = code.ljust(8, '0')
    
    # If more than 8 digits, take first 8
    if len(code) > 8:
        code = code[:8]
    
    # Special handling: if code starts with 0 after normalization, it's likely
    # a chapter 01-09 code that should not have leading zero in database
    # Example: 0101.21.00 -> 01012100 -> 10121000
    if code.startswith('0') and len(code) == 8:
        # Try without the leading zero
        code_without_zero = code[1:] + '0'
        # This transforms 01012100 -> 10121000
        return code_without_zero
    
    return code

def load_section_301_data(section301_csv_path: str):
    """Load Section 301 deduplicated data into a lookup dictionary"""
    global SECTION_301_DATA
    try:
        df = pd.read_csv(section301_csv_path)
        for _, row in df.iterrows():
            hts_code = str(row['HTS_Code']).strip()
            # Normalize the HTS code for matching
            normalized_code = normalize_hts_code(hts_code)
            
            list_num = str(row['List']).strip()
            
            # Determine rate based on list
            if list_num in ['1', '2', '3']:
                rate = 25.0
            elif list_num == '4a':
                rate = 7.5
            else:
                rate = 0.0
            
            SECTION_301_DATA[normalized_code] = {
                'list': list_num,
                'rate': rate,
                'description': row.get('Description', ''),
                'original_code': hts_code  # Keep original for reference
            }
        
        print(f"Loaded {len(SECTION_301_DATA)} Section 301 HTS codes")
        # Debug: Show a few examples
        examples = list(SECTION_301_DATA.items())[:5]
        print("Section 301 examples (normalized):")
        for code, data in examples:
            print(f"  {code} <- {data['original_code']} (List {data['list']})")
        
        # Show specific example for horses
        if '10121000' in SECTION_301_DATA:
            print(f"\nFound 10121000: {SECTION_301_DATA['10121000']}")
        if '01012100' in SECTION_301_DATA:
            print(f"Found 01012100: {SECTION_301_DATA['01012100']}")
        return True
    except Exception as e:
        print(f"Error loading Section 301 data: {e}")
        return False

def load_section_201_data(section201_csv_path: str):
    """Load Section 201 solar data into a lookup dictionary"""
    global SECTION_201_DATA
    try:
        # If file doesn't exist, just return True (Section 201 is optional)
        if not os.path.exists(section201_csv_path):
            print(f"Section 201 CSV not found at {section201_csv_path}, skipping...")
            return True
            
        df = pd.read_csv(section201_csv_path, comment='#')
        for _, row in df.iterrows():
            hts_code = str(row['HTS_Code']).strip()
            # Normalize the HTS code for matching
            normalized_code = normalize_hts_code(hts_code)
            
            # Parse exempt countries
            exempt_countries = []
            exempt_str = row.get('Exempt_Countries')
            if exempt_str and pd.notna(exempt_str):
                exempt_countries = [c.strip() for c in str(exempt_str).split(',')]
            
            SECTION_201_DATA[normalized_code] = {
                'rate': float(row.get('Current_Rate', 14.0)) if row.get('Current_Rate') else 14.0,
                'product_type': row.get('Product_Type', 'solar'),
                'quota_gw': float(row.get('Quota_GW', 0)) if row.get('Quota_GW') else 0,
                'exempt_countries': exempt_countries,
                'notes': row.get('Notes', ''),
                'original_code': hts_code  # Keep original for reference
            }
        
        print(f"Loaded {len(SECTION_201_DATA)} Section 201 solar HTS codes")
        return True
    except Exception as e:
        print(f"Warning: Could not load Section 201 data: {e}")
        # Return True anyway - Section 201 is optional
        return True

def clean_field_name(field_name: str) -> str:
    """Clean and standardize field names"""
    return field_name.strip().lower().replace(' ', '_').replace('-', '_')

def clean_hts_code(code: str) -> str:
    """Clean HTS code to standard format"""
    # Remove any whitespace
    code = code.strip()
    # Remove trailing periods
    code = code.rstrip('.')
    # Ensure it's 8 digits
    if len(code) < 8 and code.replace('.', '').isdigit():
        # Pad with zeros
        code = code.ljust(8, '0')
    return code

def is_chapter_99_code(hts_code: str) -> bool:
    """Check if an HTS code is a Chapter 99 special provision"""
    return hts_code.startswith('99')

def is_steel_product(hts_code: str) -> bool:
    """Check if HTS code is a steel product (Chapters 72-73)"""
    return hts_code.startswith('72') or hts_code.startswith('73')

def is_aluminum_product(hts_code: str) -> bool:
    """Check if HTS code is an aluminum product (Chapter 76)"""
    return hts_code.startswith('76')

def is_solar_product(hts_code: str) -> bool:
    """Check if HTS code is a solar product"""
    # Solar cells and modules (8541.42 and 8541.43)
    # Check both 6-digit and 8-digit prefixes to handle different formats
    return (hts_code.startswith('854142') or hts_code.startswith('854143') or
            hts_code.startswith('85414200') or hts_code.startswith('85414300') or
            # Also check for generators and batteries with CSPV cells
            hts_code.startswith('85013180') or  # DC generators with CSPV
            hts_code.startswith('85016100') or  # AC generators with CSPV
            hts_code.startswith('85072080'))    # Lead-acid batteries with CSPV

def is_energy_product(hts_code: str) -> bool:
    """Check if HTS code is an energy product"""
    # Chapter 27 - Mineral fuels, oils
    return hts_code.startswith('27')

def is_potash_product(hts_code: str) -> bool:
    """Check if HTS code is a potash product"""
    # Common potash HTS codes
    return hts_code.startswith('310420') or hts_code.startswith('310520')

def is_exempt_from_reciprocal_tariff(hts_code: str, country: str) -> bool:
    """Check if HTS code is exempt from reciprocal tariff"""
    # Placeholder - would need actual exemption list
    return False

def is_exempt_from_fentanyl_tariff(hts_code: str, country: str) -> bool:
    """Check if HTS code is exempt from fentanyl tariff"""
    # Placeholder - would need actual exemption list
    return False

def parse_additional_duty_text(text: str) -> Optional[float]:
    """Parse additional duty percentage from text"""
    if not text:
        return None
    
    # Look for patterns like "25%", "7.5%", "10 percent"
    patterns = [
        r'(\d+(?:\.\d+)?)\s*%',
        r'(\d+(?:\.\d+)?)\s*percent'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return float(match.group(1))
    
    return None

def determine_additive_duties(hts_code: str, entry: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Determine which additive duties apply to this HTS code"""
    additive_duties = []

    # Check for Section 232 duties (global application with UK exemption)
    if is_steel_product(hts_code):
        steel_info = ADDITIVE_DUTIES.get('section_232_steel', {})
        additive_duties.append({
            'type': 'section_232',
            'name': 'Section 232 - Steel Tariff',
            'rate': steel_info.get('rate', 0.50) * 100,  # 50% default
            'rate_uk': steel_info.get('rate_uk', 0.25) * 100,  # 25% for UK
            'countries': 'all',  # Applies globally
            'countries_reduced': ['GB', 'UK'],  # UK gets reduced rate
            'label': 'Section 232 Steel (50%, UK 25%)',
            'uk_codes': steel_info.get('uk_codes', [])
        })
    elif is_aluminum_product(hts_code):
        aluminum_info = ADDITIVE_DUTIES.get('section_232_aluminum', {})
        additive_duties.append({
            'type': 'section_232',
            'name': 'Section 232 - Aluminum Tariff',
            'rate': aluminum_info.get('rate', 0.50) * 100,  # 50% default
            'rate_uk': aluminum_info.get('rate_uk', 0.25) * 100,  # 25% for UK
            'countries': 'all',  # Applies globally
            'countries_reduced': ['GB', 'UK'],  # UK gets reduced rate
            'label': 'Section 232 Aluminum (50%, UK 25%)',
            'uk_codes': aluminum_info.get('uk_codes', [])
        })

    # Check for Section 301 duties using normalized code
    normalized_code = normalize_hts_code(hts_code)
    if normalized_code in SECTION_301_DATA:
        section_301_info = SECTION_301_DATA[normalized_code]
        additive_duties.append({
            'type': 'section_301',
            'name': 'Section 301 - China Trade',
            'rate': section_301_info['rate'],
            'list': section_301_info['list'],
            'countries': ['CN'],
            'label': f"Section 301 List {section_301_info['list']} ({section_301_info['rate']}%)"
        })

    # Check for Section 201 duties using normalized code (similar to Section 301)
    if normalized_code in SECTION_201_DATA:
        section_201_info = SECTION_201_DATA[normalized_code]
        additive_duties.append({
            'type': 'section_201',
            'name': 'Section 201 - Solar Safeguard',
            'rate': section_201_info['rate'],
            'product_type': section_201_info['product_type'],
            'countries': 'all',
            'exclusions': section_201_info['exempt_countries'],
            'label': f"Section 201 Solar ({section_201_info['rate']}%)",
            'notes': section_201_info.get('notes', '')
        })
    elif is_solar_product(hts_code):
        # Fallback to prefix matching if not in lookup table
        solar_info = ADDITIVE_DUTIES.get('section_201_solar', {})
        additive_duties.append({
            'type': 'section_201',
            'name': solar_info.get('name', 'Section 201 - Solar'),
            'rate': solar_info.get('rate', 14.25),
            'countries': 'all',
            'exclusions': solar_info.get('exclusions', []),
            'label': f"Section 201 Solar ({solar_info.get('rate', 14.25)}%)"
        })

    return additive_duties

def process_tariff_entry(row: Dict[str, Any], inject_extra_tariffs: bool, section_301_only: bool = True) -> Optional[Dict[str, Any]]:
    """Process a single tariff entry, handling special cases"""

    # Clean all field names in the row
    cleaned_row = {}
    for key, value in row.items():
        cleaned_key = clean_field_name(key)
        cleaned_row[cleaned_key] = value
    row = cleaned_row

    # Get the HTS code - check multiple possible field names
    hts_code = ''
    for field_name in ['hts8', 'HTS8', 'HTS Number', 'hts_8']:
        if field_name in row:
            hts_code = clean_hts_code(str(row[field_name]))
            break

    if not hts_code:
        # Skip entries without HTS codes
        return None

    # Normalize HTS code for Section 301 matching
    normalized_code = normalize_hts_code(hts_code)
    
    # Debug specific codes
    if hts_code.startswith('101210') or hts_code.startswith('010121'):
        print(f"Debug: Processing {hts_code} -> normalized to {normalized_code}")
        if normalized_code in SECTION_301_DATA:
            print(f"  Found in Section 301: {SECTION_301_DATA[normalized_code]}")
        else:
            print(f"  NOT found in Section 301 data")
    
    # Check if this HTS code has Section 301 duties
    has_section_301 = normalized_code in SECTION_301_DATA
    
    if section_301_only and not has_section_301:
        # Skip entries that don't have Section 301 duties when filtering
        return None

    # Create cleaned entry
    entry = {
        'hts8': hts_code,
        'brief_description': row.get('brief_description', row.get('Description', '')),
        'is_chapter_99': is_chapter_99_code(hts_code),
    }
    
    # Add Section 301 info if available
    if has_section_301:
        entry['section_301_list'] = SECTION_301_DATA[normalized_code]['list']
        entry['section_301_rate'] = SECTION_301_DATA[normalized_code]['rate']

    # Copy over standard fields
    standard_fields = [
        'quantity_1_code', 'quantity_2_code', 'wto_binding_code',
        'mfn_text_rate', 'mfn_rate_type_code', 'mfn_ave',
        'pharmaceutical_ind', 'dyes_indicator',
        'col2_text_rate', 'col2_rate_type_code',
        'begin_effect_date', 'end_effective_date',
        'footnote_comment'
    ]

    for field in standard_fields:
        if field in row and row[field]:
            entry[field] = row[field]

    # Handle MFN rates
    mfn_ad_val = row.get('mfn_ad_val_rate', '0')

    # Check for special Chapter 99 indicator values
    if mfn_ad_val == '9999.999999' or (mfn_ad_val and float(mfn_ad_val) > 100):
        # This is a Chapter 99 special provision
        entry['is_special_provision'] = True
        entry['mfn_ad_val_rate'] = 0  # No base rate

        # Extract additional duty from text
        mfn_text = row.get('mfn_text_rate', '')
        additional_rate = parse_additional_duty_text(mfn_text)
        if additional_rate:
            entry['chapter_99_additional_rate'] = additional_rate
            entry['chapter_99_duty_text'] = mfn_text

            # Determine the type of Chapter 99 provision
            if '99030110' in hts_code:
                entry['chapter_99_type'] = 'Canada Special'
            elif '990385' in hts_code:
                entry['chapter_99_type'] = 'Aluminum/Steel'
    else:
        # Normal rate
        try:
            entry['mfn_ad_val_rate'] = float(mfn_ad_val) if mfn_ad_val else 0
        except ValueError:
            entry['mfn_ad_val_rate'] = 0
        entry['is_special_provision'] = False

    # Handle other rate fields
    rate_fields = ['mfn_specific_rate', 'mfn_other_rate',
                   'col2_ad_val_rate', 'col2_specific_rate', 'col2_other_rate']

    for field in rate_fields:
        if field in row and row[field]:
            try:
                value = float(row[field])
                # Skip special indicator values
                if value < 1000:
                    entry[field] = value
            except (ValueError, TypeError):
                pass

    # Handle Column 2 rates and determine if they're special trade actions
    col2_ad_val = row.get('col2_ad_val_rate', '0')
    if col2_ad_val:
        try:
            col2_rate = float(col2_ad_val)
            if col2_rate > 0:
                entry['col2_ad_val_rate'] = col2_rate

                # Check if Russia/Belarus should use Column 2 rates (NTR suspended)
                entry['ntr_suspended_countries'] = ['RU', 'BY']
        except (ValueError, TypeError):
            pass

    # Handle FTA/special program fields with proper program names
    fta_programs = {
        'gsp': 'GSP',
        'nafta_canada': 'NAFTA Canada',
        'nafta_mexico': 'NAFTA Mexico',
        'mexico': 'Mexico',
        'cbi': 'Caribbean Basin',
        'agoa': 'AGOA',
        'israel_fta': 'Israel FTA',
        'jordan': 'Jordan FTA',
        'singapore': 'Singapore FTA',
        'chile': 'Chile FTA',
        'morocco': 'Morocco FTA',
        'australia': 'Australia FTA',
        'bahrain': 'Bahrain FTA',
        'dr_cafta': 'CAFTA-DR',
        'oman': 'Oman FTA',
        'peru': 'Peru TPA',
        'korea': 'Korea FTA',
        'colombia': 'Colombia TPA',
        'panama': 'Panama TPA',
        'usmca': 'USMCA'
    }

    # Track available programs for this entry
    entry['available_programs'] = []

    for program_key, program_name in fta_programs.items():
        # Copy indicator
        indicator_field = f'{program_key}_indicator'
        if indicator_field in row and row[indicator_field]:
            entry[indicator_field] = row[indicator_field]

            # Handle ad valorem rates
            ad_val_field = f'{program_key}_ad_val_rate'
            if ad_val_field in row and row[ad_val_field]:
                try:
                    value = float(row[ad_val_field])
                    # Skip special indicator values
                    if value < 1000:
                        entry[ad_val_field] = value
                        entry['available_programs'].append({
                            'program_key': program_key,
                            'program_name': program_name,
                            'rate': value
                        })
                except (ValueError, TypeError):
                    pass

        # Copy other rate fields
        for suffix in ['rate_type_code', 'specific_rate', 'other_rate']:
            field = f'{program_key}_{suffix}'
            if field in row and row[field]:
                entry[field] = row[field]

    # Determine all applicable additive duties for this product
    additive_duties_info = determine_additive_duties(hts_code, entry)
    if additive_duties_info:
        entry['additive_duties'] = additive_duties_info

    # Add reciprocal tariff and fentanyl tariff information if enabled
    if inject_extra_tariffs and not entry.get('is_chapter_99'):
        entry['reciprocal_tariffs'] = []
        if not is_steel_product(hts_code) and not is_aluminum_product(hts_code):
            if not is_exempt_from_reciprocal_tariff(hts_code, 'CN'):
                entry['reciprocal_tariffs'].append({
                    'country': 'CN',
                    'rate': 10.0,
                    'label': 'Reciprocal Tariff - China (10%)',
                    'note': 'Temporary 90-day agreement',
                    'effective': '2025-05-14',
                    'expires': '2025-08-12'
                })

            if not is_exempt_from_fentanyl_tariff(hts_code, 'CN'):
                entry['reciprocal_tariffs'].append({
                    'country': 'CN',
                    'rate': 20.0,
                    'label': 'Fentanyl Anti-Trafficking Tariff - China (20%)',
                    'note': 'Anti-trafficking measure',
                    'effective': '2025-03-04',
                    'expires': None
                })

    # Add IEEPA tariffs if enabled
    if inject_extra_tariffs and not entry.get('is_chapter_99'):
        if 'ieepa_tariffs' not in entry:
            entry['ieepa_tariffs'] = []

        if not is_steel_product(hts_code) and not is_aluminum_product(hts_code) and not is_solar_product(hts_code):
            if is_energy_product(hts_code) or is_potash_product(hts_code):
                rate = 10.0
                label = 'IEEPA Tariff - Canada (10% - Energy/Potash)'
            else:
                rate = 25.0
                label = 'IEEPA Tariff - Canada (25%)'

            entry['ieepa_tariffs'].append({
                'country': 'CA',
                'rate': rate,
                'label': label,
                'note': 'USMCA-origin goods exempt; Does not stack with Section 232',
                'effective': '2025-03-04',
                'legal_status': 'Under judicial review, currently in effect'
            })

        if not is_steel_product(hts_code) and not is_aluminum_product(hts_code) and not is_solar_product(hts_code):
            if is_potash_product(hts_code):
                rate = 10.0
                label = 'IEEPA Tariff - Mexico (10% - Potash)'
            else:
                rate = 25.0
                label = 'IEEPA Tariff - Mexico (25%)'

            entry['ieepa_tariffs'].append({
                'country': 'MX',
                'rate': rate,
                'label': label,
                'note': 'USMCA-origin goods exempt; Does not stack with Section 232',
                'effective': '2025-03-04',
                'legal_status': 'Under judicial review, currently in effect'
            })

    return entry

def main():
    """Main processing function"""

    parser = argparse.ArgumentParser(
        description="Preprocess tariff data with Section 301 integration.",
        formatter_class=argparse.RawTextHelpFormatter
    )
    parser.add_argument('input_csv', help="Path to the input tariff CSV file.")
    parser.add_argument('section301_csv', help="Path to the Section 301 deduplicated CSV file.")
    parser.add_argument('output_json', help="Path to the output JSON file.")
    parser.add_argument('hts_revision', nargs='?', default='Unknown', help="Optional HTS revision string.")
    parser.add_argument(
        '--inject-extra-tariffs',
        action='store_true',
        help="Flag to inject Reciprocal, Fentanyl, and IEEPA tariffs."
    )
    parser.add_argument(
        '--section-301-only',
        action='store_true',
        help="Filter to ONLY HTS codes that have Section 301 duties."
    )
    args = parser.parse_args()

    input_file = args.input_csv
    section301_file = args.section301_csv
    output_file = args.output_json
    hts_revision = args.hts_revision
    inject_extra_tariffs = args.inject_extra_tariffs
    section_301_only = args.section_301_only

    print(f"Processing {input_file}...")
    print(f"Loading Section 301 data from {section301_file}...")
    print(f"HTS Revision: {hts_revision}")
    if section_301_only:
        print("Filtering to ONLY Section 301 HTS codes.")
    else:
        print("Processing ALL HTS codes (Section 301 rates will be applied where applicable).")
    if inject_extra_tariffs:
        print("Injecting extra tariffs (Fentanyl, Reciprocal, IEEPA) is ENABLED.")
    else:
        print("Injecting extra tariffs is DISABLED.")

    # Load Section 301 data first
    if not load_section_301_data(section301_file):
        print("Failed to load Section 301 data. Exiting.")
        sys.exit(1)
    
    # Load Section 201 data (optional - won't fail if file doesn't exist)
    # Look for section201_solar.csv in the exports directory
    section201_file = os.path.join(os.path.dirname(section301_file), 'section201_solar.csv')
    load_section_201_data(section201_file)

    entries = []
    chapter_99_count = 0
    special_provision_count = 0
    reciprocal_tariff_count = 0
    section_301_count = 0
    section_232_count = 0
    section_201_count = 0
    total_processed = 0

    # Read CSV file
    with open(input_file, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)

        for row in reader:
            total_processed += 1
            entry = process_tariff_entry(row, inject_extra_tariffs, section_301_only)
            if entry is None:
                continue  # Skip entries based on filtering criteria

            entries.append(entry)

            if entry.get('is_chapter_99'):
                chapter_99_count += 1
            if entry.get('is_special_provision'):
                special_provision_count += 1
            if entry.get('reciprocal_tariffs'):
                reciprocal_tariff_count += 1
            if entry.get('additive_duties'):
                for duty in entry['additive_duties']:
                    if duty['type'] == 'section_301':
                        section_301_count += 1
                    elif duty['type'] == 'section_232':
                        section_232_count += 1
                    elif duty['type'] == 'section_201':
                        section_201_count += 1

    print(f"\nProcessed {total_processed} total tariff entries")
    if section_301_only:
        print(f"Found {len(entries)} entries with Section 301 duties")
    else:
        print(f"Included {len(entries)} total entries")
    print(f"  - Chapter 99 codes: {chapter_99_count}")
    print(f"  - Special provisions: {special_provision_count}")
    print(f"  - With reciprocal tariffs: {reciprocal_tariff_count}")
    print(f"  - With Section 301 duties: {section_301_count}")
    print(f"  - With Section 232 duties: {section_232_count}")
    print(f"  - With Section 201 duties: {section_201_count}")

    # Count by Section 301 list
    list_counts = {}
    for entry in entries:
        if 'section_301_list' in entry:
            list_num = entry.get('section_301_list', 'Unknown')
            list_counts[list_num] = list_counts.get(list_num, 0) + 1
    
    if list_counts:
        print("\nSection 301 breakdown by list:")
        for list_num in sorted(list_counts.keys()):
            rate = "25%" if list_num in ['1', '2', '3'] else "7.5%" if list_num == '4a' else "Unknown"
            print(f"  - List {list_num}: {list_counts[list_num]} entries ({rate} tariff)")

    # Create output structure
    output_data = {
        'data_last_updated': datetime.now().strftime('%Y-%m-%d'),
        'hts_revision': hts_revision,
        'tariffs': entries,
        'metadata': {
            'total_entries': len(entries),
            'chapter_99_entries': chapter_99_count,
            'special_provisions': special_provision_count,
            'reciprocal_tariff_entries': reciprocal_tariff_count,
            'section_301_entries': section_301_count,
            'section_232_entries': section_232_count,
            'section_201_entries': section_201_count,
            'section_301_only': section_301_only,  # Whether this file contains only Section 301 affected items
            'section_301_breakdown': list_counts,
            'preprocessing_version': '3.0',
            'hts_revision': hts_revision,
            'processing_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'additive_duties_info': ADDITIVE_DUTIES
        },
        'country_programs': COUNTRY_TO_PROGRAMS
    }

    # Write JSON file
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)

    print(f"\nOutput written to {output_file}")
    if section_301_only:
        print("\nIMPORTANT: This output contains ONLY HTS codes that have Section 301 add-ons.")
        print("Use this for HarmonyTi Results and Tariff Intelligence features.")
    else:
        print("\nIMPORTANT: This output contains ALL HTS codes.")
        print("Section 301 rates have been applied where applicable.")

if __name__ == '__main__':
    main() 