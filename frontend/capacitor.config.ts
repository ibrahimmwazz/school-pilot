import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.schooled.enterprise',
  appName: 'School Ed-OS',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: false
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 1500,
      backgroundColor: '#ffffff'
    }
  }
};

export default config;
