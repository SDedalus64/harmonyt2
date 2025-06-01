#!/usr/bin/env python3
"""
Preprocess tariff data to handle special cases and clean up data structure.
This script processes the raw tariff CSV data and creates a clean JSON file
that's easier for the app to consume.
"""

import csv
import json
import re
from typing import Dict, Any, Optional, List
import sys
from datetime import datetime

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
    'section_301': {
        'name': 'Section 301 Tariffs',
        'countries': ['CN'],
        'lists': {
            'list_1': {'rate': 0.25, 'effective': '2018-07-06'},
            'list_2': {'rate': 0.25, 'effective': '2018-08-23'},
            'list_3': {'rate': 0.25, 'effective': '2018-09-24'},
            'list_4a': {'rate': 0.075, 'effective': '2019-09-01'}
        }
    },
    'section_232_steel': {
        'name': 'Section 232 - Steel',
        'countries': 'global',
        'chapters': ['72', '73'],
        'rate': 0.50,  # Increased to 50% as of June 4, 2025
        'effective': '2018-03-23',
        'note': 'Increased from 25% to 50% on June 4, 2025'
    },
    'section_232_aluminum': {
        'name': 'Section 232 - Aluminum',
        'countries': 'global',
        'chapters': ['76'],
        'rate': 0.50,  # Increased to 50% as of June 4, 2025
        'effective': '2018-03-23',
        'note': 'Increased from 25% to 50% on June 4, 2025'
    },
    'reciprocal_china': {
        'name': 'Reciprocal Tariff - China (Temporary)',
        'countries': ['CN'],
        'rate': 0.30,  # 10% reciprocal + 20% fentanyl-related
        'effective': '2025-05-14',
        'expires': '2025-08-12',
        'note': 'Temporary 90-day reduction from 145%'
    },
    'reciprocal_canada': {
        'name': 'Reciprocal Tariff - Canada',
        'countries': ['CA'],
        'rate': 0.25,
        'effective': '2025-03-04',
        'note': 'USMCA-origin goods exempt as of March 7, 2025'
    },
    'reciprocal_mexico': {
        'name': 'Reciprocal Tariff - Mexico',
        'countries': ['MX'],
        'rate': 0.25,
        'effective': '2025-03-04',
        'note': 'USMCA-origin goods exempt as of March 7, 2025'
    }
}

def parse_additional_duty_text(duty_text: str) -> Optional[float]:
    """Extract percentage from duty text like 'The duty provided in the applicable subheading + 25%'"""
    if not duty_text:
        return None

    # Look for patterns like "+ 25%" or "+25%"
    match = re.search(r'\+\s*(\d+(?:\.\d+)?)\s*%', duty_text)
    if match:
        return float(match.group(1))
    return None

def is_chapter_99_code(hts_code: str) -> bool:
    """Check if an HTS code is a Chapter 99 special provision"""
    return hts_code.startswith('99')

def get_country_programs(country_code: str) -> Dict[str, Any]:
    """Get the trade programs for a country"""
    return COUNTRY_TO_PROGRAMS.get(country_code, {
        'code': country_code,
        'name': country_code,
        'programs': []
    })

def is_steel_product(hts_code: str) -> bool:
    """Check if HTS code is for steel products (Chapter 72 or 73)"""
    return hts_code.startswith('72') or hts_code.startswith('73')

def is_aluminum_product(hts_code: str) -> bool:
    """Check if HTS code is for aluminum products (Chapter 76)"""
    return hts_code.startswith('76')

