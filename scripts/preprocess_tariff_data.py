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
        'name': 'Section 301 - China Trade',
        'countries': ['CN'],
        'lists': {
            'list_1': {'rate': 0.25, 'effective': '2018-07-06'},
            'list_2': {'rate': 0.25, 'effective': '2018-08-23'},
            'list_3': {'rate': 0.25, 'effective': '2018-09-24'},
            'list_4a': {'rate': 0.075, 'effective': '2019-09-01'}
        },
        'exclusions': {
            '9903.88.69': {'expires': '2025-08-31'},
            '9903.88.70': {'expires': '2025-09-01'}
        }
    },
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
    }
}

# Reciprocal Tariff Exemptions
# These HTS codes are exempt from reciprocal tariffs
RECIPROCAL_TARIFF_EXEMPTIONS = {
    'china': {
        # Pharmaceutical products
        'chapters': ['30'],
        # Medical devices and equipment
        'hts_prefixes': ['9018', '9019', '9020', '9021', '9022'],
        # Semiconductors (Chapter 85 specific codes would need to be added)
        'hts_prefixes_semiconductors': ['8541', '8542'],  # Diodes, transistors, integrated circuits
        # Essential food products
        'specific_codes': [],
        # Note: Annex II specific codes would need to be added here
    },
    'canada': {
        # Energy products
        'chapters': ['27'],  # Mineral fuels, oils
        # Agricultural products under specific programs
        'hts_prefixes': [],
        'specific_codes': [],
    },
    'mexico': {
        # Energy products
        'chapters': ['27'],  # Mineral fuels, oils
        # Agricultural products under specific programs
        'hts_prefixes': [],
        'specific_codes': [],
    }
}

# Fentanyl Tariff Exemptions - Much more limited
FENTANYL_TARIFF_EXEMPTIONS = {
    'china': {
        # Chapter 98 - U.S. goods returned, personal exemptions
        'chapters': ['98'],
        # Humanitarian goods - would need specific HTS codes
        'hts_prefixes': [],
        # Personal-use items - typically small quantities, not commercial
        'specific_codes': [],
    }
}

# --- Configuration flag ---
# Set to False to disable automatic injection of Reciprocal, Fentanyl, and IEEPA tariffs
INJECT_EXTRA_TARIFFS: bool = False

def is_exempt_from_reciprocal_tariff(hts_code: str, country: str) -> bool:
    """Check if an HTS code is exempt from reciprocal tariffs for a specific country"""
    # Normalize country code to handle both 'CN' and 'china', 'CA' and 'canada', etc.
    country_mapping = {
        'CN': 'china',
        'CA': 'canada',
        'MX': 'mexico',
        'china': 'china',
        'canada': 'canada',
        'mexico': 'mexico'
    }

    country_key = country_mapping.get(country, country.lower())
    if country_key not in RECIPROCAL_TARIFF_EXEMPTIONS:
        return False

    exemptions = RECIPROCAL_TARIFF_EXEMPTIONS[country_key]

    # Check chapter exemptions
    chapter = hts_code[:2] if len(hts_code) >= 2 else ''
    if chapter in exemptions.get('chapters', []):
        return True

    # Check HTS prefix exemptions
    for prefix in exemptions.get('hts_prefixes', []):
        if hts_code.startswith(prefix):
            return True

    # Check semiconductor exemptions for China
    if country_key == 'china':
        for prefix in exemptions.get('hts_prefixes_semiconductors', []):
            if hts_code.startswith(prefix):
                return True

    # Check specific code exemptions
    if hts_code in exemptions.get('specific_codes', []):
        return True

    return False

def is_exempt_from_fentanyl_tariff(hts_code: str, country: str) -> bool:
    """Check if an HTS code is exempt from fentanyl tariffs - much more restrictive"""
    # Normalize country code
    country_mapping = {
        'CN': 'china',
        'china': 'china'
    }

    country_key = country_mapping.get(country, country.lower())
    if country_key not in FENTANYL_TARIFF_EXEMPTIONS:
        return False

    exemptions = FENTANYL_TARIFF_EXEMPTIONS[country_key]

    # Check chapter exemptions (mainly Chapter 98)
    chapter = hts_code[:2] if len(hts_code) >= 2 else ''
    if chapter in exemptions.get('chapters', []):
        return True

    # Check HTS prefix exemptions
    for prefix in exemptions.get('hts_prefixes', []):
        if hts_code.startswith(prefix):
            return True

    # Check specific code exemptions
    if hts_code in exemptions.get('specific_codes', []):
        return True

    return False

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

def is_energy_product(hts_code: str) -> bool:
    """Check if HTS code is for energy products (Chapter 27 - mineral fuels, oils)"""
    return hts_code.startswith('27')

def is_potash_product(hts_code: str) -> bool:
    """Check if HTS code is for potash products"""
    # Potash is typically classified under:
    # 3104.20 - Potassium chloride
    # 3105.20 - Mineral or chemical fertilizers containing potassium
    return hts_code.startswith('310420') or hts_code.startswith('310520')

def determine_additive_duties(hts_code: str, entry: Dict[str, Any]) -> Dict[str, Any]:
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

    # Add reciprocal tariff and fentanyl tariff information if enabled
    if INJECT_EXTRA_TARIFFS and not entry.get('is_chapter_99'):
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
    if INJECT_EXTRA_TARIFFS and not entry.get('is_chapter_99'):
        if 'ieepa_tariffs' not in entry:
            entry['ieepa_tariffs'] = []

        if not is_steel_product(hts_code) and not is_aluminum_product(hts_code):
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

        if not is_steel_product(hts_code) and not is_aluminum_product(hts_code):
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

    if len(sys.argv) < 3 or len(sys.argv) > 4:
        print("Usage: python preprocess_tariff_data.py <input_csv> <output_json> [hts_revision]")
        print("Example: python preprocess_tariff_data.py input.csv output.json 'Revision 11'")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2]
    hts_revision = sys.argv[3] if len(sys.argv) == 4 else 'Unknown'

    print(f"Processing {input_file}...")
    print(f"HTS Revision: {hts_revision}")

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

    # Prepare additive duty info for metadata (strip extra tariffs if disabled)
    if INJECT_EXTRA_TARIFFS:
        additive_info_meta = ADDITIVE_DUTIES
    else:
        additive_info_meta = {
            k: v
            for k, v in ADDITIVE_DUTIES.items()
            if k not in [
                'reciprocal_china',
                'fentanyl_china',
                'ieepa_canada',
                'ieepa_mexico',
            ]
        }

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
            'trade_action_entries': trade_action_count,
            'preprocessing_version': '2.0',
            'hts_revision': hts_revision,
            'processing_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'additive_duties_info': additive_info_meta
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
