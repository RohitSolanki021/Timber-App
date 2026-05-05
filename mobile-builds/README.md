# Natural Plylam Mobile Apps - Build Guide

## Overview

Three separate mobile apps configured for your PHP backend at `https://app.naturalplylam.com`:

| App | Package ID | Color |
|-----|------------|-------|
| **Plylam Admin** | com.naturalplylam.admin | Navy Blue (#1a365d) |
| **Plylam Sales** | com.naturalplylam.sales | Green (#059669) |
| **Plylam Customer** | com.naturalplylam.customer | Purple (#7c3aed) |

---

## Files Included

```
mobile-builds/
├── plylam-admin-android.zip     # Admin app (Android ready)
├── plylam-sales-android.zip     # Sales app (Android ready)
├── plylam-customer-android.zip  # Customer app (Android ready)
└── README.md                    # This file
```

---

## Building Android APK

### Option 1: Using Android Studio (Recommended)

1. **Install Android Studio** from https://developer.android.com/studio

2. **Extract** one of the zip files (e.g., `plylam-admin-android.zip`)

3. **Open** the `android` folder in Android Studio

4. **Wait** for Gradle sync to complete

5. **Build APK:**
   - Go to `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
   - APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

6. **For Release APK (signed):**
   - Go to `Build` → `Generate Signed Bundle / APK`
   - Select `APK`
   - Create or use existing keystore
   - Select `release` build variant
   - APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

### Option 2: Using Command Line

```bash
# Extract the app
unzip plylam-admin-android.zip -d plylam-admin
cd plylam-admin/android

# Build debug APK
./gradlew assembleDebug

# APK location
ls app/build/outputs/apk/debug/
```

### Option 3: Using CI/CD (GitHub Actions)

Create `.github/workflows/build.yml`:

```yaml
name: Build Android APK

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up JDK
        uses: actions/setup-java@v3
        with:
          java-version: '17'
          distribution: 'temurin'
          
      - name: Build APK
        run: |
          cd android
          chmod +x gradlew
          ./gradlew assembleDebug
          
      - name: Upload APK
        uses: actions/upload-artifact@v3
        with:
          name: app-debug
          path: android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Building iOS App

### Requirements
- Mac computer with macOS
- Xcode 15+ installed
- Apple Developer Account ($99/year)

### Steps

1. **Add iOS platform** (on Mac):
   ```bash
   unzip plylam-admin-android.zip -d plylam-admin
   cd plylam-admin
   npm install
   npx cap add ios
   npx cap sync ios
   ```

2. **Open in Xcode:**
   ```bash
   npx cap open ios
   ```

3. **Configure signing:**
   - Select your Team in Signing & Capabilities
   - Update Bundle Identifier if needed

4. **Build:**
   - Select target device/simulator
   - Press `Cmd + B` to build
   - Press `Cmd + R` to run

5. **Archive for App Store:**
   - Product → Archive
   - Distribute App → App Store Connect

---

## App Store Submission

### Google Play Store

1. Create a Google Play Developer account ($25 one-time)
2. Go to Google Play Console
3. Create new app
4. Upload signed release APK
5. Fill in store listing, content rating, pricing
6. Submit for review

### Apple App Store

1. Ensure Apple Developer Program membership is active
2. Create app in App Store Connect
3. Archive from Xcode
4. Upload using Xcode or Transporter
5. Fill in app information
6. Submit for review

---

## Customization

### Change App Icon

Place your icons in:
- **Android:** `android/app/src/main/res/mipmap-*` folders
- **iOS:** `ios/App/App/Assets.xcassets/AppIcon.appiconset`

### Change Splash Screen

Edit `capacitor.config.json`:
```json
{
  "plugins": {
    "SplashScreen": {
      "backgroundColor": "#YOUR_COLOR",
      "launchShowDuration": 2000
    }
  }
}
```

### Change API URL

If you change your backend URL, update:
1. `src/apiService.ts` - Change the `API_BASE` URL
2. `capacitor.config.json` - Update `allowNavigation`
3. Rebuild: `npm run build && npx cap sync`

---

## Troubleshooting

### "Network Error" in app
- Ensure `https://app.naturalplylam.com` is accessible
- Check CORS is enabled on your PHP backend
- Verify `allowNavigation` includes your domain

### Build fails with Gradle error
- Update Gradle: `cd android && ./gradlew wrapper --gradle-version 8.0`
- Clean build: `./gradlew clean`

### iOS build fails
- Update CocoaPods: `pod repo update`
- Clean pods: `cd ios/App && pod deintegrate && pod install`

---

## Support

Backend API: `https://app.naturalplylam.com/api/index.php`

Test endpoints:
- Health: `GET /health`
- Login: `POST /login`
