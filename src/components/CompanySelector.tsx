/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { IndianCompany, MarketCapCategory } from '../data/indianCompanies';
import { formatInrCrores } from '../utils/formatters';
import { Search, Building2, Filter, SlidersHorizontal } from 'lucide-react';

interface CompanySelectorProps {
  companies: IndianCompany[];
  selectedCompanyId: string;
  onSelectCompany: (id: string) => void;
  minMarketCapCr: number;
  onMinMarketCapChange: (val: number) => void;
}

export const CompanySelector: React.FC<CompanySelectorProps> = ({
  companies,
  selectedCompanyId,
  onSelectCompany,
  minMarketCapCr,
  onMinMarketCapChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSector, setSelectedSector] = useState<string>('All');

  const categories = [
    'All (> ₹500 Cr)',
    'Mega Cap (> ₹1 Lakh Cr)',
    'Large Cap (₹20k - ₹1 Lakh Cr)',
    'Mid Cap (₹5k - ₹20k Cr)',
    'Small Cap (₹500 Cr - ₹5k Cr)',
  ];

  const sectors = ['All', ...Array.from(new Set(companies.map(c => c.sector)))];

  const filteredCompanies = companies.filter(c => {
    const latestRecord = c.quarterlyData[c.quarterlyData.length - 1];
    const mcap = latestRecord ? latestRecord.marketCapCr : 0;

    // Minimum 500 Cr filter check
    if (mcap < minMarketCapCr) return false;

    // Category filter
    if (selectedCategory !== 'All' && selectedCategory !== 'All (> ₹500 Cr)') {
      if (c.category !== selectedCategory) return false;
    }

    // Sector filter
    if (selectedSector !== 'All') {
      if (c.sector !== selectedSector) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        c.name.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q) ||
        c.bseCode.includes(q);
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
            <span>Select Listed Company (&gt; ₹500 Cr Market Cap)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Showing <strong className="text-white">{filteredCompanies.length}</strong> companies meeting quarterly filings and threshold criteria
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

      {/* Market Cap Tier & Threshold Controls */}
      <div className="py-3 border-b border-slate-800/60 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
        {/* Tier Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-slate-400 font-medium shrink-0 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5 text-blue-400" />
            Tier:
          </span>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Min Market Cap Slider / Filter */}
        <div className="flex items-center gap-3 shrink-0 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
          <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-slate-400">Min Market Cap:</span>
          <span className="font-mono text-blue-300 font-semibold min-w-16">
            ₹{minMarketCapCr.toLocaleString('en-IN')} Cr
          </span>
          <div className="flex items-center gap-1">
            {[500, 5000, 20000, 100000].map(val => (
              <button
                key={val}
                onClick={() => onMinMarketCapChange(val)}
                className={`px-1.5 py-0.5 text-[10.5px] font-mono rounded ${
                  minMarketCapCr === val
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white bg-slate-800/60'
                }`}
              >
                {val >= 100000 ? '1L Cr' : val >= 20000 ? '20k Cr' : val >= 5000 ? '5k Cr' : '500 Cr'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sector Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 no-scrollbar border-b border-slate-800/60 text-xs">
        <span className="text-slate-400 font-medium shrink-0 mr-1">Sector:</span>
        {sectors.map(sec => (
          <button
            key={sec}
            onClick={() => setSelectedSector(sec)}
            className={`px-2.5 py-0.5 rounded text-xs whitespace-nowrap transition-colors ${
              selectedSector === sec
                ? 'bg-slate-800 text-white border border-slate-700 font-medium'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            {sec}
          </button>
        ))}
      </div>

      {/* Company Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-3 max-h-[380px] overflow-y-auto pr-1">
        {filteredCompanies.map(comp => {
          const isSelected = comp.id === selectedCompanyId;
          const latestRecord = comp.quarterlyData[comp.quarterlyData.length - 1];

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
                  <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-400 flex-wrap">
                    <span className="font-mono font-medium text-slate-300">{comp.symbol}</span>
                    <span aria-hidden="true">·</span>
                    <span className="truncate">{comp.sector}</span>
                  </div>
                </div>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1 shadow-sm shadow-blue-500" />
                )}
              </div>

              {/* Financial Metrics: Market Cap in Blue & PAT in Green */}
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 block font-sans">Market Cap (Blue)</span>
                  <span className="text-blue-400 font-semibold">
                    {formatInrCrores(latestRecord?.marketCapCr || 0, true)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block font-sans">Quarterly PAT (Green)</span>
                  <span className="text-emerald-400 font-semibold">
                    {formatInrCrores(latestRecord?.patCr || 0, false)}
                  </span>
                </div>
              </div>
            </button>
          );
        })}

        {filteredCompanies.length === 0 && (
          <div className="col-span-full py-8 text-center text-xs text-slate-400">
            No companies found with Market Cap &gt; ₹{minMarketCapCr.toLocaleString('en-IN')} Cr in the selected category.
          </div>
        )}
      </div>
    </div>
  );
};
