import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'frag.jetzt',
  appName: 'frag.jetzt',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 300,
      launchAutoHide: true,
      launchFadeOutDuration: 5000,
      backgroundColor: "#ffffffff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#999999",
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: "launch_screen",
      useDialog: true,
    },
  },
  server: {
    androidScheme: 'https',
    hostname: "frag.jetzt"
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
