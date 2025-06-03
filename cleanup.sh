#!/bin/bash

# Project Cleanup Script for Harmony/RateCast
# This script safely removes orphan files and cleans build artifacts

set -e  # Exit on error

echo "========================================="
echo "Project Cleanup Script for Harmony/RateCast"
echo "========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "src" ]; then
    echo "Error: This script must be run from the project root directory"
    exit 1
fi

# Create backup directory
BACKUP_DIR="cleanup_backup_$(date +%Y%m%d_%H%M%S)"
echo "Creating backup directory: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# Function to safely remove files
safe_remove() {
    if [ -f "$1" ]; then
        echo "  - Moving $1 to backup..."
        mv "$1" "$BACKUP_DIR/" 2>/dev/null || echo "    Warning: Could not move $1"
    fi
}

# Phase 1: Backup and remove orphan files
echo ""
echo "Phase 1: Removing orphan files..."
echo "================================="

safe_remove "Archive.zip"
safe_remove "Archive 2.zip"
safe_remove "~\$Tariff_Programs.xlsx"
safe_remove "bundletool.jar"
safe_remove "icon.ai"
safe_remove "EMAIL_TO_BROTHER.txt"

# Phase 2: Remove duplicate data files
echo ""
echo "Phase 2: Removing duplicate data files..."
echo "========================================="

safe_remove "Tariff.json"
safe_remove "htsdata.json"
safe_remove "tariff_database_2025.xlsx"
safe_remove "HTS Cross-Reference Table for Tariff Rates (May 31, 2025).csv"
safe_remove "htscrossref20250531.csv"
safe_remove "Tariff_Programs.xlsx"

# Remove unused tariff file in scripts
if [ -f "scripts/tariffnew.json" ]; then
    echo "  - Moving scripts/tariffnew.json to backup..."
    mv "scripts/tariffnew.json" "$BACKUP_DIR/" 2>/dev/null
fi

# Phase 3: Move test/example scripts
echo ""
echo "Phase 3: Organizing test scripts..."
echo "==================================="

mkdir -p "examples"
for file in analyze_hts_examples.js find_example_hts_codes.js check_hts_code.js test_additive_duties.ts; do
    if [ -f "$file" ]; then
        echo "  - Moving $file to examples/"
        mv "$file" "examples/" 2>/dev/null
    fi
done

# Phase 4: Clean build artifacts
echo ""
echo "Phase 4: Cleaning build artifacts..."
echo "===================================="

# iOS
if [ -d "ios/build" ]; then
    echo "  - Removing ios/build..."
    rm -rf "ios/build"
fi

# Android
if [ -d "android/build" ]; then
    echo "  - Removing android/build..."
    rm -rf "android/build"
fi

if [ -d "android/.gradle" ]; then
    echo "  - Removing android/.gradle..."
    rm -rf "android/.gradle"
fi

# Expo
if [ -d ".expo" ]; then
    echo "  - Removing .expo..."
    rm -rf ".expo"
fi

# Check if backup directory is empty and remove if so
if [ -z "$(ls -A $BACKUP_DIR)" ]; then
    rmdir "$BACKUP_DIR"
    echo ""
    echo "No files were backed up (backup directory removed)"
else
    echo ""
    echo "Backed up files can be found in: $BACKUP_DIR"
fi

echo ""
echo "========================================="
echo "Cleanup complete!"
echo ""
echo "Next steps:"
echo "1. Run 'npm install' to ensure dependencies are correct"
echo "2. Test the app with 'npm start'"
echo "3. If everything works, you can delete the backup directory"
echo "4. Commit these changes to git"
echo "========================================="
