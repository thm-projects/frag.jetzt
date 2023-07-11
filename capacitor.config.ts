import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'frag.jetzt',
  appName: 'frag.jetzt',
  webDir: 'dist',
  server: {
    androidScheme: "https",
    iosScheme: "https",
    hostname: "frag.jetzt"
  }
};

export default config;
