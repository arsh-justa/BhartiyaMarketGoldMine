/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { IndianCompany } from '../data/indianCompanies';
import { formatInrCrores } from '../utils/formatters';
import { Building2, Filter } from 'lucide-react';

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

  const filteredCompanies = useMemo(() => {
    return companies.filter(c => {
      const records = periodType === 'yearly' ? c.yearlyData : c.quarterlyData;
      const latestRecord = records[records.length - 1];
      const mcap = latestRecord?.marketCapCr ?? 0;

      // Must exceed 500 Cr
      if (mcap < 500) return false;

      // Category filter
      if (selectedCategory !== 'All' && c.category !== selectedCategory) return false;

      // Sector filter
      if (selectedSector !== 'All' && c.sector !== selectedSector) return false;

      return true;
    });
  }, [companies, periodType, selectedCategory, selectedSector]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 md:p-5 shadow-sm dark:shadow-lg transition-colors">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Select Listed Company</span>
          </h3>
        </div>
      </div>

      {/* Tiers and Sectors */}
      <div className="py-2.5 border-b border-slate-200/80 dark:border-slate-800/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
        <span className="text-slate-600 dark:text-slate-400 shrink-0 mr-1 flex items-center gap-1">
          <Filter className="w-3 h-3 text-blue-600 dark:text-blue-400" />
          Tier:
        </span>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-2.5 py-1 rounded text-xs whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white font-medium'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Sector Filter Chips */}
      <div className="flex items-center gap-1 overflow-x-auto py-2 border-b border-slate-200/80 dark:border-slate-800/60 text-xs">
        <span className="text-slate-600 dark:text-slate-400 shrink-0 mr-1">Sector:</span>
        {sectors.map(sec => (
          <button
            key={sec}
            onClick={() => setSelectedSector(sec)}
            className={`px-2 py-0.5 rounded text-xs whitespace-nowrap transition-colors ${
              selectedSector === sec
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 font-medium'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
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
              className={`text-left p-3 rounded-lg border transition-all ${
                isSelected
                  ? 'bg-blue-50 dark:bg-blue-950/80 border-blue-500 shadow-sm dark:shadow-md ring-1 ring-blue-500/50'
                  : 'bg-slate-50/80 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-950'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-400">
                  {comp.symbol}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  BSE {comp.bseCode}
                </span>
              </div>
              <div className="font-semibold text-xs text-slate-900 dark:text-white mt-1 truncate" title={comp.name}>
                {comp.name}
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 truncate mt-0.5">
                {comp.industry}
              </div>
              <div className="mt-2 pt-1.5 border-t border-slate-200 dark:border-slate-800/60 flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-600 dark:text-slate-400">₹{(latestRecord?.sharePriceInr ?? 0).toLocaleString('en-IN')}</span>
                <span className="text-blue-700 dark:text-blue-300 font-bold">
                  {formatInrCrores(latestRecord?.marketCapCr ?? 0, true)}
                </span>
              </div>
            </button>
          );
        })}

        {filteredCompanies.length === 0 && (
          <div className="col-span-full py-8 text-center text-xs text-slate-500 dark:text-slate-400">
            No companies matching the selected tier and sector filters.
          </div>
        )}
      </div>
    </div>
  );
};
