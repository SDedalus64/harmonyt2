# Xcode Build & Archive Checklist

## Pre-Build Checks

- [x] Run `npx expo prebuild --clean`
- [ ] Ensure CocoaPods installation completes successfully
- [ ] Check that `ios/` directory is properly generated

## Xcode Setup

1. **Open Project in Xcode**
   ```bash
   open ios/HarmonyTi.xcworkspace
   ```
   Note: Always open the `.xcworkspace` file, not `.xcodeproj`

2. **Select Target Device**
   - [ ] Select "Any iOS Device (arm64)" for archive
   - [ ] Or select your physical device for testing

3. **Check Build Settings**
   - [ ] Verify Bundle Identifier: `com.sdedola.tcalcmobile`
   - [ ] Check Version: 2.0.0
   - [ ] Check Build: 18
   - [ ] Verify Team is selected (your Apple Developer account)

## Build Steps

1. **Clean Build Folder**
   - Menu: Product → Clean Build Folder (⇧⌘K)

2. **Build for Testing**
   - [ ] Product → Build (⌘B)
   - [ ] Check for any build errors
   - [ ] Resolve any warnings if critical

3. **Test on Device (Optional)**
   - [ ] Connect iPhone
   - [ ] Select device in Xcode
   - [ ] Product → Run (⌘R)
   - [ ] Verify app runs correctly

## Archive for Distribution

1. **Create Archive**
   - [ ] Ensure "Any iOS Device" is selected
   - [ ] Product → Archive
   - [ ] Wait for archive to complete (may take 5-10 minutes)

2. **Validate Archive**
   - [ ] In Organizer, select the archive
   - [ ] Click "Validate App"
   - [ ] Choose distribution method (App Store Connect)
   - [ ] Complete validation process

3. **Upload to App Store Connect**
   - [ ] Click "Distribute App"
   - [ ] Select "App Store Connect"
   - [ ] Choose upload options
   - [ ] Complete upload

## Common Issues & Solutions

### Issue: "Signing for 'HarmonyTi' requires a development team"
**Solution**: Select your team in Signing & Capabilities

### Issue: Module not found errors
**Solution**:
```bash
cd ios && pod install
```

### Issue: Build fails with "PhaseScriptExecution" error
**Solution**: Check that all npm packages are installed:
```bash
npm install
cd ios && pod install
```

### Issue: Archive is grayed out
**Solution**: Make sure "Any iOS Device" is selected, not a simulator

### Issue: "No account for team" error
**Solution**: Sign in to Xcode with your Apple ID (Xcode → Preferences → Accounts)

## Post-Archive

- [ ] Check App Store Connect for processing status
- [ ] Submit for TestFlight review if needed
- [ ] Update release notes

## Version Bump (for next release)
After successful archive:
```bash
# Update app.json
# Increment ios.buildNumber to 19
# Update version if needed
```
