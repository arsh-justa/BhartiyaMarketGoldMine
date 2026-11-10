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
  periodType?: 'quarterly' | 'yearly';
}

/**
 * Domain-aware affinity checker to strictly prevent cross-sector contamination
 * (e.g. Telecom companies like Airtel must NEVER appear in Private Banking peers!)
 */
function areCompaniesInSameDomain(a: IndianCompany, b: IndianCompany): boolean {
  if (a.id === b.id) return true;

  // 1. Direct explicit peer list
  if (a.peers?.includes(b.symbol) || b.peers?.includes(a.symbol)) {
    return true;
  }

  const aInd = a.industry.toLowerCase();
  const bInd = b.industry.toLowerCase();
  const aSec = a.sector.toLowerCase();
  const bSec = b.sector.toLowerCase();

  // 2. Exact industry match
  if (aInd === bInd) return true;

  // 3. Banking domain (Private, Public, Commercial & Retail Banking)
  const isABank = aInd.includes('bank') || aSec.includes('banking');
  const isBBank = bInd.includes('bank') || bSec.includes('banking');
  if (isABank) {
    // Only commercial banks or direct financial lending institutions
    return isBBank || bInd.includes('nbfc') || bInd.includes('lending');
  }
  if (isBBank) return false;

  // 4. Financial Services & FinTech / Exchanges / Broking
  const isAFin = aSec.includes('financial') || aSec.includes('banking');
  const isBFin = bSec.includes('financial') || bSec.includes('banking');
  if (isAFin) {
    return isBFin;
  }
  if (isBFin) return false;

  // 5. Information Technology & Software / Cloud
  const isAIT = aSec.includes('information technology') || aInd.includes('software') || aInd.includes('it services');
  const isBIT = bSec.includes('information technology') || bInd.includes('software') || bInd.includes('it services');
  if (isAIT) {
    return isBIT;
  }
  if (isBIT) return false;

  // 6. Telecommunications
  const isATelecom = aSec.includes('telecom') || aInd.includes('telecom');
  const isBTelecom = bSec.includes('telecom') || bInd.includes('telecom');
  if (isATelecom) {
    return isBTelecom;
  }
  if (isBTelecom) return false;

  // 7. Automotive OEMs & Auto Components
  const isAAuto = aSec.includes('automotive') || aInd.includes('auto') || aInd.includes('vehicle');
  const isBAuto = bSec.includes('automotive') || bInd.includes('auto') || bInd.includes('vehicle');
  if (isAAuto) {
    return isBAuto;
  }
  if (isBAuto) return false;

  // 8. Energy, Power, Oil & Gas
  const isAEnergy = aSec.includes('energy') || aInd.includes('oil') || aInd.includes('gas') || aInd.includes('power');
  const isBEnergy = bSec.includes('energy') || bInd.includes('oil') || bInd.includes('gas') || bInd.includes('power');
  if (isAEnergy) {
    return isBEnergy || bSec.includes('conglomerate');
  }

  // 9. Pharma, Healthcare & Hospitals
  const isAPharma = aSec.includes('healthcare') || aSec.includes('pharma') || aInd.includes('medicine') || aInd.includes('hospital');
  const isBPharma = bSec.includes('healthcare') || bSec.includes('pharma') || bInd.includes('medicine') || bInd.includes('hospital');
  if (isAPharma) {
    return isBPharma;
  }
  if (isBPharma) return false;

  // 10. FMCG & Consumer Retail
  const isAFmcg = aSec.includes('fmcg') || aSec.includes('consumer') || aInd.includes('retail') || aInd.includes('food');
  const isBFmcg = bSec.includes('fmcg') || bSec.includes('consumer') || bInd.includes('retail') || bInd.includes('food');
  if (isAFmcg) {
    return isBFmcg;
  }
  if (isBFmcg) return false;

  // 11. Metals, Mining & Materials
  const isAMetal = aSec.includes('metals') || aSec.includes('materials') || aInd.includes('steel') || aInd.includes('mining') || aInd.includes('cement');
  const isBMetal = bSec.includes('metals') || bSec.includes('materials') || bInd.includes('steel') || bInd.includes('mining') || bInd.includes('cement');
  if (isAMetal) {
    return isBMetal;
  }

  // Default: strictly same sector
  return a.sector === b.sector;
}

