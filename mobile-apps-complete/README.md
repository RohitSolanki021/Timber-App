# Natural Plylam Mobile Apps - Complete Source Code

## Three Separate Apps

| App | Folder | Package ID | Theme |
|-----|--------|------------|-------|
| **Customer** | `customer-app/` | com.naturalplylam.customer | Green (#10b981) |
| **Sales** | `sales-app/` | com.naturalplylam.sales | Emerald (#059669) |
| **Admin** | `admin-app/` | com.naturalplylam.admin | Navy (#1a365d) |

---

## Project Structure (Each App)

```
app-folder/
├── src/                    # SOURCE CODE
│   ├── App.tsx             # Main app component
│   ├── apiService.ts       # API calls to backend
│   ├── components/         # Reusable components
│   ├── context/            # React context (Cart, etc.)
│   ├── pages/              # All screens/pages
│   └── utils/              # Helper functions
├── public/                 # Static assets
├── android/                # Android project (if built)
├── ios/                    # iOS project (if built)
├── dist/                   # Built web files
├── package.json            # Dependencies
├── capacitor.config.json   # Mobile app config
├── vite.config.ts          # Build config
├── tailwind.config.js      # Styling config
├── tsconfig.json           # TypeScript config
├── index.html              # HTML entry point
└── .env                    # API URL config
```

---

## How to Build APK (Android)

### Prerequisites
- Node.js 18+
- Android Studio (with SDK)
- JDK 17+

### Step-by-Step

```bash
# 1. Navigate to app folder
cd customer-app  # or sales-app or admin-app

# 2. Install dependencies
npm install
# or
yarn install

# 3. Build the web app
npm run build
# or  
yarn build

# 4. Add Android platform (first time only)
npx cap add android

# 5. Sync web files to Android
npx cap sync android

# 6. Open in Android Studio
npx cap open android
```

### In Android Studio:
1. Wait for Gradle sync
2. Go to `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
3. APK at: `android/app/build/outputs/apk/debug/app-debug.apk`

### For Signed Release APK:
1. `Build` → `Generate Signed Bundle / APK`
2. Create keystore (first time) or use existing
3. Select `release` build variant
4. APK at: `android/app/build/outputs/apk/release/`

---

## How to Build IPA (iOS)

### Prerequisites
- Mac with macOS
- Xcode 15+
- Apple Developer Account ($99/year)

### Steps

```bash
# 1. Navigate to app folder
cd customer-app

# 2. Install dependencies
npm install

# 3. Build web app
npm run build

# 4. Add iOS platform
npx cap add ios

# 5. Sync files
npx cap sync ios

# 6. Open in Xcode
npx cap open ios
```

### In Xcode:
1. Select your Team in Signing & Capabilities
2. Update Bundle Identifier if needed
3. `Product` → `Archive`
4. `Distribute App` → `App Store Connect`

---

## API Configuration

All apps connect to: `https://app.naturalplylam.com/api/index.php`

To change the API URL, edit `.env` file in each app:
```
VITE_API_BASE_URL=https://your-domain.com/api/index.php
```

Then rebuild:
```bash
npm run build
npx cap sync
```

---

## App Features

### Customer App
- Login / Register
- Dashboard with order stats
- Browse Products (Plywood & Timber)
- Add to Cart
- Place Orders
- View Order History
- View Invoices
- Profile Management

### Sales App
- Sales Person Login
- Dashboard with sales metrics
- Manage Assigned Customers
- Place Orders for Customers
- View Invoices
- Sales Reports

### Admin App
- Admin/Manager Login
- Full Dashboard
- Customer Management
- Order Management (Approve/Cancel/Dispatch)
- Invoice Management
- Product Management
- Stock Management
- User Management
- Banner Management

---

## Login Credentials

| App | Email | Password |
|-----|-------|----------|
| Customer | customer1@example.com | customer123 |
| Sales | sales@naturalplylam.com | sales123 |
| Admin | admin@naturalplylam.com | admin123 |

---

## Customization

### Change App Name
Edit `capacitor.config.json`:
```json
{
  "appName": "Your App Name"
}
```

### Change App Icon
Replace images in:
- Android: `android/app/src/main/res/mipmap-*/`
- iOS: `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

### Change Splash Screen Color
Edit `capacitor.config.json`:
```json
{
  "plugins": {
    "SplashScreen": {
      "backgroundColor": "#YOUR_COLOR"
    }
  }
}
```

---

## Troubleshooting

### Build fails with module not found
```bash
rm -rf node_modules
npm install
```

### Android build fails
```bash
cd android
./gradlew clean
cd ..
npx cap sync android
```

### iOS build fails
```bash
cd ios/App
pod deintegrate
pod install
cd ../..
npx cap sync ios
```

---

## Support

Backend API: `https://app.naturalplylam.com`

For issues with the backend, check:
- `api/config/config.php` - Database credentials
- `api/config/schema.sql` - Database schema
