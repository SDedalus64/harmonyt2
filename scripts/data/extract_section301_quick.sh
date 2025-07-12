#!/bin/bash
# Quick methods to extract HTS codes from Section 301 PDFs without Python libraries

echo "Alternative PDF extraction methods for Section 301 lists:"
echo ""

# Method 1: Using macOS built-in tools
echo "1. macOS textutil (if on Mac):"
echo "   textutil -convert txt section301_list1.pdf -output list1.txt"
echo ""

# Method 2: Using online tools
echo "2. Online PDF to CSV converters:"
echo "   - https://www.ilovepdf.com/pdf_to_excel"
echo "   - https://smallpdf.com/pdf-to-excel"
echo "   - Adobe Acrobat online"
echo ""

# Method 3: Using command line tools
echo "3. Command line tools (install with brew/apt):"
echo "   # Install pdftotext"
echo "   brew install poppler  # macOS"
echo "   apt-get install poppler-utils  # Linux"
echo ""
echo "   # Extract text"
echo "   pdftotext -layout section301_list1.pdf list1.txt"
echo ""

# Method 4: Using grep to extract HTS codes from text
echo "4. Extract HTS codes from text file:"
echo "   # Basic pattern for HTS codes (XXXX.XX or XXXX.XX.XX)"
echo "   grep -oE '\b[0-9]{4}\.[0-9]{2}(\.[0-9]{2})?\b' list1.txt | sort -u > hts_codes.txt"
echo ""

# Method 5: Convert to CSV manually
echo "5. Create CSV from extracted codes:"
cat << 'EOF' > convert_to_csv.awk
BEGIN {
    print "hts_code,list_number,rate,effective_date"
}
{
    # Assuming $1 is the HTS code
    list_num = ENVIRON["LIST_NUM"]
    rate = ENVIRON["RATE"]
    date = ENVIRON["EFF_DATE"]
    print $1 "," list_num "," rate "," date
}
EOF

echo "   # Usage:"
echo "   LIST_NUM=1 RATE=25 EFF_DATE=2018-07-06 awk -f convert_to_csv.awk hts_codes.txt > section301_list1.csv" 