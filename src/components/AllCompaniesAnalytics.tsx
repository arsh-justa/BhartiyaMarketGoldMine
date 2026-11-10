/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { IndianCompany } from '../data/indianCompanies';
import { formatInrCrores, formatPercentage, exportToCsv } from '../utils/formatters';
import { 
  BarChart3, 
  ArrowUpDown, 
  Download, 
  PieChart, 
  TrendingUp, 
  Search,
  ExternalLink,
  Target
} from 'lucide-react';

interface AllCompaniesAnalyticsProps {
  companies: IndianCompany[];
  onSelectCompany: (id: string) => void;
  selectedCompanyId: string;
}

type SortColumn = 'marketCapCr' | 'patCr' | 'patMarginPct' | 'peRatio';
type SortDirection = 'asc' | 'desc';

export const AllCompaniesAnalytics: React.FC<AllCompaniesAnalyticsProps> = ({
  companies,
  onSelectCompany,
  selectedCompanyId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortCol, setSortCol] = useState<SortColumn>('marketCapCr');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [activeTab, setActiveTab] = useState<'ranking' | 'scatter' | 'sectors'>('ranking');

  // Compute metrics for all companies based on latest quarter
  const companyAnalytics = React.useMemo(() => {
    return companies.map(c => {
      const latest = c.quarterlyData[c.quarterlyData.length - 1];
      const fourQ = c.quarterlyData.slice(-4);
      const ttmPat = fourQ.reduce((sum, q) => sum + q.patCr, 0);
      const ttmRev = fourQ.reduce((sum, q) => sum + q.revenueCr, 0);
      return {
        id: c.id,
        name: c.name,
        symbol: c.symbol,
        sector: c.sector,
        category: c.category,
        marketCapCr: latest.marketCapCr,
        patCr: latest.patCr,
        revenueCr: latest.revenueCr,
        patMarginPct: latest.patMarginPct,
        peRatio: c.benchmarks.peRatio,
        ttmPatCr: ttmPat,
        sharePriceInr: latest.sharePriceInr,
      };
    });
  }, [companies]);

  // Aggregate totals
  const totalMarketCap = companyAnalytics.reduce((sum, c) => sum + c.marketCapCr, 0);
  const totalQuarterlyPat = companyAnalytics.reduce((sum, c) => sum + c.patCr, 0);
  const avgMargin = (companyAnalytics.reduce((sum, c) => sum + c.patMarginPct, 0) / companyAnalytics.length) || 0;

  // Filter & Sort
  const filteredAndSorted = React.useMemo(() => {
    let list = companyAnalytics.filter(c => {
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q) ||
        c.sector.toLowerCase().includes(q)
      );
    });

    list.sort((a, b) => {
      const valA = a[sortCol];
      const valB = b[sortCol];
      return sortDir === 'asc' ? valA - valB : valB - valA;
    });

    return list;
  }, [companyAnalytics, searchTerm, sortCol, sortDir]);

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
      Sector: c.sector,
      Category: c.category,
      'Market Cap (INR Cr)': c.marketCapCr,
      'Quarterly PAT (INR Cr)': c.patCr,
      'TTM Annualized PAT (INR Cr)': c.ttmPatCr,
      'Quarterly Revenue (INR Cr)': c.revenueCr,
      'PAT Margin (%)': c.patMarginPct,
      'P/E Ratio': c.peRatio,
      'Share Price (INR)': c.sharePriceInr,
    }));
    exportToCsv('All_Indian_Companies_Above_500Cr_Analysis.csv', rows);
  };

  // Sector aggregated summary
  const sectorSummary = React.useMemo(() => {
    const map = new Map<string, { count: number; mcap: number; pat: number }>();
    companyAnalytics.forEach(c => {
      const existing = map.get(c.sector) || { count: 0, mcap: 0, pat: 0 };
      existing.count += 1;
      existing.mcap += c.marketCapCr;
      existing.pat += c.patCr;
      map.set(c.sector, existing);
    });
    return Array.from(map.entries()).map(([sector, data]) => ({
      sector,
      ...data,
      mcapShare: (data.mcap / totalMarketCap) * 100,
      patShare: (data.pat / totalQuarterlyPat) * 100,
    })).sort((a, b) => b.mcap - a.mcap);
  }, [companyAnalytics, totalMarketCap, totalQuarterlyPat]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 md:p-6 shadow-xl">
      {/* Header and Aggregates */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <span>Aggregate Analysis: All Companies &gt; ₹500 Cr Market Cap</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Cross-sectional evaluation of India's listed corporate universe across market cap tiers
          </p>
        </div>

        {/* Global Summary Stats */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          <div className="bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[10px] font-sans">Combined M-Cap (Blue)</span>
            <span className="text-blue-400 font-bold text-sm">
              {formatInrCrores(totalMarketCap, true)}
            </span>
          </div>
          <div className="bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[10px] font-sans">Quarterly Net PAT (Green)</span>
            <span className="text-emerald-400 font-bold text-sm">
              {formatInrCrores(totalQuarterlyPat, false)}
            </span>
          </div>
          <div className="bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[10px] font-sans">Avg Net PAT Margin</span>
            <span className="text-slate-200 font-bold text-sm">
              {avgMargin.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Tabs and Controls */}
      <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/60">
        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('ranking')}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
              activeTab === 'ranking'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Companies Ranking
          </button>
          <button
            onClick={() => setActiveTab('scatter')}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
              activeTab === 'scatter'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Market Cap vs PAT Scatter
          </button>
          <button
            onClick={() => setActiveTab('sectors')}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
              activeTab === 'sectors'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sector Distribution
          </button>
        </div>

        {/* Search and CSV export */}
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search companies..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <button
            onClick={handleExportAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Ranking Table */}
      {activeTab === 'ranking' && (
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-medium">
              <tr>
                <th className="py-3 px-3">Company & Ticker</th>
                <th className="py-3 px-3">Sector & Category</th>
                <th
                  onClick={() => handleSort('marketCapCr')}
                  className="py-3 px-3 text-right cursor-pointer hover:text-white transition-colors text-blue-300"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                    <span>Market Cap (Blue)</span>
                    <ArrowUpDown className="w-3 h-3 text-blue-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('patCr')}
                  className="py-3 px-3 text-right cursor-pointer hover:text-white transition-colors text-emerald-300"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    <span>Quarterly PAT (Green)</span>
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
                    <span>P/E Multiple</span>
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
                            Active Chart
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        NSE: {c.symbol}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 font-sans text-slate-400">
                      <div className="text-slate-300">{c.sector}</div>
                      <div className="text-[10px] text-slate-500">{c.category}</div>
                    </td>

                    {/* Market Cap (Blue) */}
                    <td className="py-2.5 px-3 text-right text-blue-400 font-semibold">
                      <div>{formatInrCrores(c.marketCapCr, true)}</div>
                      <div className="text-[10px] text-slate-500 font-normal">
                        ₹{c.marketCapCr.toLocaleString('en-IN')} Cr
                      </div>
                    </td>

                    {/* Quarterly PAT (Green) */}
                    <td className="py-2.5 px-3 text-right text-emerald-400 font-semibold">
                      <div>{formatInrCrores(c.patCr, false)}</div>
                      <div className="text-[10px] text-slate-500 font-normal font-sans">
                        TTM: {formatInrCrores(c.ttmPatCr, c.ttmPatCr >= 100000)}
                      </div>
                    </td>

                    {/* Margin */}
                    <td className="py-2.5 px-3 text-right text-slate-200">
                      {c.patMarginPct}%
                    </td>

                    {/* P/E */}
                    <td className="py-2.5 px-3 text-right text-slate-300">
                      {c.peRatio}x
                    </td>

                    {/* Action */}
                    <td className="py-2.5 px-3 text-center font-sans">
                      <button
                        onClick={() => onSelectCompany(c.id)}
                        className="px-2.5 py-1 text-xs font-medium text-blue-400 hover:text-white bg-blue-950/80 hover:bg-blue-600 border border-blue-800/80 rounded transition-all"
                      >
                        Graph
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Visual Scatter Plot of Market Cap (Blue) vs PAT (Green) */}
      {activeTab === 'scatter' && (
        <div className="pt-4 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-2">
            <span>
              Logarithmic comparison: <strong className="text-blue-400">Market Cap (X-Axis)</strong> vs{' '}
              <strong className="text-emerald-400">Quarterly PAT (Y-Axis)</strong>. Circle size indicates PAT margin.
            </span>
            <span>Click any node to plot its quarterly graph</span>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 relative overflow-hidden">
            <svg viewBox="0 0 800 380" className="w-full h-auto overflow-visible select-none">
              {/* Gridlines */}
              {[80, 160, 240, 320].map(y => (
                <line key={y} x1="60" y1={y} x2="780" y2={y} stroke="#1e293b" strokeDasharray="3 3" />
              ))}
              {[200, 380, 560, 740].map(x => (
                <line key={x} x1={x} y1="20" x2={x} y2="340" stroke="#1e293b" strokeDasharray="3 3" />
              ))}

              {/* Axes */}
              <line x1="60" y1="340" x2="780" y2="340" stroke="#3b82f6" strokeWidth="1.5" />
              <line x1="60" y1="20" x2="60" y2="340" stroke="#10b981" strokeWidth="1.5" />

              {/* Axis Labels */}
              <text x="420" y="372" textAnchor="middle" fill="#60a5fa" fontSize="11" fontWeight="600" className="font-mono">
                Market Cap → (₹500 Cr to ₹23.8 Lakh Cr) [Blue Axis]
              </text>
              <text x="-180" y="20" transform="rotate(-90)" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="600" className="font-mono">
                Quarterly PAT → (₹20 Cr to ₹25,000 Cr) [Green Axis]
              </text>

              {/* Plotted Scatter Nodes */}
              {companyAnalytics.map(c => {
                // Log scale mapping for wide dynamic range
                const logMcap = Math.log10(c.marketCapCr); // ~2.7 (500) to 6.38 (2.4M)
                const minLogM = Math.log10(500);
                const maxLogM = Math.log10(2500000);
                const cx = 80 + ((logMcap - minLogM) / (maxLogM - minLogM)) * 680;

                const logPat = Math.log10(Math.max(5, c.patCr)); // ~1 to 4.4
                const minLogP = Math.log10(5);
                const maxLogP = Math.log10(28000);
                const cy = 320 - ((logPat - minLogP) / (maxLogP - minLogP)) * 280;

                const isSelected = c.id === selectedCompanyId;
                const radius = Math.max(6, Math.min(18, c.patMarginPct * 0.7));

                return (
                  <g
                    key={`scatter-${c.id}`}
                    onClick={() => onSelectCompany(c.id)}
                    className="cursor-pointer group"
                  >
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isSelected ? radius + 4 : radius}
                      fill={isSelected ? '#3b82f6' : '#10b981'}
                      fillOpacity={isSelected ? 0.9 : 0.65}
                      stroke={isSelected ? '#ffffff' : '#34d399'}
                      strokeWidth={isSelected ? 3 : 1.5}
                      className="transition-all hover:scale-125"
                    />
                    <text
                      x={cx}
                      y={cy - radius - 3}
                      textAnchor="middle"
                      fill="#e2e8f0"
                      fontSize="9"
                      fontWeight={isSelected ? 'bold' : 'normal'}
                      className="font-mono pointer-events-none opacity-80 group-hover:opacity-100"
                    >
                      {c.symbol}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      )}

      {/* Tab 3: Sector Distribution */}
      {activeTab === 'sectors' && (
        <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {sectorSummary.map(sec => (
            <div
              key={sec.sector}
              className="bg-slate-950/70 border border-slate-800 p-4 rounded-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-white">{sec.sector}</h4>
                  <span className="text-xs text-slate-400 font-mono">{sec.count} companies</span>
                </div>

                <div className="mt-3 space-y-2 text-xs font-mono">
                  {/* Market Cap Share */}
                  <div>
                    <div className="flex items-center justify-between text-blue-300">
                      <span>Total M-Cap (Blue):</span>
                      <span className="font-bold">{formatInrCrores(sec.mcap, true)}</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full mt-1 overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full" style={{ width: `${sec.mcapShare}%` }} />
                    </div>
                  </div>

                  {/* PAT Share */}
                  <div>
                    <div className="flex items-center justify-between text-emerald-300">
                      <span>Total Quarterly PAT (Green):</span>
                      <span className="font-bold">{formatInrCrores(sec.pat, false)}</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full mt-1 overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${sec.patShare}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>M-Cap Share: <strong className="text-blue-400">{sec.mcapShare.toFixed(1)}%</strong></span>
                <span>PAT Share: <strong className="text-emerald-400">{sec.patShare.toFixed(1)}%</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