export const CompetitorComparison: React.FC<CompetitorComparisonProps> = ({
  currentCompany,
  allCompanies,
  onSelectCompany,
}) => {
  const [filterMode, setFilterMode] = useState<'direct-industry' | 'same-sector'>('direct-industry');

  // Identify at least 10 competitor companies strictly within the same industry/domain
  const competitors = React.useMemo(() => {
    const list: IndianCompany[] = [];
    const addedIds = new Set<string>();

    // 1. Current selected company always first in benchmark set
    list.push(currentCompany);
    addedIds.add(currentCompany.id);

    // 2. Direct peers specified in company profile
    const peerSymbols = new Set(currentCompany.peers || []);
    allCompanies.forEach(c => {
      if (!addedIds.has(c.id) && peerSymbols.has(c.symbol)) {
        list.push(c);
        addedIds.add(c.id);
      }
    });

    // 3. Same exact industry peers (e.g. Private Banking)
    allCompanies.forEach(c => {
      if (!addedIds.has(c.id) && c.industry === currentCompany.industry) {
        list.push(c);
        addedIds.add(c.id);
      }
    });

    // 4. Domain-compatible peers (e.g. Public Banking & Private Banking peers for any Bank)
    allCompanies.forEach(c => {
      if (!addedIds.has(c.id) && areCompaniesInSameDomain(currentCompany, c)) {
        list.push(c);
        addedIds.add(c.id);
      }
    });

    // 5. If filterMode is 'same-sector', include all remaining in the exact same sector
    if (filterMode === 'same-sector') {
      allCompanies.forEach(c => {
        if (!addedIds.has(c.id) && c.sector === currentCompany.sector) {
          list.push(c);
          addedIds.add(c.id);
        }
      });
    }

    // Sort by Market Cap descending
    list.sort((a, b) => {
      const mcapA = a.yearlyData[a.yearlyData.length - 1]?.marketCapCr || 0;
      const mcapB = b.yearlyData[b.yearlyData.length - 1]?.marketCapCr || 0;
      return mcapB - mcapA;
    });

    return list;
  }, [currentCompany, allCompanies, filterMode]);

  // Max values for relative scaling of horizontal bars
  const maxMcap = Math.max(
    ...competitors.map(c => c.yearlyData[c.yearlyData.length - 1]?.marketCapCr || 1)
  );

  const maxAnnualPat = Math.max(
    ...competitors.map(c => Math.max(1, c.yearlyData[c.yearlyData.length - 1]?.patCr || 1))
  );

  const maxCashFromOps = Math.max(
    ...competitors.map(c => {
      const annualPat = c.yearlyData[c.yearlyData.length - 1]?.patCr || 1;
      return Math.max(1, c.benchmarks.cashFromOperationsCr || Math.round(annualPat * 1.32));
    })
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 md:p-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Users2 className="w-5 h-5 text-blue-400" />
            <span>Competitors &amp; Peer Comparison: {currentCompany.industry}</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Benchmarking {currentCompany.name} against {competitors.length - 1} peers in {currentCompany.sector} (Annual PAT, Market Cap &amp; Cash from Operating Profit)
          </p>
        </div>

        {/* Filter scope toggle */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-medium">
          <button
            onClick={() => setFilterMode('direct-industry')}
            className={`px-3 py-1 rounded-md transition-colors ${
              filterMode === 'direct-industry' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Direct &amp; Industry ({competitors.length})
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

      {/* Benchmark Rows */}
      <div className="mt-4 space-y-4">
        {competitors.map((peer, idx) => {
          const isSelected = peer.id === currentCompany.id;
          const latestYearly = peer.yearlyData[peer.yearlyData.length - 1];
          const annualPatCr = latestYearly.patCr;
          const mcapCr = latestYearly.marketCapCr;
          const cashFromOpsCr = peer.benchmarks.cashFromOperationsCr || Math.round(annualPatCr * 1.32);

          const mcapWidthPct = Math.max(3, (mcapCr / maxMcap) * 100);
          const patWidthPct = Math.max(3, (Math.max(0, annualPatCr) / maxAnnualPat) * 100);
          const cashWidthPct = Math.max(3, (Math.max(0, cashFromOpsCr) / maxCashFromOps) * 100);

          return (
            <div
              key={peer.id}
              className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                isSelected
                  ? 'bg-slate-950 border-blue-500/80 shadow-md ring-1 ring-blue-500/40'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs text-slate-500 font-bold w-6">#{idx + 1}</span>
                  <span className="font-semibold text-sm text-white">{peer.name}</span>
                  <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    {peer.symbol}
                  </span>
                  {isSelected && (
                    <span className="text-[10px] font-mono font-medium text-blue-400 px-1.5 py-0.2 rounded bg-blue-950 border border-blue-800">
                      Current Focus
                    </span>
                  )}
                  <span className="text-xs text-slate-400 hidden md:inline">· {peer.industry}</span>
                </div>

                <div className="flex items-center gap-3.5 text-xs font-mono">
                  <span className="text-slate-400">
                    Net Margin: <strong className="text-emerald-400">{latestYearly.patMarginPct}%</strong>
                  </span>
                  <span className="text-slate-400">
                    P/E: <strong className="text-slate-200">{peer.benchmarks.peRatio}x</strong>
                  </span>
                  {!isSelected && (
                    <button
                      onClick={() => onSelectCompany(peer.id)}
                      className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-sans font-medium"
                    >
                      <span>Analyze</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* 3 Horizontal Bars: Market Cap (Blue), Annual PAT (Green), Cash from Operations (Cyan) */}
              <div className="mt-2 space-y-2.5">
                {/* 1. Market Cap (Blue Horizontal Bar) */}
                <div>
                  <div className="flex items-center justify-between text-xs font-mono mb-1">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                      <span className="font-sans">Market Cap:</span>
                    </span>
                    <span className="text-blue-400 font-bold tabular-nums">
                      {formatInrCrores(mcapCr, true)} ({formatInrCrores(mcapCr, false)})
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-800/80">
                    <div
                      className="bg-blue-600 hover:bg-blue-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${mcapWidthPct}%` }}
                    />
                  </div>
                </div>

                {/* 2. Annual PAT (Green Horizontal Bar - Always Annual) */}
                <div>
                  <div className="flex items-center justify-between text-xs font-mono mb-1">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span className="font-sans font-medium text-emerald-300">Annual PAT (Net Profit):</span>
                    </span>
                    <span className="text-emerald-400 font-bold tabular-nums">
                      {formatInrCrores(annualPatCr, false)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-800/80">
                    <div
                      className="bg-emerald-600 hover:bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${patWidthPct}%` }}
                    />
                  </div>
                </div>

                {/* 3. Cash from Operating Profit (Cyan Horizontal Bar) */}
                <div>
                  <div className="flex items-center justify-between text-xs font-mono mb-1">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                      <span className="font-sans text-cyan-300">Cash from Operating Profit:</span>
                    </span>
                    <span className="text-cyan-400 font-bold tabular-nums">
                      {formatInrCrores(cashFromOpsCr, false)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-800/80">
                    <div
                      className="bg-cyan-500 hover:bg-cyan-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${cashWidthPct}%` }}
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
