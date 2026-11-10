/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { IndianCompany, QuarterlyRecord } from '../data/indianCompanies';
import { formatInrCrores, formatPercentage } from '../utils/formatters';
import { Activity, Award, Calendar, DollarSign } from 'lucide-react';

interface FinancialMetricsCardsProps {
  company: IndianCompany;
  currentRecord: QuarterlyRecord;
}

export const FinancialMetricsCards: React.FC<FinancialMetricsCardsProps> = ({
  company,
  currentRecord,
}) => {
  // Trailing 4 quarters (TTM) aggregate PAT
  const ttmRecords = company.quarterlyData.slice(-4);
  const ttmPatCr = ttmRecords.reduce((acc, r) => acc + r.patCr, 0);
  const ttmRevenueCr = ttmRecords.reduce((acc, r) => acc + r.revenueCr, 0);
  const ttmPatMargin = ttmRevenueCr > 0 ? (ttmPatCr / ttmRevenueCr) * 100 : 0;

  // YoY comparison (4 quarters ago)
  const fourQuartersAgo = company.quarterlyData[company.quarterlyData.length - 5] || company.quarterlyData[0];
  const mcapYoY = ((currentRecord.marketCapCr - fourQuartersAgo.marketCapCr) / fourQuartersAgo.marketCapCr) * 100;
  const patYoY = ((currentRecord.patCr - fourQuartersAgo.patCr) / fourQuartersAgo.patCr) * 100;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Market Capitalisation (BLUE) */}
      <div className="bg-slate-900 border border-blue-900/40 rounded-xl p-4 shadow-lg relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/10 rounded-full blur-2xl group-hover:bg-blue-600/15 transition-colors" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Market Capitalisation (Blue)
          </span>
          <span className="text-[11px] font-mono text-blue-400 bg-blue-950/80 px-1.5 py-0.5 rounded border border-blue-800/60">
            {currentRecord.quarter}
          </span>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold font-mono text-white tracking-tight tabular-nums">
            {formatInrCrores(currentRecord.marketCapCr, true)}
          </div>
          <div className="text-xs font-mono text-slate-400 mt-0.5">
            ({formatInrCrores(currentRecord.marketCapCr, false)})
          </div>
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400">1-Year YoY M-Cap Growth:</span>
          <span className={`font-mono font-medium ${mcapYoY >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>
            {formatPercentage(mcapYoY)}
          </span>
        </div>
      </div>

      {/* 2. Quarterly PAT (GREEN) */}
      <div className="bg-slate-900 border border-emerald-900/40 rounded-xl p-4 shadow-lg relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-600/10 rounded-full blur-2xl group-hover:bg-emerald-600/15 transition-colors" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Quarterly PAT (Green)
          </span>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/60">
            {currentRecord.periodEnded}
          </span>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold font-mono text-emerald-400 tracking-tight tabular-nums">
            {formatInrCrores(currentRecord.patCr, false)}
          </div>
          <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
            <span>Net Margin:</span>
            <span className="font-mono text-emerald-300 font-medium">{currentRecord.patMarginPct}%</span>
            <span className="text-slate-600">·</span>
            <span>Rev:</span>
            <span className="font-mono text-slate-300">₹{currentRecord.revenueCr.toLocaleString('en-IN')} Cr</span>
          </div>
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400">YoY Quarterly PAT Delta:</span>
          <span className={`font-mono font-medium ${patYoY >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatPercentage(patYoY)}
          </span>
        </div>
      </div>

      {/* 3. TTM Cumulative 4-Quarter Net Profit (PAT) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            TTM Net Profit (4 Quarters)
          </span>
          <span className="text-[11px] font-mono text-slate-400">Annualized</span>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold font-mono text-white tracking-tight tabular-nums">
            {formatInrCrores(ttmPatCr, ttmPatCr >= 100000)}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            TTM Margin: <span className="font-mono text-slate-200 font-medium">{ttmPatMargin.toFixed(1)}%</span>
          </div>
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400">P/E Valuation Multiple:</span>
          <span className="font-mono text-slate-200 font-medium">
            {(currentRecord.marketCapCr / (ttmPatCr || 1)).toFixed(1)}x
          </span>
        </div>
      </div>

      {/* 4. Stock Price & Valuation Benchmarks */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-blue-400" />
            Quarter Close & 52W Range
          </span>
          <span className="text-[11px] font-mono text-slate-400">NSE / BSE</span>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold font-mono text-white tracking-tight tabular-nums">
            ₹{currentRecord.sharePriceInr.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            52W Range: <span className="font-mono text-slate-300">₹{company.benchmarks.fiftyTwoWeekLow} - ₹{company.benchmarks.fiftyTwoWeekHigh}</span>
          </div>
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400">Dividend Yield:</span>
          <span className="font-mono text-emerald-400 font-medium">
            {company.benchmarks.dividendYieldPct}%
          </span>
        </div>
      </div>
    </div>
  );
};
