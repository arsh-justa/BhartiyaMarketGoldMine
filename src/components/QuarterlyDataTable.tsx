/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { QuarterlyRecord } from '../data/indianCompanies';
import { formatInrCrores, exportToCsv } from '../utils/formatters';
import { Download, ArrowUpDown, FileSpreadsheet } from 'lucide-react';

interface QuarterlyDataTableProps {
  companyName: string;
  symbol: string;
  data: QuarterlyRecord[];
}

type SortField = 'quarter' | 'marketCapCr' | 'patCr' | 'revenueCr' | 'patMarginPct' | 'sharePriceInr';
type SortOrder = 'asc' | 'desc';

export const QuarterlyDataTable: React.FC<QuarterlyDataTableProps> = ({
  companyName,
  symbol,
  data,
}) => {
  const [sortField, setSortField] = useState<SortField>('quarter');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'quarter') {
      comparison = a.quarter.localeCompare(b.quarter);
    } else {
      comparison = (a[sortField] || 0) - (b[sortField] || 0);
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleExportCsv = () => {
    const exportRows = data.map(d => ({
      Company: companyName,
      Symbol: symbol,
      Quarter: d.quarter,
      'Period Ended': d.periodEnded,
      'Fiscal Year': d.financialYear,
      'Market Cap (INR Cr)': d.marketCapCr,
      'PAT - Net Profit (INR Cr)': d.patCr,
      'Revenue (INR Cr)': d.revenueCr,
      'PAT Margin (%)': d.patMarginPct,
      'Share Price (INR)': d.sharePriceInr,
      'Key Corporate Disclosure': d.eventNote || '',
    }));
    exportToCsv(`${symbol}_Quarterly_PAT_MarketCap_Records.csv`, exportRows);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Table Header Controls */}
      <div className="p-4 md:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Quarterly Financial Ledger: PAT & Market Capitalisation</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Reported quarterly filings for {companyName} ({symbol})
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors shrink-0"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-medium">
            <tr>
              <th
                onClick={() => handleSort('quarter')}
                className="py-3 px-4 cursor-pointer hover:text-white transition-colors whitespace-nowrap"
              >
                <div className="flex items-center gap-1.5">
                  <span>Quarter & Period</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>

              {/* Market Cap (Blue) */}
              <th
                onClick={() => handleSort('marketCapCr')}
                className="py-3 px-4 text-right cursor-pointer hover:text-white transition-colors whitespace-nowrap"
              >
                <div className="flex items-center justify-end gap-1.5 text-blue-300">
                  <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                  <span>Market Cap (Blue)</span>
                  <ArrowUpDown className="w-3 h-3 text-blue-400" />
                </div>
              </th>

              {/* PAT (Green) */}
              <th
                onClick={() => handleSort('patCr')}
                className="py-3 px-4 text-right cursor-pointer hover:text-white transition-colors whitespace-nowrap"
              >
                <div className="flex items-center justify-end gap-1.5 text-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  <span>Quarterly PAT (Green)</span>
                  <ArrowUpDown className="w-3 h-3 text-emerald-400" />
                </div>
              </th>

              {/* Revenue */}
              <th
                onClick={() => handleSort('revenueCr')}
                className="py-3 px-4 text-right cursor-pointer hover:text-white transition-colors whitespace-nowrap"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Revenue (₹ Cr)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>

              {/* PAT Margin */}
              <th
                onClick={() => handleSort('patMarginPct')}
                className="py-3 px-4 text-right cursor-pointer hover:text-white transition-colors whitespace-nowrap"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>PAT Margin</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>

              {/* Share Price */}
              <th
                onClick={() => handleSort('sharePriceInr')}
                className="py-3 px-4 text-right cursor-pointer hover:text-white transition-colors whitespace-nowrap"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Close Price (₹)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>

              {/* Event Notes */}
              <th className="py-3 px-4 text-left whitespace-nowrap">
                <span>Quarterly Earnings Disclosure / Highlights</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono tabular-nums">
            {sortedData.map((record, idx) => (
              <tr
                key={record.quarter}
                className={`hover:bg-slate-800/40 transition-colors ${
                  idx % 2 === 0 ? 'bg-slate-900/40' : 'bg-slate-900/90'
                }`}
              >
                {/* Quarter */}
                <td className="py-2.5 px-4 whitespace-nowrap font-sans font-medium text-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white">{record.quarter}</span>
                    <span className="text-[10px] text-slate-400 px-1.5 py-0.5 rounded bg-slate-800/70">
                      {record.periodEnded}
                    </span>
                  </div>
                </td>

                {/* Market Cap (Blue) */}
                <td className="py-2.5 px-4 text-right whitespace-nowrap text-blue-400 font-semibold">
                  <div>{formatInrCrores(record.marketCapCr, true)}</div>
                  <div className="text-[10px] text-slate-500 font-normal">
                    ₹{record.marketCapCr.toLocaleString('en-IN')} Cr
                  </div>
                </td>

                {/* PAT (Green) */}
                <td className="py-2.5 px-4 text-right whitespace-nowrap text-emerald-400 font-semibold">
                  {formatInrCrores(record.patCr, false)}
                </td>

                {/* Revenue */}
                <td className="py-2.5 px-4 text-right whitespace-nowrap text-slate-300">
                  ₹{record.revenueCr.toLocaleString('en-IN')}
                </td>

                {/* PAT Margin */}
                <td className="py-2.5 px-4 text-right whitespace-nowrap text-slate-200 font-medium">
                  {record.patMarginPct}%
                </td>

                {/* Share Price */}
                <td className="py-2.5 px-4 text-right whitespace-nowrap text-slate-200">
                  ₹{record.sharePriceInr.toLocaleString('en-IN')}
                </td>

                {/* Key Event */}
                <td className="py-2.5 px-4 font-sans text-xs text-slate-400 max-w-sm truncate">
                  {record.eventNote ? (
                    <span className="text-amber-300/90">{record.eventNote}</span>
                  ) : (
                    <span className="text-slate-600">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
