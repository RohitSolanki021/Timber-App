# Mobile Builds (Capacitor)

This project uses Capacitor to package the Vite web app into Android and iOS apps.

## Prerequisites
- Node.js + npm
- Android Studio (for Android)
- Xcode (for iOS, macOS only)

## Environment Variables
Create a `.env` file at the project root. Use `.env.example` as a starting point.

Required variables:
- `VITE_API_BASE_URL` - Base API URL used by the web app.
- `VITE_UPLOAD_BASE_URL` - Base URL for file/image access.
- `CAPACITOR_APP_ID` - App bundle ID (e.g. `com.company.app`).
- `CAPACITOR_APP_NAME` - App display name.
- `VITE_GEMINI_API_KEY` - Optional, if you use Gemini features.

## Build Web Assets
```bash
npm install
npm run build
```

## Android
If the Android project does not exist yet:
```bash
npx cap add android
```

Sync native project with latest web build:
```bash
npx cap sync android
```

Open in Android Studio:
```bash
npx cap open android
```

## iOS (macOS)
If the iOS project does not exist yet:
```bash
npx cap add ios
```

Sync native project with latest web build:
```bash
npx cap sync ios
```

Open in Xcode:
```bash
npx cap open ios
```

## Notes
- For device testing, make sure `VITE_API_BASE_URL` uses a reachable URL (not `localhost`).
- After changing web code, always run `npm run build` and `npx cap sync` again.