def determine_additive_duties(hts_code: str, entry: Dict[str, Any]) -> Dict[str, Any]:
    """Determine which additive duties apply to this HTS code"""
    additive_duties = []

    # Check for Section 232 duties (global application)
    if is_steel_product(hts_code):
        additive_duties.append({
            'type': 'section_232',
            'name': 'Section 232 - Steel Tariff',
            'rate': 50.0,  # 50% as of June 4, 2025
            'countries': 'all',  # Applies globally
            'label': 'Section 232 Steel (50%)'
        })
    elif is_aluminum_product(hts_code):
        additive_duties.append({
            'type': 'section_232',
            'name': 'Section 232 - Aluminum Tariff',
            'rate': 50.0,  # 50% as of June 4, 2025
            'countries': 'all',  # Applies globally
            'label': 'Section 232 Aluminum (50%)'
        })

    # Check for Section 301 duties (China-specific)
    # Use the ADDITIVE_DUTIES constant to determine which products are affected
    section_301_info = ADDITIVE_DUTIES.get('section_301')
    if section_301_info:
        # For now, we'll apply Section 301 to all non-steel/aluminum products
        # In a real implementation, we would need to check against the actual lists
        if not is_steel_product(hts_code) and not is_aluminum_product(hts_code):
            # Use the highest rate from the lists (25% for lists 1-3)
            rate = 25.0  # Default to 25% for lists 1-3
            if hts_code.startswith('99'):  # If it's a Chapter 99 code
                # Use the lower rate for List 4A
                rate = 7.5
            additive_duties.append({
                'type': 'section_301',
                'name': 'Section 301 - China Trade',
                'rate': rate,
                'countries': ['CN'],
                'label': f'Section 301 ({rate}%)'
            })

    return additive_duties

def clean_field_name(field_name: str) -> str:
    """Remove BOM and other unwanted characters from field names"""
    # Remove BOM character if present
    return field_name.replace('\ufeff', '').strip()

def clean_hts_code(hts_code: str) -> str:
    """Clean HTS code by removing BOM and other unwanted characters"""
    if not hts_code:
        return ''
    # Remove BOM and any other non-alphanumeric characters except dots
    cleaned = hts_code.replace('\ufeff', '').strip()
    # Remove any remaining non-digit characters for HTS codes
    cleaned = re.sub(r'[^\d]', '', cleaned)
    return cleaned

def process_tariff_entry(row: Dict[str, Any]) -> Dict[str, Any]:
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

    # Create cleaned entry
    entry = {
        'hts8': hts_code,
        'brief_description': row.get('brief_description', row.get('Description', '')),
        'is_chapter_99': is_chapter_99_code(hts_code),
    }

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

                # Determine if this is a special trade action
                mfn_rate = entry.get('mfn_ad_val_rate', 0)

                # If Column 2 rate is significantly higher than MFN rate, it's likely a trade action
                if col2_rate > mfn_rate and col2_rate >= 0.10:  # 10% or higher
                    entry['has_special_trade_action'] = True
                    entry['trade_action_rate'] = col2_rate * 100  # Convert to percentage

                    # Determine which countries this applies to based on the rate
                    if col2_rate == 0.25:  # 25% rate
                        entry['trade_action_countries'] = ['CA', 'MX']  # Canada and Mexico
                        entry['trade_action_label'] = 'Trade Action Tariff (25%)'
                    elif col2_rate == 0.10:  # 10% rate
                        entry['trade_action_countries'] = ['CA']  # Might be aluminum/steel
                        entry['trade_action_label'] = 'Trade Action Tariff (10%)'
                    else:
                        # Other rates - would need more context to determine countries
                        entry['trade_action_countries'] = []
                        entry['trade_action_label'] = f'Trade Action Tariff ({col2_rate * 100}%)'
                else:
                    # Traditional Column 2 countries
                    entry['has_special_trade_action'] = False
                    entry['column2_countries'] = ['CU', 'KP']  # Cuba, North Korea
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

    # Handle additional_duty field (for Section 301, Canadian lumber, etc.)
    if 'additional_duty' in row and row['additional_duty']:
        entry['additional_duty'] = row['additional_duty']

        # Parse the additional duty rate
        add_rate = parse_additional_duty_text(row['additional_duty'])
        if add_rate:
            entry['additional_duty_rate'] = add_rate

    # Determine all applicable additive duties for this product
    additive_duties_info = determine_additive_duties(hts_code, entry)
    if additive_duties_info:
        entry['additive_duties'] = additive_duties_info

    # Add reciprocal tariff information
    if not entry.get('is_chapter_99'):
        # Initialize reciprocal tariff fields
        entry['reciprocal_tariffs'] = []

        # China reciprocal tariff (temporary reduced rate)
        if not is_steel_product(hts_code) and not is_aluminum_product(hts_code):
            # Steel and aluminum have their own Section 232 duties
            entry['reciprocal_tariffs'].append({
                'country': 'CN',
                'rate': 30.0,  # 10% reciprocal + 20% fentanyl-related
                'label': 'Reciprocal Tariff - China (30%)',
                'note': 'Temporary reduction from 145% (expires Aug 12, 2025)',
                'effective': '2025-05-14',
                'expires': '2025-08-12'
            })

        # Canada reciprocal tariff
        entry['reciprocal_tariffs'].append({
            'country': 'CA',
            'rate': 25.0,
            'label': 'Reciprocal Tariff - Canada (25%)',
            'note': 'USMCA-origin goods exempt',
            'effective': '2025-03-04'
        })

        # Mexico reciprocal tariff
        entry['reciprocal_tariffs'].append({
            'country': 'MX',
            'rate': 25.0,
            'label': 'Reciprocal Tariff - Mexico (25%)',
            'note': 'USMCA-origin goods exempt',
            'effective': '2025-03-04'
        })

    return entry

