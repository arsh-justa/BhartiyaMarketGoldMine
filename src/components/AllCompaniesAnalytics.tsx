/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { IndianCompany, resolveOrGenerateCompany } from '../data/indianCompanies';
import { formatInrCrores, exportToCsv } from '../utils/formatters';
import { 
  BarChart3, 
  ArrowUpDown, 
  Download, 
  Search, 
  X, 
  PlusCircle,
  Building,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';

interface AllCompaniesAnalyticsProps {
  companies: IndianCompany[];
  onSelectCompany: (id: string) => void;
  selectedCompanyId: string;
  periodType: 'quarterly' | 'yearly';
  onAddCustomCompany?: (company: IndianCompany) => void;
}

type SortColumn = 'marketCapCr' | 'patCr' | 'patMarginPct' | 'peRatio';
type SortDirection = 'asc' | 'desc';

export const AllCompaniesAnalytics: React.FC<AllCompaniesAnalyticsProps> = ({
  companies,
  onSelectCompany,
  selectedCompanyId,
  periodType,
  onAddCustomCompany,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('All');
  const [sortCol, setSortCol] = useState<SortColumn>('marketCapCr');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);

  // Reset to first page when search, sector, or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedSector, sortCol, sortDir]);

  // Compute metrics for all companies
  const companyAnalytics = useMemo(() => {
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

  // Real-time multi-token search
  const filteredAndSorted = useMemo(() => {
    let list = companyAnalytics.filter(c => {
      // Threshold check
      if (c.marketCapCr < 500) return false;

      // Sector filter
      if (selectedSector !== 'All' && c.sector !== selectedSector) return false;

      // Search term
      if (searchTerm.trim()) {
        const tokens = searchTerm.toLowerCase().trim().split(/\s+/);
        const targetString = `${c.name} ${c.symbol} ${c.bseCode} ${c.industry} ${c.sector}`.toLowerCase();
        const allTokensMatch = tokens.every(tok => targetString.includes(tok));
        if (!allTokensMatch) return false;
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

  // Pagination calculation
  const totalItems = filteredAndSorted.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedRows = filteredAndSorted.slice(startIndex, endIndex);

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

  const handleAddCustom = () => {
    if (!searchTerm.trim()) return;
    const generated = resolveOrGenerateCompany(searchTerm);
    if (generated && onAddCustomCompany) {
      onAddCustomCompany(generated);
      onSelectCompany(generated.id);
      setSearchTerm('');
    }
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
            Displaying <strong className="text-white">{filteredAndSorted.length}</strong> of{' '}
            <strong className="text-white">{companyAnalytics.length}</strong> listed Indian companies ({periodType === 'yearly' ? 'Annual' : 'Quarterly'} Data)
          </p>
        </div>

        <button
          onClick={handleExportAll}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors shrink-0"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span>Export All ({filteredAndSorted.length}) CSV</span>
        </button>
      </div>

      {/* Search Input and Sector Filter Tabs */}
      <div className="py-3 border-b border-slate-800/60 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        {/* Search bar */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search company, ticker, BSE code, or sector..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg pl-9 pr-8 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none transition-colors"
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

        {/* Sector Quick Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-full">
          {sectors.map(sec => (
            <button
              key={sec}
              onClick={() => setSelectedSector(sec)}
              className={`px-2.5 py-1 rounded text-xs whitespace-nowrap transition-colors ${
                selectedSector === sec
                  ? 'bg-blue-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {sec}
            </button>
          ))}
        </div>
      </div>

      {/* Comprehensive Table */}
      <div className="overflow-x-auto mt-2 pr-1">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-slate-950 z-10 text-slate-400 border-b border-slate-800 font-medium">
            <tr>
              <th className="py-3 px-3">Company &amp; Symbol</th>
              <th className="py-3 px-3">Industry Segment</th>
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
            {paginatedRows.map(c => {
              const isSelected = c.id === selectedCompanyId;
              return (
                <tr
                  key={c.id}
                  className={`hover:bg-slate-800/40 transition-colors ${
                    isSelected ? 'bg-blue-950/30' : ''
                  }`}
                >
                  <td className="py-3 px-3">
                    <div className="font-sans font-semibold text-white flex items-center gap-1.5">
                      <span>{c.name}</span>
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span className="font-mono text-blue-300">{c.symbol}</span>
                      <span className="text-slate-600">·</span>
                      <span className="font-mono text-slate-500">BSE {c.bseCode}</span>
                      <span className="text-slate-600">·</span>
                      <span className="font-sans text-slate-300">₹{c.sharePriceInr.toLocaleString('en-IN')}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-sans text-slate-300">
                    <div>{c.industry}</div>
                    <div className="text-[11px] text-slate-400">{c.sector}</div>
                  </td>
                  <td className="py-3 px-3 text-right text-blue-400 font-bold">
                    <div>{formatInrCrores(c.marketCapCr, true)}</div>
                    <div className="text-[10px] text-slate-400 font-normal">
                      ({formatInrCrores(c.marketCapCr, false)})
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right text-emerald-400 font-bold">
                    {formatInrCrores(c.patCr, false)}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-300">
                    <span
                      className={`font-semibold ${
                        c.patMarginPct >= 15
                          ? 'text-emerald-400'
                          : c.patMarginPct >= 8
                          ? 'text-slate-200'
                          : 'text-amber-400'
                      }`}
                    >
                      {c.patMarginPct}%
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right text-slate-300">
                    {c.peRatio}x
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => onSelectCompany(c.id)}
                      className={`px-2.5 py-1 text-xs rounded transition-colors font-sans font-medium ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-sm'
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
                <td colSpan={7} className="py-10 text-center text-xs text-slate-400 font-sans">
                  <div className="max-w-md mx-auto space-y-3">
                    <Building className="w-8 h-8 text-slate-600 mx-auto" />
                    <div>No preloaded company matching &quot;{searchTerm}&quot;.</div>
                    {onAddCustomCompany && searchTerm.trim().length >= 2 && (
                      <button
                        onClick={handleAddCustom}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow transition-colors"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>Add &amp; Plot &quot;{searchTerm.toUpperCase()}&quot; Financials</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalItems > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>
              Showing <strong className="text-white">{startIndex + 1}</strong> to{' '}
              <strong className="text-white">{endIndex}</strong> of{' '}
              <strong className="text-white">{totalItems}</strong> companies
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Page Size Selector */}
            <div className="flex items-center gap-1.5">
              <span>Per page:</span>
              <select
                value={pageSize}
                onChange={e => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 outline-none focus:border-blue-500"
              >
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            {/* Page navigation */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={safeCurrentPage === 1}
                title="First Page"
                className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={safeCurrentPage === 1}
                title="Previous Page"
                className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-2 font-mono text-slate-200">
                Page <strong className="text-white">{safeCurrentPage}</strong> of{' '}
                <strong className="text-white">{totalPages}</strong>
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={safeCurrentPage === totalPages}
                title="Next Page"
                className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={safeCurrentPage === totalPages}
                title="Last Page"
                className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
