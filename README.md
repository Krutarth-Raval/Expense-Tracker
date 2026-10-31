# Expense-Tracker

An all-in-one mobile and web Expense Tracker application engineered with Next.js, Tailwind CSS v4, Neon PostgreSQL, and Capacitor, with GitHub Actions automated mobile APK builds.

## Tech Stack
- **Framework:** Next.js (App Router) & React 19
- **Database:** Neon Serverless PostgreSQL
- **ORM:** Prisma ORM
- **Styling:** Tailwind CSS v4 with Liquid Glass Monochrome Design & Apple-style Squircle geometry
- **Mobile Engine:** Capacitor (Android APK / Web)
- **Deployment:** Vercel (Web) & GitHub Actions (Mobile APK build)

## Setup & Running

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   Copy `.env.example` to `.env` and provide your Neon PostgreSQL database connection string.

3. **Start local development:**
   ```bash
   npm run dev
   ```

4. **Build for Mobile (Capacitor):**
   ```bash
   npm run build:mobile
   ```