def main():
    """Main processing function"""

    if len(sys.argv) != 3:
        print("Usage: python preprocess_tariff_data.py <input_csv> <output_json>")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2]

    print(f"Processing {input_file}...")

    entries = []
    chapter_99_count = 0
    special_provision_count = 0
    reciprocal_tariff_count = 0
    section_301_count = 0
    section_232_count = 0
    trade_action_count = 0

    # Read CSV file
    with open(input_file, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)

        for row in reader:
            entry = process_tariff_entry(row)
            if entry is None:
                continue  # Skip entries without valid HTS codes

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
            if entry.get('has_special_trade_action'):
                trade_action_count += 1

    print(f"Processed {len(entries)} entries")
    print(f"Found {chapter_99_count} Chapter 99 codes")
    print(f"Found {special_provision_count} special provisions")
    print(f"Found {reciprocal_tariff_count} entries with reciprocal tariffs")
    print(f"Found {section_301_count} entries with Section 301 duties")
    print(f"Found {section_232_count} entries with Section 232 duties")
    print(f"Found {trade_action_count} entries with trade action tariffs")

    # Create output structure
    output_data = {
        'data_last_updated': datetime.now().strftime('%Y-%m-%d'),
        'tariffs': entries,
        'metadata': {
            'total_entries': len(entries),
            'chapter_99_entries': chapter_99_count,
            'special_provisions': special_provision_count,
            'reciprocal_tariff_entries': reciprocal_tariff_count,
            'section_301_entries': section_301_count,
            'section_232_entries': section_232_count,
            'trade_action_entries': trade_action_count,
            'preprocessing_version': '2.0',
            'additive_duties_info': ADDITIVE_DUTIES
        },
        'country_programs': COUNTRY_TO_PROGRAMS
    }

    # Write JSON file
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)

    print(f"Output written to {output_file}")

    # Show some examples of Chapter 99 entries
    print("\nExample Chapter 99 entries:")
    example_count = 0
    for entry in entries:
        if entry.get('is_chapter_99') and entry.get('chapter_99_additional_rate'):
            print(f"  {entry['hts8']}: +{entry['chapter_99_additional_rate']}% - {entry['brief_description'][:60]}...")
            example_count += 1
            if example_count >= 5:
                break

    # Show some examples of Section 232 entries
    print("\nExample Section 232 entries (Steel/Aluminum):")
    example_count = 0
    for entry in entries:
        if entry.get('additive_duties'):
            for duty in entry['additive_duties']:
                if duty['type'] == 'section_232' and example_count < 5:
                    print(f"  {entry['hts8']}: {duty['label']} - {entry['brief_description'][:50]}...")
                    example_count += 1
                    break

if __name__ == '__main__':
    main()
