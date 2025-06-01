#!/bin/bash

echo "🔧 Fixing common Xcode warnings for React Native project..."

# 1. Update CocoaPods
echo "📦 Updating CocoaPods..."
cd ios
pod repo update
pod install --repo-update

# 2. Clean build folders
echo "🧹 Cleaning build folders..."
rm -rf ~/Library/Developer/Xcode/DerivedData
rm -rf build/
cd ..

# 3. Clear Metro cache
echo "🗑️  Clearing Metro cache..."
npx react-native start --reset-cache &
sleep 5
kill $!

# 4. Fix common warnings in Podfile
echo "📝 Adding warning suppressions to Podfile..."
cd ios

# Check if post_install hook exists
if ! grep -q "post_install do |installer|" Podfile; then
    echo "" >> Podfile
    echo "post_install do |installer|" >> Podfile
    echo "  installer.pods_project.targets.each do |target|" >> Podfile
    echo "    target.build_configurations.each do |config|" >> Podfile
    echo "      # Disable warnings for all pods" >> Podfile
    echo "      config.build_settings['GCC_WARN_INHIBIT_ALL_WARNINGS'] = 'YES'" >> Podfile
    echo "      config.build_settings['SWIFT_SUPPRESS_WARNINGS'] = 'YES'" >> Podfile
    echo "      # Fix deployment target warnings" >> Podfile
    echo "      config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '13.4'" >> Podfile
    echo "    end" >> Podfile
    echo "  end" >> Podfile
    echo "  # Fix React-Core AccessibilityResources" >> Podfile
    echo "  installer.pods_project.build_configurations.each do |config|" >> Podfile
    echo "    config.build_settings['EXCLUDED_ARCHS[sdk=iphonesimulator*]'] = 'arm64'" >> Podfile
    echo "  end" >> Podfile
    echo "end" >> Podfile
fi

# 5. Reinstall pods with the new settings
echo "🔄 Reinstalling pods with warning suppressions..."
pod deintegrate
pod install

cd ..

echo "✅ Done! Common warning fixes applied."
echo ""
echo "Additional steps you can take:"
echo "1. In Xcode, go to Product > Clean Build Folder (Cmd+Shift+K)"
echo "2. Update your npm packages: npm update"
echo "3. For persistent warnings from specific pods, you can add them to the Podfile like:"
echo "   pod 'PodName', :inhibit_warnings => true"
echo ""
echo "Note: Some warnings from React Native core are expected and will be fixed in future RN versions."
