import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.krutarth.expensetracker',
  appName: 'Expense Tracker',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    url: process.env.CAPACITOR_SERVER_URL || 'https://track-your-money-one.vercel.app',
    cleartext: false,
    allowNavigation: [
      'track-your-money-one.vercel.app',
      '*.vercel.app'
    ]
  }
};

export default config;
