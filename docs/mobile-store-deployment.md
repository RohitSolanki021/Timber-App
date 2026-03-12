# Mobile Deployment (Android + iOS)

This app is a Vite React web app. To publish it on Google Play and Apple App Store, package it with Capacitor.

## 1) Prerequisites

1. Node.js 20+
2. Java 17 + Android Studio (latest stable)
3. Xcode 15+ and macOS (required for iOS build/submission)
4. Active store accounts:
   1. Google Play Console
   2. Apple Developer Program

## 2) Configure production environment

Create `.env.production` (or configure in CI) with your production values:

```env
VITE_API_BASE_URL="https://api.yourdomain.com/api"
VITE_UPLOAD_BASE_URL="https://api.yourdomain.com/"
```

Build once to verify:

```bash
npm install
npm run build
```

`dist/` must be generated successfully.

## 3) Add Capacitor to the project (one-time)

```bash
npm i @capacitor/core @capacitor/cli
npx cap init "Customer Portal" "com.yourcompany.customerportal" --web-dir=dist
npm i @capacitor/android @capacitor/ios
npx cap add android
npx cap add ios
```

Create `capacitor.config.ts` in project root:

```ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourcompany.customerportal',
  appName: 'Customer Portal',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
```

## 4) Build + sync web assets (every release)

```bash
npm run build
npx cap sync
```

If native platforms are already open in IDE, re-run `npx cap sync` after each web change.

## 5) Android release (Google Play)

1. Open Android project:

```bash
npx cap open android
```

2. In Android Studio:
   1. Set version in `versionCode` and `versionName`.
   2. Build signed bundle: `Build > Generate Signed Bundle / APK > Android App Bundle`.
   3. Use upload keystore (`.jks`) and store credentials safely.
3. Output file: `.aab`.
4. Upload `.aab` to Google Play Console:
   1. `Testing` track first (internal/closed).
   2. Then promote to production.

Required Play setup before submit:
1. App privacy policy URL
2. Data safety form
3. Content rating
4. Screenshots, icon, feature graphic

## 6) iOS release (Apple App Store)

1. Open iOS project:

```bash
npx cap open ios
```

2. In Xcode:
   1. Set unique bundle identifier (`com.yourcompany.customerportal`).
   2. Configure Signing & Capabilities with your Team.
   3. Increment `Version` and `Build`.
3. Archive:
   1. `Product > Archive`
   2. `Distribute App > App Store Connect > Upload`
4. In App Store Connect:
   1. Create app record
   2. Select uploaded build
   3. Fill metadata, privacy, screenshots
   4. Submit for review

## 7) Useful release commands

```bash
# Build web app for production
npm run build

# Push web assets into native projects
npx cap sync

# Open native IDE projects
npx cap open android
npx cap open ios
```

## 8) CI/CD suggestion

1. Build web app in CI with production env values.
2. Run `npx cap sync`.
3. Build Android AAB via Gradle in CI.
4. Build iOS archive via Xcode Cloud/Fastlane on macOS runner.

## 9) Notes and risks

1. iOS builds/submission cannot be completed on Windows.
2. Ensure backend APIs allow app domain/mobile traffic (CORS/auth/session rules).
3. Keep API URLs HTTPS for store compliance.
4. Test login, uploads, PDF, and image rendering on physical devices before store submission.
