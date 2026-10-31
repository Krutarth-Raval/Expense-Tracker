import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.krutarth.expensetracker',
  appName: 'Expense Tracker',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    ...(process.env.CAPACITOR_SERVER_URL ? { url: process.env.CAPACITOR_SERVER_URL, cleartext: true } : {})
  }
};

export default config;

