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
import os
from datetime import datetime

# Path to the new trade rules configuration file
TRADE_RULES_PATH = os.path.join(os.path.dirname(__file__), 'config', 'trade_rules.csv')

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

# Reciprocal Tariff Exemptions (To be phased out or integrated into trade_rules.csv)
RECIPROCAL_TARIFF_EXEMPTIONS = {
    'china': {
        'chapters': ['30'],
        'hts_prefixes': ['9018', '9019', '9020', '9021', '9022'],
        'hts_prefixes_semiconductors': ['8541', '8542'],
        'specific_codes': [],
    },
    'canada': {
        'chapters': ['27'],
        'hts_prefixes': [],
        'specific_codes': [],
    },
    'mexico': {
        'chapters': ['27'],
        'hts_prefixes': [],
        'specific_codes': [],
    }
}

# Fentanyl Tariff Exemptions (To be phased out or integrated into trade_rules.csv)
FENTANYL_TARIFF_EXEMPTIONS = {
    'china': {
        'chapters': ['98'],
        'hts_prefixes': [],
        'specific_codes': [],
    }
}

def load_trade_rules(file_path: str) -> List[Dict[str, Any]]:
    """Loads trade rules from the specified CSV file."""
    if not os.path.exists(file_path):
        print(f"Error: Trade rules file not found at {file_path}")
        sys.exit(1)
    
    rules = []
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            rules.append(row)
    return rules

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

