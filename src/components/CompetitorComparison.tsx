/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { IndianCompany } from '../data/indianCompanies';
import { formatInrCrores } from '../utils/formatters';
import { Users2, ArrowRight } from 'lucide-react';

interface CompetitorComparisonProps {
  currentCompany: IndianCompany;
  allCompanies: IndianCompany[];
  onSelectCompany: (id: string) => void;
  periodType: 'quarterly' | 'yearly';
}

export const CompetitorComparison: React.FC<CompetitorComparisonProps> = ({
  currentCompany,
  allCompanies,
  onSelectCompany,
  periodType,
}) => {
  const [filterMode, setFilterMode] = useState<'direct-peers' | 'same-sector'>('direct-peers');

  // Identify competitors
  const competitors = React.useMemo(() => {
    let list: IndianCompany[] = [];

    if (filterMode === 'direct-peers') {
      const peerSymbols = new Set(currentCompany.peers || []);
      list = allCompanies.filter(c => peerSymbols.has(c.symbol) || c.id === currentCompany.id);
      // If direct peers are fewer than 3, fallback to same industry
      if (list.length < 3) {
        list = allCompanies.filter(c => c.industry === currentCompany.industry || c.id === currentCompany.id);
      }
    } else {
      list = allCompanies.filter(c => c.sector === currentCompany.sector || c.id === currentCompany.id);
    }

    // Ensure current company is included
    if (!list.find(c => c.id === currentCompany.id)) {
      list.unshift(currentCompany);
    }

    // Sort by Market Cap descending
    list.sort((a, b) => {
      const dataA = periodType === 'yearly' ? a.yearlyData : a.quarterlyData;
      const dataB = periodType === 'yearly' ? b.yearlyData : b.quarterlyData;
      const mcapA = dataA[dataA.length - 1]?.marketCapCr || 0;
      const mcapB = dataB[dataB.length - 1]?.marketCapCr || 0;
      return mcapB - mcapA;
    });

    return list;
  }, [currentCompany, allCompanies, filterMode, periodType]);

  // Max values for relative scaling
  const maxMcap = Math.max(
    ...competitors.map(c => {
      const d = periodType === 'yearly' ? c.yearlyData : c.quarterlyData;
      return d[d.length - 1]?.marketCapCr || 1;
    })
  );

  const maxPat = Math.max(
    ...competitors.map(c => {
      const d = periodType === 'yearly' ? c.yearlyData : c.quarterlyData;
      return Math.max(1, d[d.length - 1]?.patCr || 1);
    })
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 md:p-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Users2 className="w-5 h-5 text-blue-400" />
            <span>Competitors & Peer Comparison: {currentCompany.industry}</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Benchmarking {currentCompany.name} against industry peers ({periodType === 'yearly' ? 'Annual' : 'Quarterly'} Data)
          </p>
        </div>

        {/* Filter scope toggle */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-medium">
          <button
            onClick={() => setFilterMode('direct-peers')}
            className={`px-3 py-1 rounded-md transition-colors ${
              filterMode === 'direct-peers' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Direct Peers
          </button>
          <button
            onClick={() => setFilterMode('same-sector')}
            className={`px-3 py-1 rounded-md transition-colors ${
              filterMode === 'same-sector' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            All in {currentCompany.sector}
          </button>
        </div>
      </div>

      {/* Horizontal Bar Benchmark Rows */}
      <div className="mt-4 space-y-4">
        {competitors.map((peer, idx) => {
          const isSelected = peer.id === currentCompany.id;
          const records = periodType === 'yearly' ? peer.yearlyData : peer.quarterlyData;
          const latest = records[records.length - 1];

          const mcapWidthPct = Math.max(3, (latest.marketCapCr / maxMcap) * 100);
          const patWidthPct = Math.max(3, (Math.max(0, latest.patCr) / maxPat) * 100);

          return (
            <div
              key={peer.id}
              className={`p-3.5 rounded-xl border transition-all ${
                isSelected
                  ? 'bg-slate-950 border-blue-500/80 shadow-md ring-1 ring-blue-500/40'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-slate-500 font-bold w-5">#{idx + 1}</span>
                  <span className="font-semibold text-sm text-white">{peer.name}</span>
                  <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    {peer.symbol}
                  </span>
                  {isSelected && (
                    <span className="text-[10px] font-mono font-medium text-blue-400 px-1.5 py-0.2 rounded bg-blue-950 border border-blue-800">
                      Current
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <span className="text-slate-400">
                    Margin: <strong className="text-slate-200">{latest.patMarginPct}%</strong>
                  </span>
                  <span className="text-slate-400">
                    P/E: <strong className="text-slate-200">{peer.benchmarks.peRatio}x</strong>
                  </span>
                  {!isSelected && (
                    <button
                      onClick={() => onSelectCompany(peer.id)}
                      className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-sans font-medium"
                    >
                      <span>Chart</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Horizontal Bars: Market Cap (Blue) & PAT (Green) */}
              <div className="mt-2 space-y-2">
                {/* 1. Market Cap (Blue Horizontal Bar) */}
                <div>
                  <div className="flex items-center justify-between text-xs font-mono mb-1">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="font-sans">Market Cap:</span>
                    </span>
                    <span className="text-blue-400 font-bold">
                      {formatInrCrores(latest.marketCapCr, true)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden p-0.5 border border-slate-800/80">
                    <div
                      className="bg-blue-600 hover:bg-blue-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${mcapWidthPct}%` }}
                    />
                  </div>
                </div>

                {/* 2. PAT (Green Horizontal Bar) */}
                <div>
                  <div className="flex items-center justify-between text-xs font-mono mb-1">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="font-sans">PAT (Net Profit):</span>
                    </span>
                    <span className="text-emerald-400 font-bold">
                      {formatInrCrores(latest.patCr, false)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden p-0.5 border border-slate-800/80">
                    <div
                      className="bg-emerald-600 hover:bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${patWidthPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
