/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { IndianCompany, PeriodRecord } from '../data/indianCompanies';
import { formatInrCrores, formatPercentage } from '../utils/formatters';
import { Award, Activity } from 'lucide-react';

interface FinancialMetricsCardsProps {
  company: IndianCompany;
  currentRecord: PeriodRecord;
  periodType: 'quarterly' | 'yearly';
}

export const FinancialMetricsCards: React.FC<FinancialMetricsCardsProps> = ({
  company,
  currentRecord,
  periodType,
}) => {
  const records = periodType === 'yearly' ? company.yearlyData : company.quarterlyData;
  const prevRecord = records[records.length - 2] || records[0];
  const mcapGrowth = ((currentRecord.marketCapCr - prevRecord.marketCapCr) / prevRecord.marketCapCr) * 100;
  const patGrowth = ((currentRecord.patCr - prevRecord.patCr) / prevRecord.patCr) * 100;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Market Capitalisation (BLUE) */}
      <div className="bg-slate-900 border border-blue-900/40 rounded-xl p-4 shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Market Capitalisation
          </span>
          <span className="text-[11px] font-mono text-blue-400 bg-blue-950 px-1.5 py-0.5 rounded border border-blue-800">
            {currentRecord.period}
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
        <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400">Growth:</span>
          <span className={`font-mono font-medium ${mcapGrowth >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>
            {formatPercentage(mcapGrowth)}
          </span>
        </div>
      </div>

      {/* 2. PAT (GREEN) */}
      <div className="bg-slate-900 border border-emerald-900/40 rounded-xl p-4 shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {periodType === 'yearly' ? 'Annual PAT' : 'Quarterly PAT'}
          </span>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
            {currentRecord.label}
          </span>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold font-mono text-emerald-400 tracking-tight tabular-nums">
            {formatInrCrores(currentRecord.patCr, false)}
          </div>
          <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
            <span>Net Profit Margin:</span>
            <span className="font-mono text-emerald-300 font-semibold">{currentRecord.patMarginPct}%</span>
          </div>
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400">PAT Growth:</span>
          <span className={`font-mono font-medium ${patGrowth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatPercentage(patGrowth)}
          </span>
        </div>
      </div>

      {/* 3. Valuation P/E Multiple */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            P/E Multiple
          </span>
          <span className="text-[11px] font-mono text-slate-400">TTM</span>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold font-mono text-white tracking-tight tabular-nums">
            {company.benchmarks.peRatio}x
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            P/B Multiple: <span className="font-mono text-slate-300">{company.benchmarks.pbRatio}x</span>
          </div>
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400">Industry:</span>
          <span className="font-sans text-slate-300 truncate max-w-[150px]">{company.industry}</span>
        </div>
      </div>

      {/* 4. Stock Price & 52-Week Range */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            Share Price
          </span>
          <span className="text-[11px] font-mono text-slate-400">NSE / BSE</span>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold font-mono text-white tracking-tight tabular-nums">
            ₹{currentRecord.sharePriceInr.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            52W: <span className="font-mono text-slate-300">₹{company.benchmarks.fiftyTwoWeekLow} - ₹{company.benchmarks.fiftyTwoWeekHigh}</span>
          </div>
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400">Dividend Yield:</span>
          <span className="font-mono text-emerald-400 font-medium">
            {company.benchmarks.dividendYieldPct}%
          </span>
        </div>
      </div>
    </div>
  );
};
