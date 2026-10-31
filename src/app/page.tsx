import React from "react";
import Image from "next/image";
import { ArrowUpRight, ArrowDownLeft, Wallet, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="w-full flex flex-col items-center px-2 sm:px-6 py-6 sm:py-10 max-w-6xl mx-auto">
      {/* Hero Welcome Card */}
      <section className="w-[97%] md:w-[95%] lg:w-[85%] xl:w-[85%] 2xl:w-[85%] mx-auto squircle rounded-3xl bg-white/70 dark:bg-black/70 backdrop-blur-xl border border-black/10 dark:border-white/15 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)] shadow-xl shadow-black/5 dark:shadow-black/70 p-6 sm:p-10 mb-6 sm:mb-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex flex-col gap-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 squircle rounded-full bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/15 self-center sm:self-start w-fit">
            <Sparkles className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
            <span className="text-xs uppercase tracking-wider font-mono text-neutral-600 dark:text-neutral-400">
              Liquid Glass Monochrome
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-black dark:text-white mt-1">
            Master your wealth with pure clarity.
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Minimalist financial tracking engineered with Apple squircle geometry, fluid transitions, and strict monochromatic elegance.
          </p>
        </div>

        <div className="relative w-28 h-28 sm:w-36 sm:h-36 squircle rounded-3xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/15 p-3 flex-shrink-0 flex items-center justify-center">
          <Image
            src="/icons/icon-dark.png"
            alt="Expense Tracker Badge"
            width={120}
            height={120}
            priority
            className="w-full h-full object-contain"
          />
        </div>
      </section>

      {/* Overview Balance Cards */}
      <section className="w-[97%] md:w-[95%] lg:w-[85%] xl:w-[85%] 2xl:w-[85%] mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="squircle rounded-2xl bg-white/70 dark:bg-black/70 backdrop-blur-xl border border-black/10 dark:border-white/15 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)] shadow-md shadow-black/5 dark:shadow-black/50 p-5 sm:p-6 flex flex-col gap-3">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
            <span className="text-xs uppercase font-mono tracking-wider">Total Balance</span>
            <Wallet className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-black dark:text-white">
            $14,820.50
          </div>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            Updated just now
          </span>
        </div>

        <div className="squircle rounded-2xl bg-white/70 dark:bg-black/70 backdrop-blur-xl border border-black/10 dark:border-white/15 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)] shadow-md shadow-black/5 dark:shadow-black/50 p-5 sm:p-6 flex flex-col gap-3">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
            <span className="text-xs uppercase font-mono tracking-wider">Monthly Income</span>
            <ArrowDownLeft className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-black dark:text-white">
            +$6,450.00
          </div>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            +12.4% from last month
          </span>
        </div>

        <div className="squircle rounded-2xl bg-white/70 dark:bg-black/70 backdrop-blur-xl border border-black/10 dark:border-white/15 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)] shadow-md shadow-black/5 dark:shadow-black/50 p-5 sm:p-6 flex flex-col gap-3">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
            <span className="text-xs uppercase font-mono tracking-wider">Monthly Expenses</span>
            <ArrowUpRight className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-black dark:text-white">
            -$2,180.30
          </div>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            68% of monthly budget
          </span>
        </div>
      </section>

      {/* Extended scroll content to demonstrate floating sticky navbar */}
      <section className="w-[97%] md:w-[95%] lg:w-[85%] xl:w-[85%] 2xl:w-[85%] mx-auto squircle rounded-2xl bg-white/70 dark:bg-black/70 backdrop-blur-xl border border-black/10 dark:border-white/15 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)] p-6 sm:p-8 flex flex-col gap-4 mb-32">
        <h2 className="text-base sm:text-lg font-semibold tracking-tight text-black dark:text-white">
          Navbar Responsive Specifications
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="p-4 squircle rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
            <span className="text-xs uppercase font-mono text-neutral-500 dark:text-neutral-400">Large &amp; XL</span>
            <p className="text-lg font-bold font-mono mt-1 text-black dark:text-white">85%</p>
            <p className="text-xs text-neutral-500 mt-1">Width on lg/xl/2xl screens</p>
          </div>
          <div className="p-4 squircle rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
            <span className="text-xs uppercase font-mono text-neutral-500 dark:text-neutral-400">Medium</span>
            <p className="text-lg font-bold font-mono mt-1 text-black dark:text-white">95%</p>
            <p className="text-xs text-neutral-500 mt-1">Width on md screens (tablets)</p>
          </div>
          <div className="p-4 squircle rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
            <span className="text-xs uppercase font-mono text-neutral-500 dark:text-neutral-400">Small &amp; Smallest</span>
            <p className="text-lg font-bold font-mono mt-1 text-black dark:text-white">97%</p>
            <p className="text-xs text-neutral-500 mt-1">Width on mobile screens</p>
          </div>
        </div>
      </section>
    </div>
  );
}
