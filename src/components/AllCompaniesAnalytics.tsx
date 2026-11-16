/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { IndianCompany } from '../data/indianCompanies';
import { formatInrCrores } from '../utils/formatters';
import { 
  BarChart3, 
  ArrowUpDown, 
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
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
}) => {
  const [selectedSector, setSelectedSector] = useState<string>('All');
  const [sortCol, setSortCol] = useState<SortColumn>('marketCapCr');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');

  // Collapsible & Pagination states
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);

  // Reset to first page when sector or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSector, sortCol, sortDir]);

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
        marketCapCr: latest.marketCapCr ?? 0,
        patCr: latest.patCr ?? 0,
        revenueCr: latest.revenueCr ?? 0,
        patMarginPct: latest.patMarginPct ?? 0,
        peRatio: c.benchmarks.peRatio,
        sharePriceInr: latest.sharePriceInr ?? 0,
      };
    });
  }, [companies, periodType]);

  const sectors = ['All', ...Array.from(new Set(companies.map(c => c.sector)))];

  // Filter and sort companies
  const filteredAndSorted = useMemo(() => {
    const list = companyAnalytics.filter(c => {
      if (c.marketCapCr < 500) return false;
      if (selectedSector !== 'All' && c.sector !== selectedSector) return false;
      return true;
    });

    list.sort((a, b) => {
      const valA = a[sortCol];
      const valB = b[sortCol];
      return sortDir === 'asc' ? valA - valB : valB - valA;
    });

    return list;
  }, [companyAnalytics, selectedSector, sortCol, sortDir]);

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

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 md:p-6 shadow-xl overflow-hidden">
      {/* Collapsible Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(prev => !prev)}
        aria-expanded={isExpanded}
        className="w-full flex items-center justify-between gap-3 text-left group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg"
      >
        <div className="flex items-start gap-2.5 min-w-0">
          <span className="mt-0.5 p-1 rounded-md bg-slate-950 border border-slate-800 text-slate-400 group-hover:text-white group-hover:border-slate-700 transition-colors shrink-0">
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </span>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 shrink-0" />
              <span>Aggregate Analysis: All Companies</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Displaying <strong className="text-white">{filteredAndSorted.length}</strong> of{' '}
              <strong className="text-white">{companyAnalytics.length}</strong> listed Indian companies ({periodType === 'yearly' ? 'Annual' : 'Quarterly'} Data)
            </p>
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-800">
          {/* Sector Filter Tabs */}
          <div className="pb-3 border-b border-slate-800/60 flex items-center gap-1 overflow-x-auto no-scrollbar max-w-full text-xs">
            {sectors.map(sec => (
              <button
                key={sec}
                type="button"
                onClick={() => setSelectedSector(sec)}
                className={`px-2.5 py-1 rounded text-xs whitespace-nowrap shrink-0 transition-colors ${
                  selectedSector === sec
                    ? 'bg-blue-600 text-white font-medium shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {sec}
              </button>
            ))}
          </div>

          {/* Comprehensive Table */}
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left text-xs min-w-[640px]">
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
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
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
                          type="button"
                          onClick={() => onSelectCompany(c.id)}
                          className={`px-2.5 py-1 text-xs rounded transition-colors font-sans font-medium whitespace-nowrap ${
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
              </tbody>
            </table>
          </div>

          {/* Mobile-Safe Pagination Controls */}
          {totalItems > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-center sm:justify-end gap-3 text-xs text-slate-400">
              <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 w-full sm:w-auto">
                {/* Page Size Selector */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span>Per page:</span>
                  <select
                    value={pageSize}
                    onChange={e => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    aria-label="Rows per page"
                    className="bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-200 outline-none focus:border-blue-500"
                  >
                    <option value={15}>15</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                {/* Page navigation */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(1)}
                    disabled={safeCurrentPage === 1}
                    title="First Page"
                    aria-label="First Page"
                    className="p-2 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={safeCurrentPage === 1}
                    title="Previous Page"
                    aria-label="Previous Page"
                    className="p-2 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="px-2 font-mono text-slate-200 whitespace-nowrap">
                    Page <strong className="text-white">{safeCurrentPage}</strong> of{' '}
                    <strong className="text-white">{totalPages}</strong>
                  </span>

                  <button
                    type="button"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={safeCurrentPage === totalPages}
                    title="Next Page"
                    aria-label="Next Page"
                    className="p-2 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={safeCurrentPage === totalPages}
                    title="Last Page"
                    aria-label="Last Page"
                    className="p-2 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
