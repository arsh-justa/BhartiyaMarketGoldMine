/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Top-Left Action Control for Live Market Data Synchronization.
 * Integrated seamlessly into the top header without overlapping any headings.
 */

import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, CheckCircle2, Info } from 'lucide-react';
import { 
  getLastSyncTimeDisplay, 
  shouldPerformMonthlyAutoSync
} from '../utils/marketSync';

interface SyncStatusPillProps {
  isSyncing: boolean;
  onManualRefresh: () => Promise<void>;
  lastSyncedTimestamp?: string;
  totalCompaniesCount: number;
}

export const SyncStatusPill: React.FC<SyncStatusPillProps> = ({
  isSyncing,
  onManualRefresh,
  lastSyncedTimestamp,
}) => {
  const [displayTime, setDisplayTime] = useState<string>('Recent');
  const [showInfoTooltip, setShowInfoTooltip] = useState<boolean>(false);
  const [justCompleted, setJustCompleted] = useState<boolean>(false);
  const infoWrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setDisplayTime(getLastSyncTimeDisplay());
  }, [lastSyncedTimestamp]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (infoWrapperRef.current && !infoWrapperRef.current.contains(e.target as Node)) {
        setShowInfoTooltip(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleRefreshClick = async () => {
    if (isSyncing) return;
    try {
      await onManualRefresh();
      setJustCompleted(true);
      setDisplayTime(getLastSyncTimeDisplay());
      setTimeout(() => setJustCompleted(false), 3000);
    } catch {
      setJustCompleted(false);
    }
  };

  const isMonthlyDue = shouldPerformMonthlyAutoSync();

  return (
    <div 
      aria-label="Market Data Synchronization Control"
      className="flex items-center shrink-0"
    >
      <div className="flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-full shadow-sm p-0.5 pr-1 sm:p-1 sm:pr-2 transition-all">
        {/* Manual Refresh Button */}
        <button
          type="button"
          onClick={handleRefreshClick}
          disabled={isSyncing}
          aria-label="Sync latest stock market data"
          title="Click to sync latest stock market data"
          className={`p-1 sm:p-1.5 rounded-full transition-all flex items-center justify-center shrink-0 ${
            isSyncing 
              ? 'bg-blue-600 text-white cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-500 text-white active:scale-95 shadow-sm shadow-blue-500/20'
          }`}
        >
          <RefreshCw className={`w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
        </button>

        {/* Sync Status & Timestamp info */}
        <div className="flex items-center gap-0.5 sm:gap-1.5 pl-1 sm:pl-1.5 text-xs">
          {isSyncing ? (
            <div className="flex items-center gap-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
              </span>
              <span className="text-blue-600 dark:text-blue-400 font-medium font-mono text-[9.5px] sm:text-[11px] whitespace-nowrap">
                Syncing...
              </span>
            </div>
          ) : justCompleted ? (
            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium text-[9.5px] sm:text-[11px] whitespace-nowrap">
              <CheckCircle2 className="w-3 h-3 shrink-0" />
              <span>Updated!</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <div className="flex flex-col">
                <span className="text-slate-800 dark:text-slate-200 font-semibold text-[9.5px] sm:text-[11px] leading-tight whitespace-nowrap flex items-center gap-1 tracking-tight sm:tracking-normal">
                  <span>Live Synced</span>
                  {isMonthlyDue && (
                    <span className="hidden sm:inline text-[9px] px-1 py-0.2 bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 rounded border border-amber-300 dark:border-amber-500/30">
                      1st Due
                    </span>
                  )}
                </span>
                <span className="text-slate-500 dark:text-slate-400 font-mono text-[9px] leading-tight whitespace-nowrap hidden lg:inline">
                  {displayTime}
                </span>
              </div>
            </div>
          )}

          {/* Small Bottom Tooltip on Info Icon */}
          <div
            ref={infoWrapperRef}
            className="relative flex items-center"
            onMouseEnter={() => setShowInfoTooltip(true)}
            onMouseLeave={() => setShowInfoTooltip(false)}
          >
            <button
              type="button"
              onClick={() => setShowInfoTooltip(prev => !prev)}
              onFocus={() => setShowInfoTooltip(true)}
              onBlur={() => setShowInfoTooltip(false)}
              aria-label="Sync info"
              className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 p-0.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            >
              <Info className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
            </button>

            {showInfoTooltip && (
              <div
                role="tooltip"
                className="absolute top-full left-[-3.5rem] sm:left-1/2 sm:-translate-x-1/2 mt-2 w-48 px-2.5 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-800 text-white text-[11px] leading-snug border border-slate-700 shadow-lg z-50 pointer-events-none text-center"
              >
                Data can be synced by clicking on the refresh icon.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
