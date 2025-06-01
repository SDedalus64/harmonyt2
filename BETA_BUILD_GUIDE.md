# Beta Build Guide - Removing Developer Menu

## The Problem
In development builds, Expo shows a developer menu link at the bottom that can crash the app if clicked. This doesn't appear in production builds, but can be confusing during beta testing.

## Solution
I've configured your project to disable the developer menu in preview and production builds.

## Building for Beta Testing

### Option 1: Preview Build (Recommended for Beta)
```bash
# Build for iOS beta testing
eas build --platform ios --profile preview

# Build for Android beta testing
eas build --platform android --profile preview
```

### Option 2: Production Build
```bash
# Build for iOS App Store
eas build --platform ios --profile production

# Build for Android Play Store
eas build --platform android --profile production
```

## What's Different?

### Development Build (current)
- Shows developer menu
- Shows error overlays
- Includes debugging tools
- Use: `expo start` or `eas build --profile development`

### Preview/Beta Build
- NO developer menu
- NO error overlays
- Optimized performance
- Perfect for beta testing

### Production Build
- NO developer menu
- NO error overlays
- Fully optimized
- Ready for app stores

## Testing Locally Without Developer Menu

To test without the developer menu locally:
```bash
# Run in production mode locally
npx expo start --no-dev --minify
```

## Important Notes

1. **The developer menu only appears in development builds** - your beta testers won't see it
2. **Always use preview or production profiles** for beta testing
3. **The app won't crash** when built properly for distribution

## Quick Commands

```bash
# Check your current build profiles
eas build:list

# Build beta version for iOS
eas build --platform ios --profile preview

# Build beta version for Android
eas build --platform android --profile preview
```

Your app is now configured to hide all development UI in beta/production builds!
