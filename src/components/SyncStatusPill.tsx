/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Top-Left Action Control for Live Market Data Synchronization.
 * Integrated seamlessly into the top header without overlapping any headings.
 * Displays:
 * 1. Manual refresh button with live spinning animation.
 * 2. Real-time last updated timestamp.
 * 3. Monthly auto-sync status (1st of every month) and data source explanation modal.
 */

import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, Clock, Calendar, Info, X, Database, ShieldCheck } from 'lucide-react';
import { 
  getLastSyncTimeDisplay, 
  getNextMonthlySyncDateDisplay,
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
  totalCompaniesCount,
}) => {
  const [displayTime, setDisplayTime] = useState<string>('Recent');
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);
  const [justCompleted, setJustCompleted] = useState<boolean>(false);

  useEffect(() => {
    setDisplayTime(getLastSyncTimeDisplay());
  }, [lastSyncedTimestamp]);

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

  const nextMonthlySync = getNextMonthlySyncDateDisplay();
  const isMonthlyDue = shouldPerformMonthlyAutoSync();

  return (
    <>
      {/* Top-Left Synchronization Control (Inline flex container - Guaranteed No Heading Overlap) */}
      <div 
        aria-label="Market Data Synchronization Control"
        className="flex items-center shrink-0"
      >
        <div className="flex items-center bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-full shadow-sm p-1 pl-1 pr-2 sm:pr-2.5 transition-all">
          
          {/* Manual Refresh Button */}
          <button
            onClick={handleRefreshClick}
            disabled={isSyncing}
            title="Click to fetch latest stock market data from Yahoo Finance"
            className={`p-1.5 sm:p-2 rounded-full transition-all flex items-center justify-center shrink-0 ${
              isSyncing 
                ? 'bg-blue-600 text-white cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-500 text-white active:scale-95 shadow-sm shadow-blue-500/20'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          </button>

          {/* Sync Status & Timestamp info */}
          <div className="flex items-center gap-1.5 sm:gap-2 px-1.5 sm:px-2 text-xs">
            {isSyncing ? (
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                <span className="text-blue-400 font-medium font-mono text-[11px] whitespace-nowrap">
                  Syncing...
                </span>
              </div>
            ) : justCompleted ? (
              <div className="flex items-center gap-1 text-emerald-400 font-medium text-[11px] whitespace-nowrap">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Updated!</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <div className="flex flex-col">
                  <span className="text-slate-200 font-semibold text-[11px] leading-tight whitespace-nowrap flex items-center gap-1">
                    <span>Live Synced</span>
                    {isMonthlyDue && (
                      <span className="text-[9px] px-1 py-0.2 bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                        1st Due
                      </span>
                    )}
                  </span>
                  <span className="text-slate-400 font-mono text-[10px] leading-tight whitespace-nowrap hidden sm:inline">
                    {displayTime}
                  </span>
                </div>
              </div>
            )}

            {/* Pipeline Info Trigger Button */}
            <button
              onClick={() => setShowInfoModal(true)}
              title="How market data is fetched and updated on the 1st of every month"
              className="text-slate-400 hover:text-slate-200 p-1 hover:bg-slate-800 rounded-full transition-colors ml-0.5"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Info Modal: Data Architecture & Schedule */}
      {showInfoModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowInfoModal(false)}
        >
          <div 
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative"
            onClick={e => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={() => setShowInfoModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Stock Market Data Pipeline &amp; Cadence
                </h3>
                <p className="text-xs text-slate-400">
                  Real-time Indian Equity Valuation (NSE &amp; BSE &gt; ₹500 Cr)
                </p>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-4 text-xs text-slate-300">
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-slate-200">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  <span>1. How Data is Obtained</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Market capitalization, regular share prices, and audited quarterly PAT are retrieved directly from <strong className="text-slate-200">Yahoo Finance (NSE &amp; BSE)</strong> via our dedicated server proxy. 
                  Market Capitalisation is normalized to <strong className="text-slate-200">₹ Crores</strong> (<span className="font-mono text-blue-300">₹ Cr = Raw INR / 10,000,000</span>) to correlate directly with audited bottom-line Profit After Tax.
                </p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-slate-200">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <span>2. Automated 1st of Every Month Update</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  The system detects when the calendar rolls over to the 1st of each month. On or after the 1st, an automated background synchronization updates valuation metrics for all <strong className="text-slate-200">{totalCompaniesCount}+ companies</strong>.
                </p>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/80">
                  <span className="text-slate-400">Next Scheduled Auto-Sync:</span>
                  <span className="font-mono font-medium text-emerald-400">{nextMonthlySync}</span>
                </div>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-slate-200">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>3. Manual Refresh On Demand</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  The <strong className="text-blue-400">top-left refresh button</strong> enables instant on-demand synchronization at any time during market hours to fetch the latest traded prices and current market cap.
                </p>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/80">
                  <span className="text-slate-400">Last Synced:</span>
                  <span className="font-mono text-slate-300">{displayTime}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <span className="text-[11px] text-slate-400">
                Source: NSE (.NS) &amp; BSE (.BO) Live Feeds
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowInfoModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowInfoModal(false);
                    handleRefreshClick();
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Now</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
