import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'frag.jetzt',
  appName: 'frag.jetzt',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    hostname: "frag.jetzt"
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
