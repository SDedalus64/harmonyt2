# Documentation Review Summary

This folder contains documents that have been moved here for review. They fall into three categories:

## 📁 /duplicates/

These files appear to duplicate or overlap with other documentation:

### HarmonyTi Backend Configuration Requirements.md

- **Duplicate of**: `/docs/development/BACKEND_REQUIREMENTS.md`
- **Action Needed**: Compare with BACKEND_REQUIREMENTS.md and merge any unique content, then delete

### RUN-SIMULATOR-TEST.txt

- **Overlaps with**: `/docs/simulator-test-guide.md`
- **Action Needed**: Check if this has any unique commands not in simulator-test-guide.md, then delete

## 📁 /potentially-outdated/

These files appear to be historical changelogs or completed feature documentation:

### New Features and Fixes.md

- **Description**: Changelog describing completed features (SettingsProvider fix, reciprocal tariff changes)
- **Action Needed**: Verify these changes are implemented, then archive or delete

### UX & Result-Related Enhancements.md

- **Description**: List of completed UX improvements and technical fixes
- **Action Needed**: Confirm these are all implemented, consider moving key info to main docs

### HarmonyTi v2.5 New Features.docx

### New Features and Fixes v2.5 Build 30.docx

### New Features and Fixes v2.5 Build 31.docx

- **Description**: Version-specific feature lists and build notes
- **Action Needed**: Extract any still-relevant information, then archive

### Change Record.pdf

- **Description**: Historical change record document (90KB, from June 25)
- **Action Needed**: Review for any unimplemented changes, then archive

### HarmonyTi - Fixes and Additions.pdf

- **Description**: Historical fixes and additions document (54KB, from June 19)
- **Action Needed**: Verify all fixes are implemented, then archive

## 📁 /meeting-notes/

Historical meeting notes and discussions:

### Troy Clark discussion re Tariffs June 9 2025.docx

- **Description**: Meeting notes about tariff discussions
- **Action Needed**: Review for any unimplemented requirements or decisions, then archive

## Recommendations

1. **Immediate Actions**:
   - Merge any unique content from duplicate files into their main counterparts
   - Delete pure duplicates after verification

2. **Documentation Cleanup**:
   - Create a single CHANGELOG.md in the root if you want to maintain version history
   - Move completed feature descriptions to user documentation if relevant
   - Archive old build notes

3. **Long-term**:
   - Consider using a more structured approach for version documentation
   - Implement a clear archival policy (e.g., move to archive after 6 months)
   - Use consistent naming conventions for feature documentation

## Files Kept in Place

The following files remain in their original locations as they are current and actively used:

- `/docs/README.md` - Documentation index (NOT a duplicate of root README)
- `/docs/development/BETA_TEST_CHECKLIST.pdf` - Current beta testing checklist
- `/docs/development/Harmonyti Tech Spec.pdf` - Technical specifications
- `/docs/Git_Recovery_Cheat_Sheet_Steph_FINAL_FULL.pdf` - Git recovery reference
- All files in `/docs/build-guides/` - Current build documentation
- All files in `/docs/api/` - Current API documentation
- All files in `/docs/cheatsheets/` - Active reference guides
