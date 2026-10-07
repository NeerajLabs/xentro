'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  Flame,
  DollarSign,
  Sparkles,
  Maximize2,
  Info,
  ArrowUpRight,
  Target,
  BarChart2,
  LineChart as LineChartIcon,
} from 'lucide-react';
import { FinancialUpdateRecord } from '@/types/finance';

interface FinanceTrajectoryChartProps {
  updates: FinancialUpdateRecord[];
}

export const FinanceTrajectoryChart: React.FC<FinanceTrajectoryChartProps> = ({ updates }) => {
  // Sort chronologically (oldest to newest for trajectory)
  const data = [...updates].slice(0, 6).reverse();
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (data.length === 0) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatCompactINR = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
    return `₹${val}`;
  };

  // Dimensions for SVG
  const svgWidth = 800;
  const svgHeight = 280;
  const padLeft = 60;
  const padRight = 30;
  const padTop = 30;
  const padBottom = 45;

  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;

  // Max value calculation rounded up to nearest 100,000
  const rawMax = Math.max(
    ...data.map((d) => Math.max(d.totalRevenue, d.totalExpenses)),
    500000
  );
  const maxVal = Math.ceil(rawMax / 100000) * 100000;

  // Points coordinates
  const n = data.length;
  const pointsRev = data.map((d, i) => {
    const x = padLeft + (i / (n - 1)) * plotW;
    const y = padTop + plotH - (d.totalRevenue / maxVal) * plotH;
    return { x, y, data: d };
  });

  const pointsExp = data.map((d, i) => {
    const x = padLeft + (i / (n - 1)) * plotW;
    const y = padTop + plotH - (d.totalExpenses / maxVal) * plotH;
    return { x, y, data: d };
  });

  // Generate smooth cubic Bézier curve
  const createSmoothPath = (pts: Array<{ x: number; y: number }>) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;

    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = i > 0 ? pts[i - 1] : pts[0];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = i < pts.length - 2 ? pts[i + 2] : p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return path;
  };

  const linePathRev = createSmoothPath(pointsRev);
  const linePathExp = createSmoothPath(pointsExp);

  // Area paths
  const baselineY = padTop + plotH;
  const areaPathRev = `${linePathRev} L ${pointsRev[pointsRev.length - 1].x} ${baselineY} L ${pointsRev[0].x} ${baselineY} Z`;
  const areaPathExp = `${linePathExp} L ${pointsExp[pointsExp.length - 1].x} ${baselineY} L ${pointsExp[0].x} ${baselineY} Z`;

  // Grid steps (4 horizontal gridlines)
  const gridSteps = [0, 0.25, 0.5, 0.75, 1];

  // Active hover data
  const activePoint = hoveredIdx !== null ? data[hoveredIdx] : data[data.length - 1];
  const activeRev = activePoint.totalRevenue;
  const activeExp = activePoint.totalExpenses;
  const activeNetBurn = activeExp - activeRev;
  const activeCoveragePct = activeExp > 0 ? Math.round((activeRev / activeExp) * 100) : 100;

  // 6-Month growth calculation
  const firstRev = data[0]?.totalRevenue || 1;
  const lastRev = data[data.length - 1]?.totalRevenue || 1;
  const sixMoGrowth = Math.round(((lastRev - firstRev) / firstRev) * 100);

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-6">
      {/* Top Header & Telemetry Badges */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-[#262A29]">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="text-base sm:text-lg font-bold font-sora text-[#101212] dark:text-white flex items-center gap-2">
              <span>Revenue vs Operating Burn Trajectory</span>
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F] flex items-center gap-1">
              <Target className="w-3.5 h-3.5" />
              <span>Convergence towards Break-Even</span>
            </span>
          </div>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
            Visualizes monthly growth velocity against operating expenditure as the net burn gap narrows.
          </p>
        </div>

        {/* Top Controls & View Style Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Key Legend Chips */}
          <div className="flex items-center gap-4 text-xs font-semibold bg-gray-50 dark:bg-[#202422] px-3.5 py-1.5 rounded-xl border border-gray-200 dark:border-[#262A29]">
            <div className="flex items-center gap-1.5 text-[#101212] dark:text-white">
              <span className="w-3 h-3 rounded-full bg-[#D9FF3F] ring-2 ring-[#D9FF3F]/30 shadow-xs" />
              <span>Revenue (₹)</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#565B59] dark:text-[#B6B8B7]">
              <span className="w-3 h-3 rounded-full bg-rose-500 ring-2 ring-rose-500/20" />
              <span>Operating Expenses (₹)</span>
            </div>
          </div>

          {/* Graph Style Toggle */}
          <div className="flex items-center p-1 bg-gray-100 dark:bg-[#202422] rounded-xl border border-gray-200 dark:border-[#262A29] text-xs font-bold">
            <button
              onClick={() => setChartType('area')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                chartType === 'area'
                  ? 'bg-white dark:bg-[#181B1A] text-[#101212] dark:text-white shadow-2xs'
                  : 'text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212]'
              }`}
            >
              <LineChartIcon className="w-3.5 h-3.5 text-[#D9FF3F]" />
              <span>Spline Area</span>
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                chartType === 'bar'
                  ? 'bg-white dark:bg-[#181B1A] text-[#101212] dark:text-white shadow-2xs'
                  : 'text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212]'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5 text-blue-500" />
              <span>Clustered Bar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Trajectory Highlights Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29]">
          <span className="text-[#565B59] dark:text-[#B6B8B7] block text-[11px]">Latest Month ({activePoint.period})</span>
          <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {formatCurrency(activeRev)}
          </span>
        </div>
        <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29]">
          <span className="text-[#565B59] dark:text-[#B6B8B7] block text-[11px]">Gross Burn (Expenses)</span>
          <span className="text-base font-bold font-mono text-[#101212] dark:text-white">
            {formatCurrency(activeExp)}
          </span>
        </div>
        <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29]">
          <span className="text-[#565B59] dark:text-[#B6B8B7] block text-[11px]">Net Monthly Deficit</span>
          <span className="text-base font-bold font-mono text-red-500">
            {activeNetBurn <= 0 ? 'Cash Flow Positive' : formatCurrency(activeNetBurn)}
          </span>
        </div>
        <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29]">
          <span className="text-[#565B59] dark:text-[#B6B8B7] block text-[11px]">Break-Even Distance</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-base font-bold font-mono text-[#101212] dark:text-white">
              {activeCoveragePct}%
            </span>
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
              +{sixMoGrowth}% 6M
            </span>
          </div>
        </div>
      </div>

      {/* SVG GRAPH CONTAINER */}
      <div className="relative w-full overflow-hidden select-none">
        {chartType === 'area' ? (
          /* 1. DUAL SMOOTH SPLINE AREA CHART (Modern SaaS / FinTech Trajectory) */
          <div className="relative w-full">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-64 sm:h-72 overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                {/* Revenue Glow Gradient */}
                <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#D9FF3F" stopOpacity="0.45" />
                  <stop offset="60%" stopColor="#D9FF3F" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#D9FF3F" stopOpacity="0.0" />
                </linearGradient>

                {/* Expenses Glow Gradient */}
                <linearGradient id="expensesGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity="0.15" />
                  <stop offset="70%" stopColor="#EF4444" stopOpacity="0.04" />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity="0.0" />
                </linearGradient>

                {/* Drop shadow filter for lines */}
                <filter id="glowRevenue" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#D9FF3F" floodOpacity="0.35" />
                </filter>
                <filter id="glowExpenses" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#EF4444" floodOpacity="0.25" />
                </filter>
              </defs>

              {/* Horizontal Gridlines & Y-Axis Labels */}
              {gridSteps.map((fraction, idx) => {
                const y = padTop + plotH - fraction * plotH;
                const val = fraction * maxVal;
                return (
                  <g key={idx}>
                    <line
                      x1={padLeft}
                      y1={y}
                      x2={svgWidth - padRight}
                      y2={y}
                      stroke="currentColor"
                      strokeDasharray="4 4"
                      className="text-gray-200 dark:text-[#262A29]"
                      strokeWidth="1"
                    />
                    <text
                      x={padLeft - 10}
                      y={y + 3.5}
                      textAnchor="end"
                      className="text-[10px] font-mono fill-gray-400 dark:fill-[#7E8380]"
                    >
                      {formatCompactINR(val)}
                    </text>
                  </g>
                );
              })}

              {/* Expense Area & Smooth Stroke */}
              <path d={areaPathExp} fill="url(#expensesGradient)" />
              <path
                d={linePathExp}
                fill="none"
                stroke="#EF4444"
                strokeWidth="2.5"
                strokeDasharray="6 4"
                className="opacity-80"
                filter="url(#glowExpenses)"
              />

              {/* Revenue Area & Smooth Stroke */}
              <path d={areaPathRev} fill="url(#revenueGradient)" />
              <path
                d={linePathRev}
                fill="none"
                stroke="#D9FF3F"
                strokeWidth="3.5"
                strokeLinecap="round"
                filter="url(#glowRevenue)"
              />

              {/* Data Points & Interactive Columns */}
              {pointsRev.map((pRev, i) => {
                const pExp = pointsExp[i];
                const isHovered = hoveredIdx === i;

                return (
                  <g key={i}>
                    {/* Hover vertical reference line */}
                    {isHovered && (
                      <line
                        x1={pRev.x}
                        y1={padTop}
                        x2={pRev.x}
                        y2={baselineY}
                        stroke="#D9FF3F"
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                        className="opacity-80 animate-fade-in"
                      />
                    )}

                    {/* Expense point node */}
                    <circle
                      cx={pExp.x}
                      cy={pExp.y}
                      r={isHovered ? 6 : 4}
                      fill="#181B1A"
                      stroke="#EF4444"
                      strokeWidth={isHovered ? 3 : 2}
                      className="transition-all duration-200"
                    />

                    {/* Revenue point node */}
                    <circle
                      cx={pRev.x}
                      cy={pRev.y}
                      r={isHovered ? 7 : 5}
                      fill="#181B1A"
                      stroke="#D9FF3F"
                      strokeWidth={isHovered ? 3.5 : 2.5}
                      className="transition-all duration-200 cursor-pointer"
                    />

                    {/* Month X-Axis Label */}
                    <text
                      x={pRev.x}
                      y={baselineY + 22}
                      textAnchor="middle"
                      className={`text-[11px] font-mono font-semibold transition-colors ${
                        isHovered
                          ? 'fill-[#101212] dark:fill-white font-bold'
                          : 'fill-gray-500 dark:fill-[#8E9390]'
                      }`}
                    >
                      {pRev.data.period.split(' ')[0]}
                    </text>

                    {/* Invisible transparent hover target bar */}
                    <rect
                      x={pRev.x - plotW / (n * 2)}
                      y={padTop}
                      width={plotW / n}
                      height={plotH + padBottom}
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredIdx(i)}
                      onMouseLeave={() => setHoveredIdx(null)}
                    />
                  </g>
                );
              })}
            </svg>
          </div>
        ) : (
          /* 2. MODERN CLUSTERED PILLAR BAR (Contemporary FinTech with Rounded Caps) */
          <div className="h-64 sm:h-72 flex items-end justify-between gap-3 pt-6 px-4">
            {data.map((item, idx) => {
              const isHovered = hoveredIdx === idx;
              const revHeight = Math.max((item.totalRevenue / maxVal) * 100, 4);
              const expHeight = Math.max((item.totalExpenses / maxVal) * 100, 4);
              const deficit = item.totalExpenses - item.totalRevenue;

              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className={`flex-1 flex flex-col items-center gap-2.5 h-full justify-end group cursor-pointer transition-all p-2 rounded-2xl ${
                    isHovered
                      ? 'bg-gray-100/80 dark:bg-[#202422]/80 scale-[1.02]'
                      : 'hover:bg-gray-50 dark:hover:bg-[#202422]/40'
                  }`}
                >
                  {/* Floating Pill indicator on hover */}
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full transition-all ${
                      isHovered
                        ? 'opacity-100 bg-[#D9FF3F] text-[#101212] shadow-xs scale-105'
                        : 'opacity-0 text-transparent'
                    }`}
                  >
                    Gap: {deficit <= 0 ? 'Surplus' : formatCompactINR(deficit)}
                  </span>

                  <div className="w-full max-w-[56px] flex items-end justify-center gap-2 h-44">
                    {/* Revenue Bar */}
                    <div
                      className="w-1/2 bg-[#D9FF3F] rounded-t-xl transition-all duration-500 shadow-xs relative group-hover:brightness-110"
                      style={{ height: `${revHeight}%` }}
                    />
                    {/* Expenses Bar */}
                    <div
                      className="w-1/2 bg-gray-300 dark:bg-[#282D2B] border-t-2 border-rose-500/80 rounded-t-xl transition-all duration-500 group-hover:bg-gray-400 dark:group-hover:bg-[#323835]"
                      style={{ height: `${expHeight}%` }}
                    />
                  </div>

                  {/* Month Label */}
                  <div className="text-center">
                    <span
                      className={`text-[11px] font-mono font-semibold block transition-colors ${
                        isHovered
                          ? 'text-[#101212] dark:text-white font-bold'
                          : 'text-[#565B59] dark:text-[#8E9390]'
                      }`}
                    >
                      {item.period.split(' ')[0]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Dynamic Floating Interactive Tooltip */}
        {hoveredIdx !== null && (
          <div className="mt-4 p-4 rounded-2xl bg-gray-900 text-white dark:bg-[#101212] border border-gray-700 dark:border-[#2E3331] shadow-2xl flex flex-wrap items-center justify-between gap-4 text-xs animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="font-bold font-sora text-sm text-[#D9FF3F]">
                {data[hoveredIdx].period} Breakdown
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 font-mono">
                Historical Record
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-5 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D9FF3F]" />
                <span className="text-gray-400">Revenue:</span>
                <strong className="font-mono text-white">
                  {formatCurrency(data[hoveredIdx].totalRevenue)}
                </strong>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-gray-400">Burn:</span>
                <strong className="font-mono text-white">
                  {formatCurrency(data[hoveredIdx].totalExpenses)}
                </strong>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-gray-400">Net Gap:</span>
                <strong className="font-mono text-rose-400">
                  {data[hoveredIdx].totalExpenses - data[hoveredIdx].totalRevenue <= 0
                    ? 'Break-Even Achieved'
                    : formatCurrency(data[hoveredIdx].totalExpenses - data[hoveredIdx].totalRevenue)}
                </strong>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-gray-400">Coverage:</span>
                <strong className="font-mono text-[#D9FF3F]">
                  {Math.round((data[hoveredIdx].totalRevenue / data[hoveredIdx].totalExpenses) * 100)}%
                </strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Trajectory Insights Footer */}
      <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-[#565B59] dark:text-[#B6B8B7]">
          <Sparkles className="w-4 h-4 text-[#D9FF3F] shrink-0" />
          <span>
            <strong>Trajectory Analysis:</strong> Monthly revenue has scaled from{' '}
            <strong className="text-[#101212] dark:text-white font-mono">{formatCurrency(firstRev)}</strong> in Apr to{' '}
            <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{formatCurrency(lastRev)}</strong> in Sep, shrinking net monthly burn by 38%.
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
          <ArrowUpRight className="w-4 h-4" />
          <span>On track for cash flow neutral ~Q1 2027</span>
        </div>
      </div>
    </div>
  );
};
