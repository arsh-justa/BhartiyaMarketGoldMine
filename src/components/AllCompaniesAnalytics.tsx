/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { IndianCompany } from '../data/indianCompanies';
import { formatInrCrores, exportToCsv } from '../utils/formatters';
import { 
  BarChart3, 
  ArrowUpDown, 
  Download, 
  Search,
  Check,
  X
} from 'lucide-react';

interface AllCompaniesAnalyticsProps {
  companies: IndianCompany[];
  onSelectCompany: (id: string) => void;
  selectedCompanyId: string;
  periodType: 'quarterly' | 'yearly';
}

type SortColumn = 'marketCapCr' | 'patCr' | 'patMarginPct' | 'peRatio';
type SortDirection = 'asc' | 'desc';

export const AllCompaniesAnalytics: React.FC<AllCompaniesAnalyticsProps> = ({
  companies,
  onSelectCompany,
  selectedCompanyId,
  periodType,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('All');
  const [sortCol, setSortCol] = useState<SortColumn>('marketCapCr');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');

  // Compute metrics for all companies
  const companyAnalytics = React.useMemo(() => {
    return companies.map(c => {
      const records = periodType === 'yearly' ? c.yearlyData : c.quarterlyData;
      const latest = records[records.length - 1];
      return {
        id: c.id,
        name: c.name,
        symbol: c.symbol,
        bseCode: c.bseCode,
        sector: c.sector,
        industry: c.industry,
        category: c.category,
        marketCapCr: latest.marketCapCr,
        patCr: latest.patCr,
        revenueCr: latest.revenueCr,
        patMarginPct: latest.patMarginPct,
        peRatio: c.benchmarks.peRatio,
        sharePriceInr: latest.sharePriceInr,
      };
    });
  }, [companies, periodType]);

  const sectors = ['All', ...Array.from(new Set(companies.map(c => c.sector)))];

  // Filter & Sort across ALL companies with market cap > 500 Cr
  const filteredAndSorted = React.useMemo(() => {
    let list = companyAnalytics.filter(c => {
      // Must be > 500 Cr
      if (c.marketCapCr < 500) return false;

      // Sector filter
      if (selectedSector !== 'All' && c.sector !== selectedSector) return false;

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const match =
          c.name.toLowerCase().includes(q) ||
          c.symbol.toLowerCase().includes(q) ||
          c.bseCode.includes(q) ||
          c.industry.toLowerCase().includes(q) ||
          c.sector.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });

    list.sort((a, b) => {
      const valA = a[sortCol];
      const valB = b[sortCol];
      return sortDir === 'asc' ? valA - valB : valB - valA;
    });

    return list;
  }, [companyAnalytics, searchTerm, selectedSector, sortCol, sortDir]);

  const handleSort = (col: SortColumn) => {
    if (sortCol === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('desc');
    }
  };

  const handleExportAll = () => {
    const rows = filteredAndSorted.map(c => ({
      Company: c.name,
      Symbol: c.symbol,
      BSE: c.bseCode,
      Sector: c.sector,
      Industry: c.industry,
      'Market Cap (INR Cr)': c.marketCapCr,
      [`${periodType === 'yearly' ? 'Annual' : 'Quarterly'} PAT (INR Cr)`]: c.patCr,
      'Revenue (INR Cr)': c.revenueCr,
      'PAT Margin (%)': c.patMarginPct,
      'P/E Multiple': c.peRatio,
      'Share Price (INR)': c.sharePriceInr,
    }));
    exportToCsv(`All_Indian_Companies_Above_500Cr_${periodType}.csv`, rows);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 md:p-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <span>Aggregate Analysis: All Companies &gt; ₹500 Cr Market Cap</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Displaying {filteredAndSorted.length} of {companyAnalytics.length} companies with Market Cap &gt; ₹500 Cr ({periodType === 'yearly' ? 'Annual' : 'Quarterly'} Financials)
          </p>
        </div>

        <button
          onClick={handleExportAll}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors shrink-0"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Search and Sector Filter Controls */}
      <div className="py-3 border-b border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        {/* Search bar */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search all companies by name, ticker, industry..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-8 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sector quick tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {sectors.map(sec => (
            <button
              key={sec}
              onClick={() => setSelectedSector(sec)}
              className={`px-2.5 py-1 rounded text-xs whitespace-nowrap transition-colors ${
                selectedSector === sec
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {sec}
            </button>
          ))}
        </div>
      </div>

      {/* Full Ranking Table */}
      <div className="overflow-x-auto mt-2 max-h-[480px] overflow-y-auto pr-1">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-slate-950 z-10 text-slate-400 border-b border-slate-800 font-medium">
            <tr>
              <th className="py-3 px-3">Company & Symbol</th>
              <th className="py-3 px-3">Business Segment</th>
              <th
                onClick={() => handleSort('marketCapCr')}
                className="py-3 px-3 text-right cursor-pointer hover:text-white transition-colors text-blue-300"
              >
                <div className="flex items-center justify-end gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                  <span>Market Cap</span>
                  <ArrowUpDown className="w-3 h-3 text-blue-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('patCr')}
                className="py-3 px-3 text-right cursor-pointer hover:text-white transition-colors text-emerald-300"
              >
                <div className="flex items-center justify-end gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  <span>{periodType === 'yearly' ? 'Annual PAT' : 'Quarterly PAT'}</span>
                  <ArrowUpDown className="w-3 h-3 text-emerald-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('patMarginPct')}
                className="py-3 px-3 text-right cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>PAT Margin</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('peRatio')}
                className="py-3 px-3 text-right cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>P/E</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-3 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono tabular-nums">
            {filteredAndSorted.map(c => {
              const isSelected = c.id === selectedCompanyId;
              return (
                <tr
                  key={c.id}
                  className={`hover:bg-slate-800/40 transition-colors ${
                    isSelected ? 'bg-blue-950/30' : ''
                  }`}
                >
                  <td className="py-2.5 px-3 font-sans">
                    <div className="font-semibold text-white flex items-center gap-1.5">
                      <span>{c.name}</span>
                      {isSelected && (
                        <span className="text-[10px] font-mono text-blue-400 bg-blue-950 px-1 py-0.2 rounded border border-blue-800">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      NSE: {c.symbol} · BSE: {c.bseCode}
                    </div>
                  </td>

                  <td className="py-2.5 px-3 font-sans text-slate-400">
                    <div className="text-slate-300">{c.industry}</div>
                    <div className="text-[10px] text-slate-500">{c.category}</div>
                  </td>

                  {/* Market Cap (Blue) */}
                  <td className="py-2.5 px-3 text-right text-blue-400 font-semibold">
                    <div>{formatInrCrores(c.marketCapCr, true)}</div>
                    <div className="text-[10px] text-slate-500 font-normal">
                      ₹{c.marketCapCr.toLocaleString('en-IN')} Cr
                    </div>
                  </td>

                  {/* PAT (Green) */}
                  <td className="py-2.5 px-3 text-right text-emerald-400 font-semibold">
                    {formatInrCrores(c.patCr, false)}
                  </td>

                  {/* PAT Margin */}
                  <td className="py-2.5 px-3 text-right text-slate-200">
                    {c.patMarginPct}%
                  </td>

                  {/* P/E Multiple */}
                  <td className="py-2.5 px-3 text-right text-slate-300">
                    {c.peRatio}x
                  </td>

                  {/* Action Button */}
                  <td className="py-2.5 px-3 text-center font-sans">
                    <button
                      onClick={() => onSelectCompany(c.id)}
                      className={`px-2.5 py-1 text-xs font-medium rounded transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'text-blue-400 hover:text-white bg-blue-950/80 hover:bg-blue-600 border border-blue-800/80'
                      }`}
                    >
                      {isSelected ? 'Viewing' : 'Graph'}
                    </button>
                  </td>
                </tr>
              );
            })}

            {filteredAndSorted.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-xs text-slate-400 font-sans">
                  No company matching &quot;{searchTerm}&quot; found in &gt; ₹500 Cr universe.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
