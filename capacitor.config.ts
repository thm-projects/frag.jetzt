import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'frag.jetzt',
  appName: 'frag.jetzt',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      launchFadeOutDuration: 1000,
      backgroundColor: "#ffffffff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      splashFullScreen: true,
      layoutName: "launch_screen",
    },
  },
  server: {
    androidScheme: "https",
    iosScheme: "https",
    hostname: "frag.jetzt"
  }
};

export default config;
