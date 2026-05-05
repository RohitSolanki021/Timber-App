# Natural Plylam — Customer Mobile App

Capacitor wrapper for the official Customer Portal. The mobile app loads
the **exact same UI** that runs on the web preview (pixel-identical),
and routes all API traffic to your PHP/MySQL backend.

---

## 1. Configure the backend URL

Open this file in any text editor:

```
dist/portal/config.js
```

Change `API_BASE_URL` to your live PHP backend (must end in `/api`):

```js
window.NATURAL_PLYLAM_CONFIG = {
  API_BASE_URL: "https://yourdomain.com/api"
};
```

That's the only file you need to edit.

---

## 2. Build the Android APK (Android Studio)

Prerequisites: Node 18+, Java 17, Android Studio (Hedgehog or later).

```bash
# from this folder
yarn install
npx cap sync android
npx cap open android        # opens Android Studio
```

Inside Android Studio:
1. Wait for Gradle sync to finish.
2. **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
3. The signed-debug APK will be at:
   `android/app/build/outputs/apk/debug/app-debug.apk`

For a release / Play Store build:
```bash
cd android
./gradlew assembleRelease
# output: android/app/build/outputs/apk/release/app-release-unsigned.apk
```
Then sign with your keystore (`apksigner` / Android Studio `Generate Signed Bundle / APK`).

---

## 3. Build the iOS IPA (Xcode, macOS only)

```bash
yarn install
npx cap add ios            # first time only
npx cap sync ios
npx cap open ios           # opens Xcode
```

Inside Xcode:
1. Select your team in **Signing & Capabilities**.
2. Choose a real device or "Any iOS Device" target.
3. **Product → Archive** → **Distribute App**.

---

## 4. Updating the app after backend URL changes

```bash
# edit dist/portal/config.js, then:
npx cap sync
# rebuild from Android Studio / Xcode
```

No code changes, no rebuild of the React bundle required.

---

## Project layout

```
customer-app/
├── capacitor.config.json     # Capacitor config (appId, splash, status bar)
├── package.json              # Capacitor deps + scripts
├── dist/                     # Web assets that ship inside the app
│   ├── index.html            # bootstrap → redirects to /portal/
│   ├── plylam.png            # logo
│   └── portal/               # the official Customer Portal bundle
│       ├── index.html
│       ├── config.js         # ← EDIT THIS to set API_BASE_URL
│       ├── api-shim.js       # rewrites legacy URLs → API_BASE_URL
│       └── assets/...
└── android/                  # generated native Android project
```

---

## How the API routing works

The Customer Portal bundle has legacy dev URLs (`http://localhost:8001/api`,
the old preview URL) baked in. A tiny script (`api-shim.js`) loads
**before** the bundle and intercepts every `fetch` / `XMLHttpRequest`,
rewriting those legacy bases to `API_BASE_URL` from `config.js`.

Result: the UI is unchanged, but every request goes to your PHP backend.

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| White screen on launch | Make sure `dist/portal/index.html` exists in the APK (`npx cap sync`). |
| API calls failing | Open Chrome DevTools (`chrome://inspect`) on the WebView and check `[plylam] API requests routed to:` in the console. |
| CORS errors | Add `Access-Control-Allow-Origin: *` (or your app origin) on the PHP backend. |
| Splash colour wrong | Edit `capacitor.config.json` → `plugins.SplashScreen.backgroundColor`. |
