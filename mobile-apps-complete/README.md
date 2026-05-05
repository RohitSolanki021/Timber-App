# Natural Plylam — Mobile Apps Bundle

This bundle contains three standalone, compilable Capacitor mobile apps:

| App | Folder | App ID | Theme |
| --- | --- | --- | --- |
| Admin | `admin-app/` | `com.naturalplylam.admin` | Dark |
| Sales | `sales-app/` | `com.naturalplylam.sales` | Green |
| Customer | `customer-app/` | `com.naturalplylam.customer` | Native portal UI |

Each folder is a fully self-contained Capacitor project with:
- `capacitor.config.json` — app id, splash, status bar
- `package.json` — Capacitor deps & scripts
- `dist/` — the web assets shipped inside the APK / IPA
- `android/` — native Android project (open in Android Studio)
- `README.md` — per-app build instructions

> **Customer App note:** the Customer App wraps the *exact* Customer Portal
> bundle from the original web app — pixel-identical UI. API traffic is
> redirected to your PHP backend via `dist/portal/config.js`. See
> `customer-app/README.md` for details.

---

## Quick start

For each app you want to build:

```bash
cd <app-folder>             # e.g. cd customer-app
yarn install                # installs Capacitor CLI & deps

# 1) point the app at your live PHP backend
#    - admin-app / sales-app  →  edit src/config or .env, then `yarn build`
#    - customer-app           →  edit dist/portal/config.js (no rebuild needed)

npx cap sync android        # copy assets into android/
npx cap open android        # opens Android Studio
```

Inside Android Studio:
1. Wait for Gradle sync.
2. **Build → Build APK(s)** — APK lands at `android/app/build/outputs/apk/debug/app-debug.apk`.

For iOS (macOS only):
```bash
npx cap add ios
npx cap sync ios
npx cap open ios
```

---

## Backend

All three apps talk to the same PHP/MySQL backend located in `/app/backend`
(also packaged in `godaddy-upload.zip` for Plesk / GoDaddy / IIS deployment).

Set `API_BASE_URL` to your live API root (must end in `/api`), e.g.:

```
https://app.naturalplylam.com/api
```

---

## Default test credentials

```
Email:    admin@naturalplylam.com
Password: admin123
```
