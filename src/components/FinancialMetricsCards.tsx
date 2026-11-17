/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { IndianCompany, PeriodRecord } from '../data/indianCompanies';
import { formatInrCrores, formatPercentage } from '../utils/formatters';
import { Award, Activity, TrendingUp, DollarSign } from 'lucide-react';

interface FinancialMetricsCardsProps {
  company: IndianCompany;
  currentRecord?: PeriodRecord;
  periodType?: 'quarterly' | 'yearly';
  lastSyncedDisplay?: string;
}

export const FinancialMetricsCards: React.FC<FinancialMetricsCardsProps> = ({
  company,
  lastSyncedDisplay = 'Today',
}) => {
  // Use latest full-year records with non-null fallback for annual metrics
  const latestYearly = company.yearlyData[company.yearlyData.length - 1];
  const prevYearly = company.yearlyData[company.yearlyData.length - 2] || company.yearlyData[0];

  const latestMcap = latestYearly?.marketCapCr ?? 0;
  const prevMcap = prevYearly?.marketCapCr ?? latestMcap;
  const latestPat = latestYearly?.patCr ?? 0;
  const prevPat = prevYearly?.patCr ?? latestPat;
  const latestRev = latestYearly?.revenueCr ?? 0;
  const prevRev = prevYearly?.revenueCr ?? latestRev;

  // 1. Yearly Market Cap growth %
  const yearlyMcapGrowth = prevMcap ? ((latestMcap - prevMcap) / Math.abs(prevMcap)) * 100 : 0;

  // 2. Yearly PAT growth % and Yearly Sales growth %
  const yearlyPatGrowth = prevPat ? ((latestPat - prevPat) / Math.abs(prevPat)) * 100 : 0;
  const yearlySalesGrowth = prevRev ? ((latestRev - prevRev) / Math.abs(prevRev)) * 100 : 0;

  // 3. Share Price, Book Value, Debt to Equity
  const sharePrice = latestYearly?.sharePriceInr ?? 0;
  const debtToEquity = company.benchmarks.debtToEquity ?? 0.38;
  const bookValue = company.benchmarks.bookValueInr ?? Math.round(sharePrice / (company.benchmarks.pbRatio || 1));

  // 4. P/E Multiple & Yearly Dividend Yield
  const peRatio = company.benchmarks.peRatio;
  const pbRatio = company.benchmarks.pbRatio;
  const dividendYieldYearly = company.benchmarks.dividendYieldPct;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Market Capitalisation (Latest Synced, Yearly Growth %) */}
      <div className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/40 rounded-xl p-4 shadow-sm dark:shadow-lg relative overflow-hidden flex flex-col justify-between transition-colors">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Market Capitalisation
            </span>
            <span className="text-[10px] font-mono text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
              Latest Synced
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white tracking-tight tabular-nums">
              {formatInrCrores(latestMcap, true)}
            </div>
            <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
              ({formatInrCrores(latestMcap, false)})
            </div>
          </div>
        </div>

        <div className="mt-4 pt-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400">Yearly Growth:</span>
          <span className={`font-mono font-semibold ${yearlyMcapGrowth >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {formatPercentage(yearlyMcapGrowth)}
          </span>
        </div>
      </div>

      {/* 2. Yearly PAT (Changed to Yearly PAT, Yearly PAT Growth, and Sales Growth %) */}
      <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/40 rounded-xl p-4 shadow-sm dark:shadow-lg relative overflow-hidden flex flex-col justify-between transition-colors">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Yearly PAT
            </span>
            <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
              {latestYearly.period} Annual
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400 tracking-tight tabular-nums">
              {formatInrCrores(latestPat, false)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
              <span>Net Margin:</span>
              <span className="font-mono text-emerald-700 dark:text-emerald-300 font-semibold">{latestYearly.patMarginPct ?? 0}%</span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-1">
            <span className="text-slate-500 dark:text-slate-400 font-sans">PAT YoY:</span>
            <span className={`font-semibold ${yearlyPatGrowth >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatPercentage(yearlyPatGrowth)}
            </span>
          </div>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <div className="flex items-center gap-1">
            <span className="text-slate-500 dark:text-slate-400 font-sans">Sales YoY:</span>
            <span className={`font-semibold ${yearlySalesGrowth >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatPercentage(yearlySalesGrowth)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Share Price (Last Date Synced, Debt to Equity, Book Value) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm dark:shadow-lg relative overflow-hidden flex flex-col justify-between transition-colors">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Share Price
            </span>
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate max-w-[140px]" title={lastSyncedDisplay}>
              Synced: {lastSyncedDisplay}
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white tracking-tight tabular-nums">
              ₹{sharePrice.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center justify-between">
              <span>Book Value: <strong className="font-mono text-slate-800 dark:text-slate-200">₹{bookValue.toLocaleString('en-IN')}</strong></span>
              <span className="text-slate-500 font-mono">P/B {pbRatio}x</span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400">Debt to Equity:</span>
          <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">
            {debtToEquity}x
          </span>
        </div>
      </div>

      {/* 4. Valuation P/E Multiple (TTM with Dividend Yield Yearly) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm dark:shadow-lg relative overflow-hidden flex flex-col justify-between transition-colors">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              P/E Multiple
            </span>
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">TTM</span>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white tracking-tight tabular-nums">
              {peRatio}x
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {company.industry}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400">Dividend Yield (Yearly):</span>
          <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
            {dividendYieldYearly}%
          </span>
        </div>
      </div>
    </div>
  );
};
