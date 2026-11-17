/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useId } from 'react';
import { PeriodRecord } from '../data/indianCompanies';
import { formatInrCrores, formatInrCompact, formatPercentage } from '../utils/formatters';
import { 
  TrendingUp, 
  Maximize2, 
  Info,
  Calendar
} from 'lucide-react';

interface DualAxisFinancialChartProps {
  companyName: string;
  symbol: string;
  sector: string;
  periodType: 'quarterly' | 'yearly';
  onPeriodTypeChange: (type: 'quarterly' | 'yearly') => void;
  quarterlyData: PeriodRecord[];
  yearlyData: PeriodRecord[];
  theme?: 'dark' | 'light';
}

export type ChartMode = 'dual-line' | 'normalized';

function formatAxisTick(record: PeriodRecord): string {
  if (record.shortLabel) return record.shortLabel;
  const fyMatch = record.period.match(/FY(\d{2})/i);
  const monMatch = record.label.match(/^([A-Za-z]{3})\s+\d{4}$/);
  if (fyMatch && monMatch) {
    return `${fyMatch[1]} ${monMatch[1]}`;
  }
  return record.period;
}

export const DualAxisFinancialChart: React.FC<DualAxisFinancialChartProps> = ({
  companyName,
  symbol,
  sector,
  periodType,
  onPeriodTypeChange,
  quarterlyData,
  yearlyData,
  theme = 'dark',
}) => {
  const isDark = theme !== 'light';
  const chartId = useId();
  const [chartMode, setChartMode] = useState<ChartMode>('dual-line');
  const [quarterRange, setQuarterRange] = useState<'4Q' | '8Q' | '12Q' | '10Y'>('10Y');
  const [showMarketCap, setShowMarketCap] = useState(true);
  const [showPat, setShowPat] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [isTooltipLocked, setIsTooltipLocked] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Active dataset based on Quarterly vs Yearly selection (10 years by default)
  const rawData = periodType === 'quarterly' ? quarterlyData : yearlyData;

  const filteredData = React.useMemo(() => {
    if (periodType === 'yearly') return rawData.slice(-10);
    const countMap: Record<string, number> = { '4Q': 4, '8Q': 8, '12Q': 12, '10Y': 40 };
    const count = countMap[quarterRange] || 40;
    return rawData.slice(-count);
  }, [rawData, periodType, quarterRange]);

  const latestValidMcapRec = [...filteredData].reverse().find(d => d.marketCapCr !== null);
  const latestValidPatRec = [...filteredData].reverse().find(d => d.patCr !== null);
  const activeRecord = hoveredIdx !== null && filteredData[hoveredIdx]
    ? filteredData[hoveredIdx]
    : filteredData[filteredData.length - 1];

  // Scales & Bounds (ignoring null entries so missing data leaves gaps cleanly)
  const validMcapValues = filteredData
    .map(d => d.marketCapCr)
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  const validPatValues = filteredData
    .map(d => d.patCr)
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));

  const rawMcapMin = validMcapValues.length > 0 ? Math.min(...validMcapValues) : 0;
  const rawMcapMax = validMcapValues.length > 0 ? Math.max(...validMcapValues) : 100;
  const mcapSpan = rawMcapMax - rawMcapMin;
  const mcapPadding = mcapSpan * 0.12 || rawMcapMax * 0.1 || 10;
  const mcapMin = Math.max(0, rawMcapMin - mcapPadding);
  const mcapMax = rawMcapMax + mcapPadding;

  const rawPatMin = validPatValues.length > 0 ? Math.min(...validPatValues) : 0;
  const rawPatMax = validPatValues.length > 0 ? Math.max(...validPatValues) : 100;
  const patSpan = rawPatMax - rawPatMin;
  const patPadding = patSpan * 0.15 || Math.abs(rawPatMax) * 0.1 || 10;
  const patMin = rawPatMin < 0 ? rawPatMin - patPadding : Math.max(0, rawPatMin - patPadding);
  const patMax = rawPatMax + patPadding;

  // Normalized comparison baseline uses first non-null point in window
  const firstValidMcap = validMcapValues.find(v => v !== 0) ?? validMcapValues[0] ?? 1;
  const firstValidPat = validPatValues.find(v => v !== 0) ?? validPatValues[0] ?? 1;
  const baseMcap = firstValidMcap || 1;
  const basePat = Math.abs(firstValidPat) || 1;

  const normMcapValues: Array<number | null> = filteredData.map(d =>
    d.marketCapCr !== null ? ((d.marketCapCr - firstValidMcap) / baseMcap) * 100 : null
  );
  const normPatValues: Array<number | null> = filteredData.map(d =>
    d.patCr !== null ? ((d.patCr - firstValidPat) / basePat) * 100 : null
  );
  const allNormNumbers = [...normMcapValues, ...normPatValues].filter(
    (v): v is number => typeof v === 'number' && Number.isFinite(v)
  );
  const normMin = allNormNumbers.length > 0 ? Math.min(-5, Math.floor(Math.min(...allNormNumbers) - 5)) : -10;
  const normMax = allNormNumbers.length > 0 ? Math.max(10, Math.ceil(Math.max(...allNormNumbers) + 5)) : 100;

  // Canvas Geometry
  const isDenseTimeline = filteredData.length > 16;
  const width = 1000;
  const height = isDenseTimeline ? 450 : 430;
  const margin = { top: 28, right: 90, bottom: isDenseTimeline ? 64 : 46, left: 95 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const getX = (index: number) => {
    if (filteredData.length <= 1) return margin.left + innerWidth / 2;
    return margin.left + (index / (filteredData.length - 1)) * innerWidth;
  };

  const getYMarketCap = (val: number) => {
    if (chartMode === 'normalized') {
      const normVal = ((val - firstValidMcap) / baseMcap) * 100;
      return margin.top + innerHeight - ((normVal - normMin) / (normMax - normMin || 1)) * innerHeight;
    }
    return margin.top + innerHeight - ((val - mcapMin) / (mcapMax - mcapMin || 1)) * innerHeight;
  };

  const getYPat = (val: number) => {
    if (chartMode === 'normalized') {
      const normVal = ((val - firstValidPat) / basePat) * 100;
      return margin.top + innerHeight - ((normVal - normMin) / (normMax - normMin || 1)) * innerHeight;
    }
    return margin.top + innerHeight - ((val - patMin) / (patMax - patMin || 1)) * innerHeight;
  };

  interface ChartPoint {
    x: number;
    y: number;
    idx: number;
  }

  const buildSegments = (getVal: (d: PeriodRecord) => number | null, getY: (v: number) => number): ChartPoint[][] => {
    const segments: ChartPoint[][] = [];
    let current: ChartPoint[] = [];
    filteredData.forEach((d, idx) => {
      const v = getVal(d);
      if (typeof v === 'number' && Number.isFinite(v)) {
        current.push({ x: getX(idx), y: getY(v), idx });
      } else if (current.length > 0) {
        segments.push(current);
        current = [];
      }
    });
    if (current.length > 0) segments.push(current);
    return segments;
  };

  const mcapSegments = buildSegments(d => d.marketCapCr, getYMarketCap);
  const patSegments = buildSegments(d => d.patCr, getYPat);

  const createSmoothPath = (points: ChartPoint[]) => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  };

  const numTicks = 5;
  const mcapTicks = Array.from({ length: numTicks }, (_, i) => {
    const val = mcapMin + (i / (numTicks - 1)) * (mcapMax - mcapMin);
    return { val, y: getYMarketCap(val) };
  });

  const patTicks = Array.from({ length: numTicks }, (_, i) => {
    const val = patMin + (i / (numTicks - 1)) * (patMax - patMin);
    return { val, y: getYPat(val) };
  });

  const normTicks = Array.from({ length: numTicks }, (_, i) => {
    const val = normMin + (i / (numTicks - 1)) * (normMax - normMin);
    const y = margin.top + innerHeight - ((val - normMin) / (normMax - normMin || 1)) * innerHeight;
    return { val, y };
  });

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (isTooltipLocked || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const svgX = (clientX / rect.width) * width;

    let nearestIdx = 0;
    let minDiff = Infinity;
    filteredData.forEach((_, i) => {
      const px = getX(i);
      const diff = Math.abs(px - svgX);
      if (diff < minDiff) {
        minDiff = diff;
        nearestIdx = i;
      }
    });

    setHoveredIdx(nearestIdx);
  };

  const firstMcapItem = filteredData.find(d => d.marketCapCr !== null);
  const lastMcapItem = [...filteredData].reverse().find(d => d.marketCapCr !== null);
  const mcapDeltaPct =
    firstMcapItem?.marketCapCr && lastMcapItem?.marketCapCr
      ? ((lastMcapItem.marketCapCr - firstMcapItem.marketCapCr) / firstMcapItem.marketCapCr) * 100
      : 0;

  const firstPatItem = filteredData.find(d => d.patCr !== null);
  const lastPatItem = [...filteredData].reverse().find(d => d.patCr !== null);
  const patDeltaPct =
    firstPatItem?.patCr && lastPatItem?.patCr
      ? ((lastPatItem.patCr - firstPatItem.patCr) / Math.abs(firstPatItem.patCr)) * 100
      : 0;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm dark:shadow-2xl relative transition-colors">
      {/* Top Controls Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span>{companyName}</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800/80 text-blue-700 dark:text-blue-300">
                {symbol}
              </span>
            </h2>
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 flex items-center gap-2">
            <span>{sector}</span>
            <span aria-hidden="true">·</span>
            <span className="capitalize">{periodType} Frequency</span>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* YEARLY VS QUARTERLY TOGGLE */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold">
            <button
              onClick={() => onPeriodTypeChange('quarterly')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                periodType === 'quarterly'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Quarterly
            </button>
            <button
              onClick={() => onPeriodTypeChange('yearly')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                periodType === 'yearly'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Yearly (Annual)
            </button>
          </div>

          {/* Sub-Range for Quarterly (10Y default) */}
          {periodType === 'quarterly' && (
            <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
              {(['4Q', '8Q', '12Q', '10Y'] as const).map(q => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuarterRange(q)}
                  className={`px-2.5 py-1.5 rounded-md transition-all ${
                    quarterRange === q
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-sm dark:shadow-none'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Display Mode (Market Price or Normalized % Growth) */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setChartMode('dual-line')}
              title="Market Price"
              className={`px-2.5 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                chartMode === 'dual-line'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium shadow-sm dark:shadow-none'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Market Price</span>
            </button>
            <button
              type="button"
              onClick={() => setChartMode('normalized')}
              title="Normalized Growth"
              className={`px-2.5 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                chartMode === 'normalized'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium shadow-sm dark:shadow-none'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>% Growth</span>
            </button>
          </div>
        </div>
      </div>

      {/* Clean Interactive Legend Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 pt-3 pb-1 text-xs">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setShowMarketCap(!showMarketCap)}
            className={`flex items-center gap-2 px-2.5 py-1 rounded transition-colors border ${
              showMarketCap
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/80 text-blue-800 dark:text-blue-300'
                : 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 opacity-60'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm" />
            <span className="font-semibold">Market Cap</span>
            <span className="font-mono text-blue-700 dark:text-blue-400 font-bold">
              {(hoveredIdx !== null ? activeRecord?.marketCapCr : latestValidMcapRec?.marketCapCr) !== null &&
              (hoveredIdx !== null ? activeRecord?.marketCapCr : latestValidMcapRec?.marketCapCr) !== undefined
                ? formatInrCrores((hoveredIdx !== null ? activeRecord?.marketCapCr : latestValidMcapRec?.marketCapCr) as number, true)
                : 'N/A'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShowPat(!showPat)}
            className={`flex items-center gap-2 px-2.5 py-1 rounded transition-colors border ${
              showPat
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300'
                : 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 opacity-60'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
            <span className="font-semibold">PAT (Net Profit)</span>
            <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">
              {(hoveredIdx !== null ? activeRecord?.patCr : latestValidPatRec?.patCr) !== null &&
              (hoveredIdx !== null ? activeRecord?.patCr : latestValidPatRec?.patCr) !== undefined
                ? formatInrCrores((hoveredIdx !== null ? activeRecord?.patCr : latestValidPatRec?.patCr) as number, false)
                : 'no information'}
            </span>
          </button>

          {showPat && filteredData.some(d => d.patCr === null) && (
            <span className="flex items-center gap-1.5 px-2 py-1 text-[11px] text-slate-600 dark:text-slate-400">
              <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 inline-block" />
              <span>No PAT information</span>
            </span>
          )}
        </div>

        <div className="hidden sm:flex items-center gap-3 text-slate-600 dark:text-slate-400 font-mono text-xs">
          <span>Change:</span>
          <span className={mcapDeltaPct >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}>
            M-Cap {formatPercentage(mcapDeltaPct)}
          </span>
          <span className="text-slate-400 dark:text-slate-600">·</span>
          <span className={patDeltaPct >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
            PAT {formatPercentage(patDeltaPct)}
          </span>
        </div>
      </div>

      {/* Main SVG Canvas */}
      <div className="relative mt-2 w-full select-none">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible cursor-crosshair"
          onPointerMove={handlePointerMove}
          onPointerLeave={() => {
            if (!isTooltipLocked) setHoveredIdx(null);
          }}
          onClick={() => setIsTooltipLocked(!isTooltipLocked)}
        >
          <defs>
            <linearGradient id={`${chartId}-blue-grad`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.0" />
            </linearGradient>

            <linearGradient id={`${chartId}-green-grad`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#047857" stopOpacity="0.0" />
            </linearGradient>

            <linearGradient id={`${chartId}-bar-grad`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.5" />
            </linearGradient>

            <filter id={`${chartId}-glow`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background canvas */}
          <rect
            x={margin.left}
            y={margin.top}
            width={innerWidth}
            height={innerHeight}
            fill={isDark ? '#090d16' : '#f8fafc'}
            stroke={isDark ? '#1e293b' : '#cbd5e1'}
            strokeWidth="1"
            rx="4"
          />

          {/* Grid lines */}
          {showGrid && (
            <g opacity={isDark ? '0.6' : '0.85'}>
              {mcapTicks.map((tick, i) => (
                <line
                  key={`hgrid-${i}`}
                  x1={margin.left}
                  y1={tick.y}
                  x2={margin.left + innerWidth}
                  y2={tick.y}
                  stroke={isDark ? '#1e293b' : '#e2e8f0'}
                  strokeDasharray="3 3"
                />
              ))}
              {filteredData.map((_, i) => (
                <line
                  key={`vgrid-${i}`}
                  x1={getX(i)}
                  y1={margin.top}
                  x2={getX(i)}
                  y2={margin.top + innerHeight}
                  stroke={isDark ? '#1e293b' : '#e2e8f0'}
                  strokeDasharray="2 4"
                />
              ))}
            </g>
          )}

          {/* LEFT Y-AXIS (BLUE: Market Cap) */}
          {showMarketCap && (
            <g className="y-axis-left">
              <line
                x1={margin.left}
                y1={margin.top}
                x2={margin.left}
                y2={margin.top + innerHeight}
                stroke={isDark ? '#3b82f6' : '#2563eb'}
                strokeWidth="2"
              />
              <text
                x={-((margin.top + innerHeight) / 2)}
                y={22}
                transform="rotate(-90)"
                textAnchor="middle"
                fill={isDark ? '#60a5fa' : '#1d4ed8'}
                fontSize="11"
                fontWeight="700"
                className="font-mono uppercase tracking-wider"
              >
                Market Cap (₹)
              </text>
              {(chartMode === 'normalized' ? normTicks : mcapTicks).map((t, idx) => (
                <g key={`mcap-tick-${idx}`} transform={`translate(${margin.left}, ${t.y})`}>
                  <line x1="-5" y1="0" x2="0" y2="0" stroke={isDark ? '#3b82f6' : '#2563eb'} strokeWidth="1.5" />
                  <text
                    x="-9"
                    y="3.5"
                    textAnchor="end"
                    fill={isDark ? '#93c5fd' : '#1e40af'}
                    fontSize="10"
                    className="font-mono tabular-nums"
                  >
                    {chartMode === 'normalized' 
                      ? `${t.val > 0 ? '+' : ''}${t.val.toFixed(0)}%` 
                      : formatInrCompact(t.val)}
                  </text>
                </g>
              ))}
            </g>
          )}

          {/* RIGHT Y-AXIS (GREEN: PAT) */}
          {showPat && (
            <g className="y-axis-right">
              <line
                x1={margin.left + innerWidth}
                y1={margin.top}
                x2={margin.left + innerWidth}
                y2={margin.top + innerHeight}
                stroke={isDark ? '#10b981' : '#059669'}
                strokeWidth="2"
              />
              <text
                x={(margin.top + innerHeight) / 2}
                y={-(width - 22)}
                transform="rotate(90)"
                textAnchor="middle"
                fill={isDark ? '#34d399' : '#047857'}
                fontSize="11"
                fontWeight="700"
                className="font-mono uppercase tracking-wider"
              >
                PAT Net Profit (₹ Cr)
              </text>
              {(chartMode === 'normalized' ? normTicks : patTicks).map((t, idx) => (
                <g key={`pat-tick-${idx}`} transform={`translate(${margin.left + innerWidth}, ${t.y})`}>
                  <line x1="0" y1="0" x2="5" y2="0" stroke={isDark ? '#10b981' : '#059669'} strokeWidth="1.5" />
                  <text
                    x="9"
                    y="3.5"
                    textAnchor="start"
                    fill={isDark ? '#6ee7b7' : '#065f46'}
                    fontSize="10"
                    className="font-mono tabular-nums"
                  >
                    {chartMode === 'normalized'
                      ? `${t.val > 0 ? '+' : ''}${t.val.toFixed(0)}%`
                      : `₹${Math.round(t.val).toLocaleString('en-IN')} Cr`}
                  </text>
                </g>
              ))}
            </g>
          )}

          {/* X-AXIS (COMPACT SHORT LABELS LIKE "24 Jun" OR "FY24"; FULL DETAILS ON HOVER) */}
          <g className="x-axis" transform={`translate(0, ${margin.top + innerHeight})`}>
            <line
              x1={margin.left}
              y1="0"
              x2={margin.left + innerWidth}
              y2="0"
              stroke={isDark ? '#334155' : '#cbd5e1'}
              strokeWidth="1.5"
            />
            {filteredData.map((d, i) => {
              const x = getX(i);
              const shortTick = formatAxisTick(d);
              const showLabel =
                !isDenseTimeline || i % 2 === 0 || i === filteredData.length - 1;
              return (
                <g key={`period-tick-${i}`} transform={`translate(${x}, 0)`}>
                  <line
                    x1="0"
                    y1="0"
                    x2="0"
                    y2={showLabel ? '5' : '3'}
                    stroke={isDark ? '#475569' : '#94a3b8'}
                    strokeWidth="1"
                  />
                  {showLabel && (
                    isDenseTimeline ? (
                      <text
                        x="0"
                        y="12"
                        transform="rotate(-45 0 12)"
                        textAnchor="end"
                        fill={
                          hoveredIdx === i
                            ? (isDark ? '#ffffff' : '#0f172a')
                            : (isDark ? '#cbd5e1' : '#475569')
                        }
                        fontSize="10"
                        fontWeight={hoveredIdx === i ? '700' : '600'}
                        className="font-mono"
                      >
                        {shortTick}
                      </text>
                    ) : (
                      <text
                        x="0"
                        y="20"
                        textAnchor="middle"
                        fill={
                          hoveredIdx === i
                            ? (isDark ? '#ffffff' : '#0f172a')
                            : (isDark ? '#cbd5e1' : '#475569')
                        }
                        fontSize="11"
                        fontWeight={hoveredIdx === i ? '700' : '600'}
                        className="font-mono"
                      >
                        {shortTick}
                      </text>
                    )
                  )}
                </g>
              );
            })}
          </g>

          {/* Area Fills (per contiguous segment so missing data stays blank) */}
          {showMarketCap && chartMode !== 'normalized' && mcapSegments.map((seg, segIdx) => {
            if (seg.length < 2) return null;
            const segPath = createSmoothPath(seg);
            const segArea = `${segPath} L ${seg[seg.length - 1].x.toFixed(1)} ${(margin.top + innerHeight).toFixed(1)} L ${seg[0].x.toFixed(1)} ${(margin.top + innerHeight).toFixed(1)} Z`;
            return (
              <path
                key={`mcap-area-${segIdx}`}
                d={segArea}
                fill={`url(#${chartId}-blue-grad)`}
                className="pointer-events-none"
              />
            );
          })}
          {showPat && chartMode === 'dual-line' && patSegments.map((seg, segIdx) => {
            if (seg.length < 2) return null;
            const segPath = createSmoothPath(seg);
            const segArea = `${segPath} L ${seg[seg.length - 1].x.toFixed(1)} ${(margin.top + innerHeight).toFixed(1)} L ${seg[0].x.toFixed(1)} ${(margin.top + innerHeight).toFixed(1)} Z`;
            return (
              <path
                key={`pat-area-${segIdx}`}
                d={segArea}
                fill={`url(#${chartId}-green-grad)`}
                className="pointer-events-none"
              />
            );
          })}

          {/* BLUE LINE: MARKET CAPITALISATION */}
          {showMarketCap && (
            <g>
              {mcapSegments.map((seg, segIdx) =>
                seg.length >= 2 ? (
                  <path
                    key={`mcap-seg-${segIdx}`}
                    d={createSmoothPath(seg)}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : null
              )}
              {mcapSegments.flat().map(pt => (
                <circle
                  key={`mcap-pt-${pt.idx}`}
                  cx={pt.x}
                  cy={pt.y}
                  r={hoveredIdx === pt.idx ? 6.5 : isDenseTimeline ? 3.2 : 4.5}
                  fill="#1d4ed8"
                  stroke="#93c5fd"
                  strokeWidth={hoveredIdx === pt.idx ? 3 : 1.5}
                />
              ))}
            </g>
          )}

          {/* GREEN LINE: PAT (grey dot where data is absent) */}
          {showPat && (
            <g>
              {patSegments.map((seg, segIdx) =>
                seg.length >= 2 ? (
                  <path
                    key={`pat-seg-${segIdx}`}
                    d={createSmoothPath(seg)}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : null
              )}
              {patSegments.flat().map(pt => (
                <circle
                  key={`pat-pt-${pt.idx}`}
                  cx={pt.x}
                  cy={pt.y}
                  r={hoveredIdx === pt.idx ? 6.5 : isDenseTimeline ? 3.5 : 4.5}
                  fill="#059669"
                  stroke="#a7f3d0"
                  strokeWidth={hoveredIdx === pt.idx ? 3 : 1.5}
                />
              ))}
              {filteredData.map((d, i) =>
                d.patCr === null ? (
                  <circle
                    key={`pat-missing-${i}`}
                    cx={getX(i)}
                    cy={margin.top + innerHeight - 8}
                    r={hoveredIdx === i ? 6 : isDenseTimeline ? 3.2 : 4.2}
                    fill={isDark ? '#64748b' : '#94a3b8'}
                    stroke={hoveredIdx === i ? (isDark ? '#e2e8f0' : '#0f172a') : (isDark ? '#94a3b8' : '#64748b')}
                    strokeWidth={hoveredIdx === i ? 2.5 : 1}
                    opacity={hoveredIdx === i ? 1 : 0.85}
                  />
                ) : null
              )}
            </g>
          )}

          {/* Crosshair */}
          {hoveredIdx !== null && filteredData[hoveredIdx] && (
            <g className="pointer-events-none">
              <line
                x1={getX(hoveredIdx)}
                y1={margin.top}
                x2={getX(hoveredIdx)}
                y2={margin.top + innerHeight}
                stroke={isDark ? '#94a3b8' : '#64748b'}
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              {showMarketCap && filteredData[hoveredIdx].marketCapCr !== null && (
                <circle
                  cx={getX(hoveredIdx)}
                  cy={getYMarketCap(filteredData[hoveredIdx].marketCapCr as number)}
                  r="7.5"
                  fill="#3b82f6"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  filter={`url(#${chartId}-glow)`}
                />
              )}
              {showPat && filteredData[hoveredIdx].patCr !== null && (
                <circle
                  cx={getX(hoveredIdx)}
                  cy={getYPat(filteredData[hoveredIdx].patCr as number)}
                  r="7.5"
                  fill="#10b981"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  filter={`url(#${chartId}-glow)`}
                />
              )}
              {showPat && filteredData[hoveredIdx].patCr === null && (
                <circle
                  cx={getX(hoveredIdx)}
                  cy={margin.top + innerHeight - 8}
                  r="7"
                  fill={isDark ? '#64748b' : '#94a3b8'}
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              )}
            </g>
          )}
        </svg>

        {/* Floating Tooltip */}
        {hoveredIdx !== null && filteredData[hoveredIdx] && (() => {
          const rec = filteredData[hoveredIdx];
          const yCandidates: number[] = [];
          if (showMarketCap && rec.marketCapCr !== null) {
            yCandidates.push(getYMarketCap(rec.marketCapCr));
          }
          if (showPat && rec.patCr !== null) {
            yCandidates.push(getYPat(rec.patCr));
          } else if (showPat && rec.patCr === null) {
            yCandidates.push(margin.top + innerHeight - 8);
          }
          const minY = yCandidates.length > 0 ? Math.min(...yCandidates) : margin.top + innerHeight * 0.45;
          const mcapGrowth = normMcapValues[hoveredIdx];
          const patGrowth = normPatValues[hoveredIdx];

          return (
            <div
              className="absolute z-20 pointer-events-none bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 p-3 sm:p-3.5 rounded-lg shadow-xl dark:shadow-2xl text-xs min-w-[210px] sm:min-w-[250px] max-w-[calc(100%-0.5rem)] transform -translate-x-1/2 -translate-y-full transition-all"
              style={{
                left: `${Math.min(72, Math.max(28, (getX(hoveredIdx) / width) * 100))}%`,
                top: `${Math.max(16, (minY / height) * 100 - 4)}%`,
              }}
            >
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 font-mono">
                  <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>{rec.period}</span>
                  <span className="text-slate-500 dark:text-slate-400 font-normal">({rec.label})</span>
                </span>
              </div>

              <div className="mt-2 space-y-1.5 font-mono">
                <div className="flex items-center justify-between text-blue-700 dark:text-blue-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="font-sans text-slate-700 dark:text-slate-300">Market Cap:</span>
                  </span>
                  <span className={rec.marketCapCr !== null ? 'font-bold text-blue-700 dark:text-blue-400' : 'font-sans text-slate-500 dark:text-slate-400'}>
                    {rec.marketCapCr !== null ? formatInrCrores(rec.marketCapCr, true) : 'no information'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300">
                  <span className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${rec.patCr !== null ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-500'}`} />
                    <span className="font-sans text-slate-700 dark:text-slate-300">PAT:</span>
                  </span>
                  <span className={rec.patCr !== null ? 'font-bold text-emerald-700 dark:text-emerald-400' : 'font-sans text-slate-500 dark:text-slate-400'}>
                    {rec.patCr !== null ? formatInrCrores(rec.patCr, false) : 'no information'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800/80 text-[11px]">
                  <span className="font-sans">Revenue:</span>
                  <span className={rec.revenueCr !== null ? 'text-slate-900 dark:text-slate-200' : 'font-sans text-slate-500 dark:text-slate-400'}>
                    {rec.revenueCr !== null ? `₹${rec.revenueCr.toLocaleString('en-IN')} Cr` : 'no information'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                  <span className="font-sans">PAT Margin:</span>
                  <span className={rec.patMarginPct !== null ? 'text-emerald-700 dark:text-emerald-300 font-semibold' : 'font-sans text-slate-500 dark:text-slate-400'}>
                    {rec.patMarginPct !== null ? `${rec.patMarginPct}%` : 'no information'}
                  </span>
                </div>

                {chartMode === 'normalized' ? (
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                    <span className="font-sans">Growth %:</span>
                    <span className="text-purple-700 dark:text-purple-300 font-semibold">
                      M-Cap {mcapGrowth !== null ? formatPercentage(mcapGrowth) : 'no information'} · PAT{' '}
                      {patGrowth !== null ? formatPercentage(patGrowth) : 'no information'}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                    <span className="font-sans">Close Price:</span>
                    <span className="text-slate-900 dark:text-slate-200">
                      {rec.sharePriceInr !== null ? `₹${rec.sharePriceInr.toLocaleString('en-IN')}` : '—'}
                    </span>
                  </div>
                )}
              </div>

              {rec.eventNote && (
                <div className="mt-2 pt-1.5 border-t border-slate-200 dark:border-slate-800 text-[10.5px] text-amber-700 dark:text-amber-300/90 leading-tight flex items-start gap-1">
                  <Info className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <span>{rec.eventNote}</span>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
};
