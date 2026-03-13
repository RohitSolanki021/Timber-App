import 'dotenv/config';
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: process.env.CAPACITOR_APP_ID || 'tech.liftup.customerportal',
  appName: process.env.CAPACITOR_APP_NAME || 'Customer Portal',
  webDir: 'dist',
plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