def determine_additive_duties(hts_code: str, trade_rules: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Determines which additive duties might apply to an HTS code based on the loaded rules.
    This function identifies potential duties based on product characteristics (e.g., chapter).
    The mobile app will then be responsible for applying the correct rate based on the country of origin.
    """
    applicable_duties = []

    # Filter rules that apply based on HTS code criteria
    for rule in trade_rules:
        if rule.get('Status') != 'Active':
            continue

        applies = False
        data_type = rule.get('AppliesTo_DataType')
        data_value = rule.get('AppliesTo_Value')

        if data_type == 'Chapter':
            chapters = data_value.split(';')
            if hts_code.startswith(tuple(chapters)):
                applies = True
        elif data_type == 'HTS_Code':
            if hts_code == data_value:
                applies = True
        elif data_type == 'Product_Type':
            product_types = data_value.split(';')
            if 'Energy' in product_types and is_energy_product(hts_code):
                applies = True
            if 'Potash' in product_types and is_potash_product(hts_code):
                applies = True
        
        # This rule is a potential match based on the product itself
        if applies:
             # Now, format the rule into a structure for the final JSON
            duty_info = {
                'rule_name': rule['RuleName'],
                'rule_type': rule['RuleType'],
                'countries': rule.get('Countries', 'all').split(';'),
                'rate': float(rule['Rate']) * 100 if rule.get('Rate') else 0,
                'note': rule.get('Note', ''),
                'status': rule.get('Status', '')
            }
            applicable_duties.append(duty_info)

    # Now, let's handle the more generic China tariffs that apply if not otherwise specified
    # This rebuilds the logic that was previously implicit
    is_steel = is_steel_product(hts_code)
    is_aluminum = is_aluminum_product(hts_code)
    
    if not is_steel and not is_aluminum:
        # Fentanyl Tariff (assumed to apply to all non-steel/aluminum from China unless exempt)
        if not is_exempt_from_fentanyl_tariff(hts_code, 'CN'):
             fentanyl_rule = next((r for r in trade_rules if r['RuleName'] == 'Fentanyl Tariff'), None)
             if fentanyl_rule:
                applicable_duties.append({
                    'rule_name': fentanyl_rule['RuleName'],
                    'rule_type': fentanyl_rule['RuleType'],
                    'countries': fentanyl_rule.get('Countries', 'all').split(';'),
                    'rate': float(fentanyl_rule['Rate']) * 100,
                    'note': fentanyl_rule.get('Note', ''),
                    'status': fentanyl_rule.get('Status', '')
                })

        # Reciprocal Tariff (assumed to apply to all non-steel/aluminum from China unless exempt)
        if not is_exempt_from_reciprocal_tariff(hts_code, 'CN'):
            reciprocal_rule = next((r for r in trade_rules if r['RuleName'] == 'IEEPA Tariff' and 'CN' in r['Countries']), None)
            if reciprocal_rule:
                applicable_duties.append({
                    'rule_name': reciprocal_rule['RuleName'],
                    'rule_type': reciprocal_rule['RuleType'],
                    'countries': reciprocal_rule.get('Countries', 'all').split(';'),
                    'rate': float(reciprocal_rule['Rate']) * 100,
                    'note': reciprocal_rule.get('Note', ''),
                    'status': reciprocal_rule.get('Status', '')
            })

    return applicable_duties

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

def process_tariff_entry(row: Dict[str, Any], trade_rules: List[Dict[str, Any]]) -> Dict[str, Any]:
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
                        entry['trade_action_label'] = 'Trade Action Tariff'
                    elif col2_rate == 0.10:  # 10% rate
                        entry['trade_action_countries'] = ['CA']  # Might be aluminum/steel
                        entry['trade_action_label'] = 'Trade Action Tariff'
                    else:
                        # Other rates - would need more context to determine countries
                        entry['trade_action_countries'] = []
                        entry['trade_action_label'] = 'Trade Action Tariff'
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
    additive_duties_info = determine_additive_duties(hts_code, trade_rules)
    if additive_duties_info:
        entry['additive_duties'] = additive_duties_info

    # Add reciprocal tariff information
    if not entry.get('is_chapter_99'):
        # Initialize reciprocal tariff fields
        entry['reciprocal_tariffs'] = []

        # China tariffs
        if not is_steel_product(hts_code) and not is_aluminum_product(hts_code):
            # Steel and aluminum have their own Section 232 duties

            # Add temporary reciprocal tariff (10%) - has more exemptions
            if not is_exempt_from_reciprocal_tariff(hts_code, 'CN'):
                entry['reciprocal_tariffs'].append({
                    'country': 'CN',
                    'rate': 10.0,  # 10% reciprocal tariff
                    'label': 'Reciprocal Tariff - China',
                    'note': 'Temporary 90-day agreement',
                    'effective': '2025-05-14',
                    'expires': '2025-08-12'
                })

            # Add permanent fentanyl anti-trafficking tariff (20%) - very limited exemptions
            if not is_exempt_from_fentanyl_tariff(hts_code, 'CN'):
                entry['reciprocal_tariffs'].append({
                    'country': 'CN',
                    'rate': 20.0,  # 20% fentanyl anti-trafficking tariff
                    'label': 'Fentanyl Anti-Trafficking Tariff - China',
                    'note': 'Anti-trafficking measure',
                    'effective': '2025-03-04',  # Same as IEEPA effective date
                    'expires': None  # No expiration
                })

    # Add IEEPA tariffs for Canada and Mexico (separate from reciprocal tariffs)
    if not entry.get('is_chapter_99'):
        if 'ieepa_tariffs' not in entry:
            entry['ieepa_tariffs'] = []

        # Canada IEEPA tariff - does not apply to steel/aluminum (they have Section 232)
        if not is_steel_product(hts_code) and not is_aluminum_product(hts_code):
            # Determine the rate based on product type
            if is_energy_product(hts_code) or is_potash_product(hts_code):
                rate = 10.0  # Reduced rate for energy and potash
                label = 'IEEPA Tariff - Canada'
            else:
                rate = 25.0  # Standard rate
                label = 'IEEPA Tariff - Canada'

            entry['ieepa_tariffs'].append({
                'country': 'CA',
                'rate': rate,
                'label': label,
                'note': 'USMCA-origin goods exempt; Does not stack with Section 232',
                'effective': '2025-03-04',
                'legal_status': 'Under judicial review, currently in effect'
            })

        # Mexico IEEPA tariff - does not apply to steel/aluminum (they have Section 232)
        if not is_steel_product(hts_code) and not is_aluminum_product(hts_code):
            # Determine the rate based on product type
            if is_potash_product(hts_code):
                rate = 10.0  # Reduced rate for potash only
                label = 'IEEPA Tariff - Mexico'
            else:
                rate = 25.0  # Standard rate (no energy exemption for Mexico)
                label = 'IEEPA Tariff - Mexico'

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

    print(f"Loading trade rules from {TRADE_RULES_PATH}...")
    trade_rules = load_trade_rules(TRADE_RULES_PATH)
    print(f"Loaded {len(trade_rules)} rules.")

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
            entry = process_tariff_entry(row, trade_rules)
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
                    if duty['rule_name'] == 'Section 301':
                        section_301_count += 1
                    elif duty['rule_name'] == 'Section 232':
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
            'additive_duties_info': trade_rules
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
                if duty['rule_name'] == 'Section 232' and example_count < 5:
                    print(f"  {entry['hts8']}: {duty['note']} - {entry['brief_description'][:50]}...")
                    example_count += 1
                    break

if __name__ == '__main__':
    main()
