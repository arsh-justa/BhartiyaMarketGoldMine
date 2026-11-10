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
  Download, 
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
}

export type ChartMode = 'dual-line' | 'normalized';

export const DualAxisFinancialChart: React.FC<DualAxisFinancialChartProps> = ({
  companyName,
  symbol,
  sector,
  periodType,
  onPeriodTypeChange,
  quarterlyData,
  yearlyData,
}) => {
  const chartId = useId();
  const [chartMode, setChartMode] = useState<ChartMode>('dual-line');
  const [quarterRange, setQuarterRange] = useState<'4Q' | '8Q' | '12Q'>('12Q');
  const [showMarketCap, setShowMarketCap] = useState(true);
  const [showPat, setShowPat] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [isTooltipLocked, setIsTooltipLocked] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Active dataset based on Quarterly vs Yearly selection
  const rawData = periodType === 'quarterly' ? quarterlyData : yearlyData;

  const filteredData = React.useMemo(() => {
    if (periodType === 'yearly') return rawData;
    const countMap: Record<string, number> = { '4Q': 4, '8Q': 8, '12Q': 12 };
    const count = countMap[quarterRange] || 12;
    return rawData.slice(-count);
  }, [rawData, periodType, quarterRange]);

  const activeRecord = hoveredIdx !== null && filteredData[hoveredIdx] 
    ? filteredData[hoveredIdx] 
    : filteredData[filteredData.length - 1];

  // Scales & Bounds
  const marketCapValues = filteredData.map(d => d.marketCapCr);
  const patValues = filteredData.map(d => d.patCr);

  const rawMcapMin = Math.min(...marketCapValues);
  const rawMcapMax = Math.max(...marketCapValues);
  const mcapPadding = (rawMcapMax - rawMcapMin) * 0.12 || rawMcapMax * 0.1;
  const mcapMin = Math.max(0, rawMcapMin - mcapPadding);
  const mcapMax = rawMcapMax + mcapPadding;

  const rawPatMin = Math.min(...patValues);
  const rawPatMax = Math.max(...patValues);
  const patPadding = (rawPatMax - rawPatMin) * 0.15 || rawPatMax * 0.1;
  const patMin = Math.max(0, rawPatMin - patPadding);
  const patMax = rawPatMax + patPadding;

  // Normalized comparison baseline
  const baseMcap = filteredData[0]?.marketCapCr || 1;
  const basePat = filteredData[0]?.patCr || 1;
  const normMcapValues = filteredData.map(d => ((d.marketCapCr - baseMcap) / baseMcap) * 100);
  const normPatValues = filteredData.map(d => ((d.patCr - basePat) / basePat) * 100);
  const allNormValues = [...normMcapValues, ...normPatValues];
  const normMin = Math.min(-5, Math.floor(Math.min(...allNormValues) - 5));
  const normMax = Math.max(10, Math.ceil(Math.max(...allNormValues) + 5));

  // Canvas Geometry
  const width = 1000;
  const height = 430;
  const margin = { top: 28, right: 90, bottom: 48, left: 95 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const getX = (index: number) => {
    if (filteredData.length <= 1) return margin.left + innerWidth / 2;
    return margin.left + (index / (filteredData.length - 1)) * innerWidth;
  };

  const getYMarketCap = (val: number) => {
    if (chartMode === 'normalized') {
      const normVal = ((val - baseMcap) / baseMcap) * 100;
      return margin.top + innerHeight - ((normVal - normMin) / (normMax - normMin)) * innerHeight;
    }
    return margin.top + innerHeight - ((val - mcapMin) / (mcapMax - mcapMin)) * innerHeight;
  };

  const getYPat = (val: number) => {
    if (chartMode === 'normalized') {
      const normVal = ((val - basePat) / basePat) * 100;
      return margin.top + innerHeight - ((normVal - normMin) / (normMax - normMin)) * innerHeight;
    }
    return margin.top + innerHeight - ((val - patMin) / (patMax - patMin)) * innerHeight;
  };

  const mcapPoints = filteredData.map((d, i) => ({ x: getX(i), y: getYMarketCap(d.marketCapCr) }));
  const patPoints = filteredData.map((d, i) => ({ x: getX(i), y: getYPat(d.patCr) }));

  const createSmoothPath = (points: { x: number; y: number }[]) => {
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

  const mcapPathString = createSmoothPath(mcapPoints);
  const patPathString = createSmoothPath(patPoints);

  const mcapAreaString = mcapPoints.length > 0
    ? `${mcapPathString} L ${mcapPoints[mcapPoints.length - 1].x.toFixed(1)} ${(margin.top + innerHeight).toFixed(1)} L ${mcapPoints[0].x.toFixed(1)} ${(margin.top + innerHeight).toFixed(1)} Z`
    : '';

  const patAreaString = patPoints.length > 0
    ? `${patPathString} L ${patPoints[patPoints.length - 1].x.toFixed(1)} ${(margin.top + innerHeight).toFixed(1)} L ${patPoints[0].x.toFixed(1)} ${(margin.top + innerHeight).toFixed(1)} Z`
    : '';

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
    const y = margin.top + innerHeight - ((val - normMin) / (normMax - normMin)) * innerHeight;
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

  const handleExportSvg = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${symbol}_${periodType}_Graph.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const firstItem = filteredData[0];
  const lastItem = filteredData[filteredData.length - 1];
  const mcapDeltaPct = firstItem && lastItem ? ((lastItem.marketCapCr - firstItem.marketCapCr) / firstItem.marketCapCr) * 100 : 0;
  const patDeltaPct = firstItem && lastItem ? ((lastItem.patCr - firstItem.patCr) / firstItem.patCr) * 100 : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl relative">
      {/* Top Controls Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>{companyName}</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-950 border border-blue-800/80 text-blue-300">
                {symbol}
              </span>
            </h2>
          </div>
          <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
            <span>{sector}</span>
            <span aria-hidden="true">·</span>
            <span className="capitalize">{periodType} Frequency</span>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* YEARLY VS QUARTERLY TOGGLE (User Request 2) */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => onPeriodTypeChange('quarterly')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                periodType === 'quarterly'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Quarterly
            </button>
            <button
              onClick={() => onPeriodTypeChange('yearly')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                periodType === 'yearly'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Yearly (Annual)
            </button>
          </div>

          {/* Sub-Range for Quarterly */}
          {periodType === 'quarterly' && (
            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              {(['4Q', '8Q', '12Q'] as const).map(q => (
                <button
                  key={q}
                  onClick={() => setQuarterRange(q)}
                  className={`px-2.5 py-1.5 rounded-md transition-all ${
                    quarterRange === q
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Display Mode (Dual Line or Normalized % Growth) */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setChartMode('dual-line')}
              title="Dual Line"
              className={`px-2.5 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                chartMode === 'dual-line' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
              <span>Dual Line</span>
            </button>
            <button
              onClick={() => setChartMode('normalized')}
              title="Normalized Growth"
              className={`px-2.5 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                chartMode === 'normalized' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5 text-purple-400" />
              <span>% Growth</span>
            </button>
          </div>

          <button
            onClick={handleExportSvg}
            className="p-2 text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
            title="Export SVG"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Clean Interactive Legend Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 pb-1 text-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowMarketCap(!showMarketCap)}
            className={`flex items-center gap-2 px-2.5 py-1 rounded transition-colors border ${
              showMarketCap
                ? 'bg-blue-950/40 border-blue-800/80 text-blue-300'
                : 'bg-slate-950 border-slate-800 text-slate-500 opacity-50'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm" />
            <span className="font-semibold">Market Cap</span>
            <span className="font-mono text-blue-400 font-bold">
              {formatInrCrores(activeRecord?.marketCapCr || 0, true)}
            </span>
          </button>

          <button
            onClick={() => setShowPat(!showPat)}
            className={`flex items-center gap-2 px-2.5 py-1 rounded transition-colors border ${
              showPat
                ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                : 'bg-slate-950 border-slate-800 text-slate-500 opacity-50'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
            <span className="font-semibold">PAT (Net Profit)</span>
            <span className="font-mono text-emerald-400 font-bold">
              {formatInrCrores(activeRecord?.patCr || 0, false)}
            </span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-slate-400 font-mono text-xs">
          <span>Change:</span>
          <span className={mcapDeltaPct >= 0 ? 'text-blue-400' : 'text-rose-400'}>
            M-Cap {formatPercentage(mcapDeltaPct)}
          </span>
          <span className="text-slate-600">·</span>
          <span className={patDeltaPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
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
            fill="#090d16"
            stroke="#1e293b"
            strokeWidth="1"
            rx="4"
          />

          {/* Grid lines */}
          {showGrid && (
            <g opacity="0.6">
              {mcapTicks.map((tick, i) => (
                <line
                  key={`hgrid-${i}`}
                  x1={margin.left}
                  y1={tick.y}
                  x2={margin.left + innerWidth}
                  y2={tick.y}
                  stroke="#1e293b"
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
                  stroke="#1e293b"
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
                stroke="#3b82f6"
                strokeWidth="2"
              />
              <text
                x={-((margin.top + innerHeight) / 2)}
                y={22}
                transform="rotate(-90)"
                textAnchor="middle"
                fill="#60a5fa"
                fontSize="11"
                fontWeight="700"
                className="font-mono uppercase tracking-wider"
              >
                Market Cap (₹)
              </text>
              {(chartMode === 'normalized' ? normTicks : mcapTicks).map((t, idx) => (
                <g key={`mcap-tick-${idx}`} transform={`translate(${margin.left}, ${t.y})`}>
                  <line x1="-5" y1="0" x2="0" y2="0" stroke="#3b82f6" strokeWidth="1.5" />
                  <text
                    x="-9"
                    y="3.5"
                    textAnchor="end"
                    fill="#93c5fd"
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
                stroke="#10b981"
                strokeWidth="2"
              />
              <text
                x={(margin.top + innerHeight) / 2}
                y={-(width - 22)}
                transform="rotate(90)"
                textAnchor="middle"
                fill="#34d399"
                fontSize="11"
                fontWeight="700"
                className="font-mono uppercase tracking-wider"
              >
                PAT Net Profit (₹ Cr)
              </text>
              {(chartMode === 'normalized' ? normTicks : patTicks).map((t, idx) => (
                <g key={`pat-tick-${idx}`} transform={`translate(${margin.left + innerWidth}, ${t.y})`}>
                  <line x1="0" y1="0" x2="5" y2="0" stroke="#10b981" strokeWidth="1.5" />
                  <text
                    x="9"
                    y="3.5"
                    textAnchor="start"
                    fill="#6ee7b7"
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

          {/* X-AXIS (QUARTERS OR YEARS) */}
          <g className="x-axis" transform={`translate(0, ${margin.top + innerHeight})`}>
            <line
              x1={margin.left}
              y1="0"
              x2={margin.left + innerWidth}
              y2="0"
              stroke="#334155"
              strokeWidth="1.5"
            />
            {filteredData.map((d, i) => {
              const x = getX(i);
              return (
                <g key={`period-tick-${i}`} transform={`translate(${x}, 0)`}>
                  <line x1="0" y1="0" x2="0" y2="5" stroke="#475569" strokeWidth="1" />
                  <text
                    x="0"
                    y="18"
                    textAnchor="middle"
                    fill={hoveredIdx === i ? '#ffffff' : '#cbd5e1'}
                    fontSize="11"
                    fontWeight={hoveredIdx === i ? '700' : '600'}
                    className="font-mono"
                  >
                    {d.period}
                  </text>
                  <text
                    x="0"
                    y="30"
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize="9"
                    className="font-mono"
                  >
                    {d.label}
                  </text>
                </g>
              );
            })}
          </g>



          {/* Area Fills */}
          {showMarketCap && chartMode !== 'normalized' && (
            <path d={mcapAreaString} fill={`url(#${chartId}-blue-grad)`} className="pointer-events-none" />
          )}
          {showPat && chartMode === 'dual-line' && (
            <path d={patAreaString} fill={`url(#${chartId}-green-grad)`} className="pointer-events-none" />
          )}

          {/* BLUE LINE: MARKET CAPITALISATION */}
          {showMarketCap && (
            <g>
              <path
                d={mcapPathString}
                fill="none"
                stroke="#2563eb"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {filteredData.map((d, i) => (
                <circle
                  key={`mcap-pt-${i}`}
                  cx={getX(i)}
                  cy={getYMarketCap(d.marketCapCr)}
                  r={hoveredIdx === i ? 7 : 4.5}
                  fill="#1d4ed8"
                  stroke="#93c5fd"
                  strokeWidth={hoveredIdx === i ? 3 : 1.5}
                />
              ))}
            </g>
          )}

          {/* GREEN LINE: PAT */}
          {showPat && (
            <g>
              <path
                d={patPathString}
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {filteredData.map((d, i) => (
                <circle
                  key={`pat-pt-${i}`}
                  cx={getX(i)}
                  cy={getYPat(d.patCr)}
                  r={hoveredIdx === i ? 7 : 4.5}
                  fill="#059669"
                  stroke="#a7f3d0"
                  strokeWidth={hoveredIdx === i ? 3 : 1.5}
                />
              ))}
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
                stroke="#94a3b8"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              {showMarketCap && (
                <circle
                  cx={getX(hoveredIdx)}
                  cy={getYMarketCap(filteredData[hoveredIdx].marketCapCr)}
                  r="7.5"
                  fill="#3b82f6"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  filter={`url(#${chartId}-glow)`}
                />
              )}
              {showPat && (
                <circle
                  cx={getX(hoveredIdx)}
                  cy={getYPat(filteredData[hoveredIdx].patCr)}
                  r="7.5"
                  fill="#10b981"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  filter={`url(#${chartId}-glow)`}
                />
              )}
            </g>
          )}
        </svg>

        {/* Floating Tooltip */}
        {hoveredIdx !== null && filteredData[hoveredIdx] && (
          <div
            className="absolute z-20 pointer-events-none bg-slate-950/95 backdrop-blur-md border border-slate-700 p-3.5 rounded-lg shadow-2xl text-xs min-w-[250px] transform -translate-x-1/2 -translate-y-full transition-all"
            style={{
              left: `${(getX(hoveredIdx) / width) * 100}%`,
              top: `${Math.max(8, (Math.min(getYMarketCap(filteredData[hoveredIdx].marketCapCr), getYPat(filteredData[hoveredIdx].patCr)) / height) * 100 - 4)}%`,
            }}
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <span className="font-bold text-white flex items-center gap-1.5 font-mono">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>{filteredData[hoveredIdx].period}</span>
                <span className="text-slate-400 font-normal">({filteredData[hoveredIdx].label})</span>
              </span>
            </div>

            <div className="mt-2 space-y-1.5 font-mono">
              <div className="flex items-center justify-between text-blue-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="font-sans text-slate-300">Market Cap:</span>
                </span>
                <span className="font-bold text-blue-400">
                  {formatInrCrores(filteredData[hoveredIdx].marketCapCr, true)}
                </span>
              </div>

              <div className="flex items-center justify-between text-emerald-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-sans text-slate-300">PAT:</span>
                </span>
                <span className="font-bold text-emerald-400">
                  {formatInrCrores(filteredData[hoveredIdx].patCr, false)}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-800/80 text-[11px]">
                <span className="font-sans">Revenue:</span>
                <span className="text-slate-200">₹{filteredData[hoveredIdx].revenueCr.toLocaleString('en-IN')} Cr</span>
              </div>

              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span className="font-sans">PAT Margin:</span>
                <span className="text-emerald-300 font-semibold">{filteredData[hoveredIdx].patMarginPct}%</span>
              </div>

              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span className="font-sans">Close Price:</span>
                <span className="text-slate-200">₹{filteredData[hoveredIdx].sharePriceInr.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {filteredData[hoveredIdx].eventNote && (
              <div className="mt-2 pt-1.5 border-t border-slate-800 text-[10.5px] text-amber-300/90 leading-tight flex items-start gap-1">
                <Info className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                <span>{filteredData[hoveredIdx].eventNote}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
