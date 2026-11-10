/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { IndianCompany } from '../data/indianCompanies';
import { formatInrCrores } from '../utils/formatters';
import { Search, Building2, Filter } from 'lucide-react';

interface CompanySelectorProps {
  companies: IndianCompany[];
  selectedCompanyId: string;
  onSelectCompany: (id: string) => void;
  periodType: 'quarterly' | 'yearly';
}

export const CompanySelector: React.FC<CompanySelectorProps> = ({
  companies,
  selectedCompanyId,
  onSelectCompany,
  periodType,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSector, setSelectedSector] = useState<string>('All');

  const categories = [
    'All',
    'Mega Cap (> ₹1 Lakh Cr)',
    'Large Cap (₹20k - ₹1 Lakh Cr)',
    'Mid Cap (₹5k - ₹20k Cr)',
    'Small Cap (₹500 Cr - ₹5k Cr)',
  ];

  const sectors = ['All', ...Array.from(new Set(companies.map(c => c.sector)))];

  const filteredCompanies = companies.filter(c => {
    const records = periodType === 'yearly' ? c.yearlyData : c.quarterlyData;
    const latestRecord = records[records.length - 1];
    const mcap = latestRecord ? latestRecord.marketCapCr : 0;

    // Must exceed 500 Cr
    if (mcap < 500) return false;

    // Category filter
    if (selectedCategory !== 'All' && c.category !== selectedCategory) return false;

    // Sector filter
    if (selectedSector !== 'All' && c.sector !== selectedSector) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const match =
        c.name.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q) ||
        c.bseCode.includes(q) ||
        c.industry.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 md:p-5 shadow-lg">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-400" />
            <span>Select Listed Company</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {filteredCompanies.length} companies available (&gt; ₹500 Cr Market Cap)
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search company or ticker..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Tiers and Sectors */}
      <div className="py-2.5 border-b border-slate-800/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
        <span className="text-slate-400 shrink-0 mr-1 flex items-center gap-1">
          <Filter className="w-3 h-3 text-blue-400" />
          Tier:
        </span>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-2.5 py-1 rounded text-xs whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white font-medium'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Sector Filter Chips */}
      <div className="flex items-center gap-1 overflow-x-auto py-2 border-b border-slate-800/60 text-xs">
        <span className="text-slate-400 shrink-0 mr-1">Sector:</span>
        {sectors.map(sec => (
          <button
            key={sec}
            onClick={() => setSelectedSector(sec)}
            className={`px-2 py-0.5 rounded text-xs whitespace-nowrap transition-colors ${
              selectedSector === sec
                ? 'bg-slate-800 text-white border border-slate-700 font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {sec}
          </button>
        ))}
      </div>

      {/* Company Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-3 max-h-[340px] overflow-y-auto pr-1">
        {filteredCompanies.map(comp => {
          const isSelected = comp.id === selectedCompanyId;
          const records = periodType === 'yearly' ? comp.yearlyData : comp.quarterlyData;
          const latestRecord = records[records.length - 1];

          return (
            <button
              key={comp.id}
              onClick={() => onSelectCompany(comp.id)}
              className={`text-left p-3 rounded-lg border transition-all relative ${
                isSelected
                  ? 'bg-blue-950/40 border-blue-500/80 shadow-md ring-1 ring-blue-500/50'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-start justify-between gap-1">
                <div className="min-w-0">
                  <div className="font-semibold text-xs text-white truncate">{comp.name}</div>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-400">
                    <span className="font-mono text-slate-300">{comp.symbol}</span>
                    <span aria-hidden="true">·</span>
                    <span className="truncate">{comp.industry}</span>
                  </div>
                </div>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1 shadow-sm" />
                )}
              </div>

              {/* Financial Metrics: Market Cap (Blue) & PAT (Green) */}
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 block font-sans">Market Cap</span>
                  <span className="text-blue-400 font-semibold">
                    {formatInrCrores(latestRecord?.marketCapCr || 0, true)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block font-sans">
                    {periodType === 'yearly' ? 'Annual PAT' : 'Quarterly PAT'}
                  </span>
                  <span className="text-emerald-400 font-semibold">
                    {formatInrCrores(latestRecord?.patCr || 0, false)}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
