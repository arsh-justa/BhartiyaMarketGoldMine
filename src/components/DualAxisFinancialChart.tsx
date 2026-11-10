/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useId } from 'react';
import { QuarterlyRecord } from '../data/indianCompanies';
import { formatInrCrores, formatInrCompact, formatPercentage } from '../utils/formatters';
import { 
  TrendingUp, 
  BarChart2, 
  Maximize2, 
  Download, 
  Info,
  Calendar,
} from 'lucide-react';

interface DualAxisFinancialChartProps {
  companyName: string;
  symbol: string;
  sector: string;
  category: string;
  data: QuarterlyRecord[];
  timeframe: '4Q' | '8Q' | '12Q';
  onTimeframeChange: (tf: '4Q' | '8Q' | '12Q') => void;
}

export type ChartMode = 'dual-line' | 'bar-line' | 'normalized';

export const DualAxisFinancialChart: React.FC<DualAxisFinancialChartProps> = ({
  companyName,
  symbol,
  sector,
  category,
  data,
  timeframe,
  onTimeframeChange,
}) => {
  const chartId = useId();
  const [chartMode, setChartMode] = useState<ChartMode>('dual-line');
  const [showMarketCap, setShowMarketCap] = useState(true);
  const [showPat, setShowPat] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [isTooltipLocked, setIsTooltipLocked] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Filter data according to selected timeframe (4Q = 1 Year, 8Q = 2 Years, 12Q = 3 Years)
  const filteredData = React.useMemo(() => {
    const countMap: Record<string, number> = { '4Q': 4, '8Q': 8, '12Q': 12 };
    const count = countMap[timeframe] || 12;
    return data.slice(-count);
  }, [data, timeframe]);

  // Selected or latest record
  const activeRecord = hoveredIdx !== null && filteredData[hoveredIdx] 
    ? filteredData[hoveredIdx] 
    : filteredData[filteredData.length - 1];

  // Calculate scales and bounds
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

  // Normalized baseline growth (% change from start quarter)
  const baseMcap = filteredData[0]?.marketCapCr || 1;
  const basePat = filteredData[0]?.patCr || 1;

  const normMcapValues = filteredData.map(d => ((d.marketCapCr - baseMcap) / baseMcap) * 100);
  const normPatValues = filteredData.map(d => ((d.patCr - basePat) / basePat) * 100);
  const allNormValues = [...normMcapValues, ...normPatValues];
  const normMin = Math.min(-5, Math.floor(Math.min(...allNormValues) - 5));
  const normMax = Math.max(10, Math.ceil(Math.max(...allNormValues) + 5));

  // Chart dimensions
  const width = 1000;
  const height = 440;
  const margin = { top: 32, right: 95, bottom: 56, left: 100 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Coordinate mappers
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

  // Generate SVG path coordinates
  const mcapPoints = filteredData.map((d, i) => ({ x: getX(i), y: getYMarketCap(d.marketCapCr) }));
  const patPoints = filteredData.map((d, i) => ({ x: getX(i), y: getYPat(d.patCr) }));

  // Smooth Bezier Curve generator
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

  // Closed area under market cap
  const mcapAreaString = mcapPoints.length > 0
    ? `${mcapPathString} L ${mcapPoints[mcapPoints.length - 1].x.toFixed(1)} ${(margin.top + innerHeight).toFixed(1)} L ${mcapPoints[0].x.toFixed(1)} ${(margin.top + innerHeight).toFixed(1)} Z`
    : '';

  // Closed area under PAT
  const patAreaString = patPoints.length > 0
    ? `${patPathString} L ${patPoints[patPoints.length - 1].x.toFixed(1)} ${(margin.top + innerHeight).toFixed(1)} L ${patPoints[0].x.toFixed(1)} ${(margin.top + innerHeight).toFixed(1)} Z`
    : '';

  // Ticks
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

  // Handle pointer scrub
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (isTooltipLocked) return;
    if (!svgRef.current) return;
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
    link.download = `${symbol}_Quarterly_PAT_MarketCap_Graph.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Delta calculations
  const firstItem = filteredData[0];
  const lastItem = filteredData[filteredData.length - 1];
  const mcapDeltaPct = firstItem && lastItem ? ((lastItem.marketCapCr - firstItem.marketCapCr) / firstItem.marketCapCr) * 100 : 0;
  const patDeltaPct = firstItem && lastItem ? ((lastItem.patCr - firstItem.patCr) / firstItem.patCr) * 100 : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 md:p-6 shadow-2xl relative overflow-hidden">
      {/* Top Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>{companyName}</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-950/70 border border-blue-800/80 text-blue-300">
                NSE: {symbol}
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
            <span>{category}</span>
            <span aria-hidden="true">·</span>
            <span>{sector} Sector</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-300 font-medium">X-Axis: Quarterly Reporting</span>
            <span aria-hidden="true">·</span>
            <span className="text-blue-400 font-semibold">Blue Y-Axis: Market Cap</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-400 font-semibold">Green Y-Axis: PAT (Profit After Tax)</span>
          </p>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Timeframe selector (Quarters) */}
          <div className="flex items-center bg-slate-950/80 p-1 rounded-lg border border-slate-800">
            {(['4Q', '8Q', '12Q'] as const).map(tf => {
              const labelMap = { '4Q': '4 Quarters (1Y)', '8Q': '8 Quarters (2Y)', '12Q': '12 Quarters (3Y)' };
              return (
                <button
                  key={tf}
                  onClick={() => onTimeframeChange(tf)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                    timeframe === tf
                      ? 'bg-blue-600 text-white shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                  title={labelMap[tf]}
                >
                  {tf}
                </button>
              );
            })}
          </div>

          {/* Chart Display Mode */}
          <div className="flex items-center bg-slate-950/80 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setChartMode('dual-line')}
              title="Dual Line Curves"
              className={`px-2.5 py-1.5 text-xs rounded-md transition-all flex items-center gap-1.5 ${
                chartMode === 'dual-line'
                  ? 'bg-slate-800 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
              <span>Dual Line</span>
            </button>
            <button
              onClick={() => setChartMode('bar-line')}
              title="PAT Bars (Green) + Market Cap Line (Blue)"
              className={`px-2.5 py-1.5 text-xs rounded-md transition-all flex items-center gap-1.5 ${
                chartMode === 'bar-line'
                  ? 'bg-slate-800 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Quarterly Bars + Line</span>
            </button>
            <button
              onClick={() => setChartMode('normalized')}
              title="Normalized % Growth"
              className={`px-2.5 py-1.5 text-xs rounded-md transition-all flex items-center gap-1.5 ${
                chartMode === 'normalized'
                  ? 'bg-slate-800 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5 text-purple-400" />
              <span>% Growth</span>
            </button>
          </div>

          {/* Export SVG */}
          <button
            onClick={handleExportSvg}
            className="p-2 text-slate-400 hover:text-white bg-slate-950/80 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
            title="Export High-Resolution Vector Chart"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Series Toggles & Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 pb-2 text-xs">
        <div className="flex items-center gap-4">
          {/* Blue Market Cap Legend Button */}
          <button
            onClick={() => setShowMarketCap(!showMarketCap)}
            className={`flex items-center gap-2 px-2.5 py-1 rounded transition-colors border ${
              showMarketCap
                ? 'bg-blue-950/40 border-blue-800/80 text-blue-200'
                : 'bg-slate-950 border-slate-800 text-slate-500 opacity-60'
            }`}
          >
            <span className="w-3 h-3 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50 inline-block" />
            <span className="font-semibold">Market Cap (Blue Y-Axis)</span>
            <span className="font-mono text-blue-400">
              {formatInrCrores(activeRecord?.marketCapCr || 0, true)}
            </span>
          </button>

          {/* Green PAT Legend Button */}
          <button
            onClick={() => setShowPat(!showPat)}
            className={`flex items-center gap-2 px-2.5 py-1 rounded transition-colors border ${
              showPat
                ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
                : 'bg-slate-950 border-slate-800 text-slate-500 opacity-60'
            }`}
          >
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50 inline-block" />
            <span className="font-semibold">Quarterly PAT (Green Y-Axis)</span>
            <span className="font-mono text-emerald-400">
              {formatInrCrores(activeRecord?.patCr || 0, false)}
            </span>
          </button>
        </div>

        {/* Quick Insights in Header */}
        <div className="hidden sm:flex items-center gap-3 text-slate-400">
          <span>{timeframe} Trajectory:</span>
          <span className={`font-mono font-medium ${mcapDeltaPct >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>
            M-Cap {formatPercentage(mcapDeltaPct)}
          </span>
          <span className="text-slate-600">·</span>
          <span className={`font-mono font-medium ${patDeltaPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            PAT {formatPercentage(patDeltaPct)}
          </span>
        </div>
      </div>

      {/* Main SVG Chart Container */}
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
            {/* Blue Gradient for Market Cap */}
            <linearGradient id={`${chartId}-blue-grad`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.38" />
              <stop offset="60%" stopColor="#1d4ed8" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.0" />
            </linearGradient>

            {/* Green Gradient for PAT */}
            <linearGradient id={`${chartId}-green-grad`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
              <stop offset="70%" stopColor="#059669" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#047857" stopOpacity="0.0" />
            </linearGradient>

            {/* Green Bar Gradient */}
            <linearGradient id={`${chartId}-bar-grad`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.5" />
            </linearGradient>

            {/* Glow Filter */}
            <filter id={`${chartId}-glow`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Inner Canvas Box */}
          <rect
            x={margin.left}
            y={margin.top}
            width={innerWidth}
            height={innerHeight}
            fill="#0b0f19"
            stroke="#1e293b"
            strokeWidth="1"
            rx="4"
          />

          {/* Horizontal Gridlines */}
          {showGrid && (
            <g className="grid-lines" opacity="0.65">
              {mcapTicks.map((tick, i) => (
                <line
                  key={`hgrid-${i}`}
                  x1={margin.left}
                  y1={tick.y}
                  x2={margin.left + innerWidth}
                  y2={tick.y}
                  stroke="#1e293b"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
              ))}
            </g>
          )}

          {/* Vertical Gridlines (each Quarter) */}
          {showGrid && (
            <g className="vertical-grid-lines" opacity="0.4">
              {filteredData.map((_, i) => {
                const x = getX(i);
                return (
                  <line
                    key={`vgrid-${i}`}
                    x1={x}
                    y1={margin.top}
                    x2={x}
                    y2={margin.top + innerHeight}
                    stroke="#1e293b"
                    strokeWidth="1"
                    strokeDasharray="2 4"
                  />
                );
              })}
            </g>
          )}

          {/* ================= LEFT Y-AXIS (BLUE: MARKET CAP) ================= */}
          {showMarketCap && (
            <g className="y-axis-left">
              {/* Blue Left Axis Line */}
              <line
                x1={margin.left}
                y1={margin.top}
                x2={margin.left}
                y2={margin.top + innerHeight}
                stroke="#3b82f6"
                strokeWidth="2"
              />

              {/* Blue Y-Axis Title Label */}
              <text
                x={-((margin.top + innerHeight) / 2)}
                y={20}
                transform="rotate(-90)"
                textAnchor="middle"
                fill="#60a5fa"
                fontSize="11"
                fontWeight="700"
                letterSpacing="0.04em"
                className="font-mono uppercase tracking-wider"
              >
                {chartMode === 'normalized' ? 'Market Cap (% Change)' : 'Market Capitalisation (₹)'}
              </text>

              {/* Blue Ticks and Values */}
              {(chartMode === 'normalized' ? normTicks : mcapTicks).map((t, idx) => (
                <g key={`mcap-tick-${idx}`} transform={`translate(${margin.left}, ${t.y})`}>
                  <line x1="-5" y1="0" x2="0" y2="0" stroke="#3b82f6" strokeWidth="1.5" />
                  <text
                    x="-10"
                    y="3.5"
                    textAnchor="end"
                    fill="#93c5fd"
                    fontSize="10"
                    fontWeight="500"
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

          {/* ================= RIGHT Y-AXIS (GREEN: PAT) ================= */}
          {showPat && (
            <g className="y-axis-right">
              {/* Green Right Axis Line */}
              <line
                x1={margin.left + innerWidth}
                y1={margin.top}
                x2={margin.left + innerWidth}
                y2={margin.top + innerHeight}
                stroke="#10b981"
                strokeWidth="2"
              />

              {/* Green Y-Axis Title Label */}
              <text
                x={(margin.top + innerHeight) / 2}
                y={-(width - 20)}
                transform="rotate(90)"
                textAnchor="middle"
                fill="#34d399"
                fontSize="11"
                fontWeight="700"
                letterSpacing="0.04em"
                className="font-mono uppercase tracking-wider"
              >
                {chartMode === 'normalized' ? 'Quarterly PAT (% Change)' : 'Quarterly PAT - Net Profit (₹ Cr)'}
              </text>

              {/* Green Ticks and Values */}
              {(chartMode === 'normalized' ? normTicks : patTicks).map((t, idx) => (
                <g key={`pat-tick-${idx}`} transform={`translate(${margin.left + innerWidth}, ${t.y})`}>
                  <line x1="0" y1="0" x2="5" y2="0" stroke="#10b981" strokeWidth="1.5" />
                  <text
                    x="10"
                    y="3.5"
                    textAnchor="start"
                    fill="#6ee7b7"
                    fontSize="10"
                    fontWeight="500"
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

          {/* ================= X-AXIS (QUARTERS) ================= */}
          <g className="x-axis" transform={`translate(0, ${margin.top + innerHeight})`}>
            {/* Baseline */}
            <line
              x1={margin.left}
              y1="0"
              x2={margin.left + innerWidth}
              y2="0"
              stroke="#334155"
              strokeWidth="1.5"
            />

            {/* Quarter Ticks and Labels */}
            {filteredData.map((d, i) => {
              const x = getX(i);
              return (
                <g key={`quarter-tick-${i}`} transform={`translate(${x}, 0)`}>
                  <line x1="0" y1="0" x2="0" y2="6" stroke="#475569" strokeWidth="1" />
                  
                  {/* Primary Quarter Label (e.g. Q1 FY25) */}
                  <text
                    x="0"
                    y="20"
                    textAnchor="middle"
                    fill={hoveredIdx === i ? '#ffffff' : '#e2e8f0'}
                    fontSize="11"
                    fontWeight={hoveredIdx === i ? '700' : '600'}
                    className="font-mono transition-colors"
                  >
                    {d.quarter}
                  </text>

                  {/* Period Ended Date (e.g. Jun 2024) */}
                  <text
                    x="0"
                    y="34"
                    textAnchor="middle"
                    fill={hoveredIdx === i ? '#93c5fd' : '#64748b'}
                    fontSize="9"
                    fontWeight="500"
                    className="font-mono"
                  >
                    {d.periodEnded}
                  </text>
                </g>
              );
            })}

            {/* X-Axis Bottom Descriptive Label */}
            <text
              x={margin.left + innerWidth / 2}
              y="50"
              textAnchor="middle"
              fill="#64748b"
              fontSize="10.5"
              fontWeight="600"
              letterSpacing="0.05em"
              className="uppercase tracking-widest"
            >
              Timeline (Quarterly Corporate Financial Filings)
            </text>
          </g>

          {/* ================= DATA VISUALIZATION: BARS OR LINES ================= */}

          {/* Mode 2: BARS FOR PAT (Green) */}
          {chartMode === 'bar-line' && showPat && (
            <g className="pat-bars">
              {filteredData.map((d, i) => {
                const x = getX(i);
                const y = getYPat(d.patCr);
                const barWidth = Math.max(14, Math.min(36, (innerWidth / filteredData.length) * 0.5));
                const barHeight = margin.top + innerHeight - y;
                const isHovered = hoveredIdx === i;

                return (
                  <rect
                    key={`pat-bar-${i}`}
                    x={x - barWidth / 2}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    fill={`url(#${chartId}-bar-grad)`}
                    stroke="#10b981"
                    strokeWidth={isHovered ? 2.5 : 1}
                    rx="3"
                    className="transition-all duration-150"
                    opacity={isHovered ? 1 : 0.88}
                  />
                );
              })}
            </g>
          )}

          {/* Blue Market Cap Area Fill */}
          {showMarketCap && chartMode !== 'normalized' && (
            <path
              d={mcapAreaString}
              fill={`url(#${chartId}-blue-grad)`}
              className="pointer-events-none"
            />
          )}

          {/* Green PAT Area Fill (when in dual-line mode) */}
          {showPat && chartMode === 'dual-line' && (
            <path
              d={patAreaString}
              fill={`url(#${chartId}-green-grad)`}
              className="pointer-events-none"
            />
          )}

          {/* BLUE LINE: MARKET CAPITALISATION */}
          {showMarketCap && (
            <g className="marketcap-series">
              <path
                d={mcapPathString}
                fill="none"
                stroke="#2563eb"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="filter drop-shadow-[0_2px_8px_rgba(37,99,235,0.4)]"
              />

              {/* Data points for Market Cap */}
              {filteredData.map((d, i) => {
                const x = getX(i);
                const y = getYMarketCap(d.marketCapCr);
                const isHovered = hoveredIdx === i;

                return (
                  <circle
                    key={`mcap-pt-${i}`}
                    cx={x}
                    cy={y}
                    r={isHovered ? 7 : 4.5}
                    fill="#1d4ed8"
                    stroke="#93c5fd"
                    strokeWidth={isHovered ? 3 : 1.5}
                    className="transition-all duration-150"
                  />
                );
              })}
            </g>
          )}

          {/* GREEN LINE: PROFIT AFTER TAX (PAT) */}
          {showPat && (
            <g className="pat-series">
              <path
                d={patPathString}
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={chartMode === 'bar-line' ? '5 3' : 'none'}
                className="filter drop-shadow-[0_2px_8px_rgba(16,185,129,0.45)]"
              />

              {/* Data points for PAT */}
              {filteredData.map((d, i) => {
                const x = getX(i);
                const y = getYPat(d.patCr);
                const isHovered = hoveredIdx === i;

                return (
                  <circle
                    key={`pat-pt-${i}`}
                    cx={x}
                    cy={y}
                    r={isHovered ? 7 : 4.5}
                    fill="#059669"
                    stroke="#a7f3d0"
                    strokeWidth={isHovered ? 3 : 1.5}
                    className="transition-all duration-150"
                  />
                );
              })}
            </g>
          )}

          {/* ================= INTERACTIVE CROSSHAIR & SCRUBBING ================= */}
          {hoveredIdx !== null && filteredData[hoveredIdx] && (
            <g className="interactive-crosshair pointer-events-none">
              {/* Vertical Guide Line */}
              <line
                x1={getX(hoveredIdx)}
                y1={margin.top}
                x2={getX(hoveredIdx)}
                y2={margin.top + innerHeight}
                stroke="#94a3b8"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />

              {/* Active Marker on Market Cap (Blue) */}
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

              {/* Active Marker on PAT (Green) */}
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

        {/* Floating Tooltip Pill */}
        {hoveredIdx !== null && filteredData[hoveredIdx] && (
          <div
            className="absolute z-20 pointer-events-none bg-slate-950/95 backdrop-blur-md border border-slate-700 p-3.5 rounded-lg shadow-2xl text-xs min-w-[260px] transform -translate-x-1/2 -translate-y-full transition-all"
            style={{
              left: `${(getX(hoveredIdx) / width) * 100}%`,
              top: `${Math.max(8, (Math.min(getYMarketCap(filteredData[hoveredIdx].marketCapCr), getYPat(filteredData[hoveredIdx].patCr)) / height) * 100 - 4)}%`,
            }}
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>{filteredData[hoveredIdx].quarter}</span>
                <span className="text-slate-400 font-normal">({filteredData[hoveredIdx].periodEnded})</span>
              </span>
              <span className="text-[10px] font-mono text-slate-300 px-1.5 py-0.5 rounded bg-slate-800">
                {filteredData[hoveredIdx].financialYear}
              </span>
            </div>

            <div className="mt-2 space-y-1.5 font-mono">
              {/* Market Cap (Blue) */}
              <div className="flex items-center justify-between text-blue-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="font-sans font-medium text-slate-300">Market Cap:</span>
                </span>
                <span className="font-bold text-blue-400">
                  {formatInrCrores(filteredData[hoveredIdx].marketCapCr, true)}
                </span>
              </div>

              {/* PAT (Green) */}
              <div className="flex items-center justify-between text-emerald-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-sans font-medium text-slate-300">Quarterly PAT:</span>
                </span>
                <span className="font-bold text-emerald-400">
                  {formatInrCrores(filteredData[hoveredIdx].patCr, false)}
                </span>
              </div>

              {/* Revenue */}
              <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-800/80 text-[11px]">
                <span className="font-sans">Quarterly Revenue:</span>
                <span className="text-slate-200">₹{filteredData[hoveredIdx].revenueCr.toLocaleString('en-IN')} Cr</span>
              </div>

              {/* PAT Margin */}
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span className="font-sans">PAT Margin:</span>
                <span className="text-emerald-300 font-medium">{filteredData[hoveredIdx].patMarginPct}%</span>
              </div>

              {/* Stock Price */}
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span className="font-sans">Quarter Close Price:</span>
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

      {/* Chart Footer Highlights */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <strong className="text-blue-400">Y-Axis (Blue):</strong> Market Capitalisation in ₹ Cr / Lakh Cr
          </span>
          <span className="text-slate-600">·</span>
          <span className="inline-flex items-center gap-1 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <strong className="text-emerald-400">Y-Axis (Green):</strong> Quarterly PAT in ₹ Crores
          </span>
        </div>

        <div className="flex items-center gap-2 text-slate-500">
          <span>Click on chart to {isTooltipLocked ? 'unlock' : 'pin'} inspector</span>
          <span className="text-slate-700">|</span>
          <button
            onClick={() => setShowGrid(!showGrid)}
            className="hover:text-slate-300 transition-colors underline"
          >
            {showGrid ? 'Hide Grid' : 'Show Grid'}
          </button>
        </div>
      </div>
    </div>
  );
};
