import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'tech.liftup.customerportal',
  appName: 'Customer Portal',
  webDir: 'dist',
plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
