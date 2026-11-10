/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { IndianCompany } from '../data/indianCompanies';
import { formatInrCrores } from '../utils/formatters';
import { Layers, CheckSquare, Square } from 'lucide-react';

interface MultiCompanyComparisonProps {
  companies: IndianCompany[];
  onSelectCompany: (id: string) => void;
}

export const MultiCompanyComparison: React.FC<MultiCompanyComparisonProps> = ({
  companies,
  onSelectCompany,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([
    'reliance', 
    'tcs', 
    'hdfcbank', 
    'trent',
    'persistent',
    'rategain'
  ]);

  const toggleCompany = (id: string) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length > 1) {
        setSelectedIds(selectedIds.filter(i => i !== id));
      }
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const selectedCompanies = companies.filter(c => selectedIds.includes(c.id));

  // Max values for relative scaling bars
  const maxMcap = Math.max(...companies.map(c => c.quarterlyData[c.quarterlyData.length - 1].marketCapCr));
  const maxPat = Math.max(...companies.map(c => c.quarterlyData[c.quarterlyData.length - 1].patCr));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <span>Cross-Tier Comparative Matrix (&gt; ₹500 Cr Companies)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Compare Market Capitalisation (Blue) and Quarterly PAT (Green) across market cap tiers
          </p>
        </div>

        <div className="text-xs text-slate-400">
          Comparing <strong className="text-white">{selectedCompanies.length}</strong> companies
        </div>
      </div>

      {/* Filter check buttons */}
      <div className="flex flex-wrap items-center gap-2 py-3 border-b border-slate-800/60 max-h-28 overflow-y-auto">
        {companies.map(comp => {
          const isChecked = selectedIds.includes(comp.id);
          return (
            <button
              key={comp.id}
              onClick={() => toggleCompany(comp.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border transition-all ${
                isChecked
                  ? 'bg-slate-800 border-blue-500/80 text-white font-medium'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {isChecked ? (
                <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
              ) : (
                <Square className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span>{comp.symbol}</span>
            </button>
          );
        })}
      </div>

      {/* Comparison Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
        {selectedCompanies.map(comp => {
          const latest = comp.quarterlyData[comp.quarterlyData.length - 1];
          const mcapWidthPct = (latest.marketCapCr / maxMcap) * 100;
          const patWidthPct = (latest.patCr / maxPat) * 100;

          return (
            <div
              key={comp.id}
              className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3.5 hover:border-slate-700 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-xs text-white truncate">{comp.name}</h4>
                    <span className="text-[11px] font-mono text-slate-400">{comp.symbol} · {comp.category}</span>
                  </div>
                  <button
                    onClick={() => onSelectCompany(comp.id)}
                    className="text-[10px] text-blue-400 hover:text-blue-300 font-medium underline shrink-0 ml-1"
                  >
                    View Chart
                  </button>
                </div>

                {/* Relative Visual Bars */}
                <div className="mt-3 space-y-2.5">
                  {/* Blue Market Cap Bar */}
                  <div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        Market Cap (Blue):
                      </span>
                      <span className="font-mono text-blue-400 font-semibold">
                        {formatInrCrores(latest.marketCapCr, true)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-1.5 mt-1 overflow-hidden">
                      <div
                        className="bg-blue-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(2, mcapWidthPct)}%` }}
                      />
                    </div>
                  </div>

                  {/* Green PAT Bar */}
                  <div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Quarterly PAT (Green):
                      </span>
                      <span className="font-mono text-emerald-400 font-semibold">
                        {formatInrCrores(latest.patCr, false)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-1.5 mt-1 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(2, patWidthPct)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Ratios & Margins */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500 block text-[10px]">Quarterly Net Margin</span>
                  <span className="font-mono text-slate-200">{latest.patMarginPct}%</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">P/E Valuation</span>
                  <span className="font-mono text-slate-200">{comp.benchmarks.peRatio}x</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
