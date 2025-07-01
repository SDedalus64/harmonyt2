#!/usr/bin/env python3
"""
Extract HTS revision information from Change Record PDFs.
This script helps identify the revision number from the Change Record documents.
"""

import sys
import re

def extract_revision_from_text(text):
    """
    Extract HTS revision number from text.
    Common patterns:
    - "HTS 2025 Revision 11"
    - "2025 HTS Revision 11"
    - "Revision 11 to the 2025 HTS"
    """
    patterns = [
        r'HTS\s+\d{4}\s+Revision\s+(\d+)',
        r'\d{4}\s+HTS\s+Revision\s+(\d+)',
        r'Revision\s+(\d+)\s+to\s+the\s+\d{4}\s+HTS',
        r'HTS\s+Revision\s+(\d+)',
    ]

    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return f"Revision {match.group(1)}"

    return None

def main():
    """
    Main function to process input and extract revision.
    Can be used with PDF text extraction tools or manual input.
    """
    if len(sys.argv) > 1:
        # Read from file
        filename = sys.argv[1]
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                text = f.read()
        except Exception as e:
            print(f"Error reading file: {e}")
            sys.exit(1)
    else:
        # Read from stdin
        print("Enter text from Change Record (Ctrl+D when done):")
        text = sys.stdin.read()

    revision = extract_revision_from_text(text)

    if revision:
        print(f"\nFound HTS {revision}")
    else:
        print("\nNo revision number found in text")
        print("Common patterns to look for:")
        print("- HTS 2025 Revision 11")
        print("- 2025 HTS Revision 11")
        print("- Revision 11 to the 2025 HTS")

if __name__ == '__main__':
    main()
