import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.krutarth.expensetracker',
  appName: 'Expense Tracker',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  }
};

export default config;
