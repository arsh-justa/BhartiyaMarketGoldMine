/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Copy,
  Check,
  Smartphone,
  ExternalLink,
  QrCode,
  Clock,
} from 'lucide-react';

interface SpecialMembersPageProps {
  onBack: () => void;
}

const UPI_ID = 'tango596@ybl';
const PAYEE_NAME = 'Bhartiya Market';
const QR_IMAGE_PATH = '/assets/aistudio/tango596_b456670c.jpeg';
const MAX_SERVER_DAYS = 1000;

const UPI_QUERY = new URLSearchParams({
  pa: UPI_ID,
  pn: PAYEE_NAME,
  tn: 'Support Bhartiya Market',
  cu: 'INR',
}).toString();

const PHONEPE_URL = `phonepe://pay?${UPI_QUERY}`;
const UNIVERSAL_UPI_URL = `upi://pay?${UPI_QUERY}`;

/**
 * Bar color rules across 1000 days:
 * - < 60 days: Red
 * - 60 to 180 days: Red transitioning to Yellow
 * - 180 to 300 days: Yellow
 * - 300 to 600 days: Green
 * - 600 to 1000 days: Darker Green
 */
function getTimeBarColorStyle(days: number): React.CSSProperties {
  if (days < 60) {
    return { backgroundColor: '#ef4444' };
  }
  if (days < 180) {
    return { background: 'linear-gradient(90deg, #ef4444 0%, #f59e0b 55%, #eab308 100%)' };
  }
  if (days < 300) {
    return { backgroundColor: '#eab308' };
  }
  if (days < 600) {
    return { backgroundColor: '#22c55e' };
  }
  return { backgroundColor: '#15803d' };
}

export const SpecialMembersPage: React.FC<SpecialMembersPageProps> = ({ onBack }) => {
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [qrLoadError, setQrLoadError] = useState<boolean>(false);
  const [serverDays, setServerDays] = useState<number>(100);
  const [isUpdatingDays, setIsUpdatingDays] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    fetch('/api/server-time')
      .then(res => res.json())
      .then(data => {
        if (active && typeof data?.daysRemaining === 'number') {
          setServerDays(data.daysRemaining);
        }
      })
      .catch(() => {
        // Keep fallback value if offline
      });
    return () => {
      active = false;
    };
  }, []);

  const handleExtendServerTime = async () => {
    if (isUpdatingDays) return;
    setIsUpdatingDays(true);
    try {
      const res = await fetch('/api/server-time/extend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: 1 }),
        keepalive: true,
      });
      const data = await res.json();
      if (typeof data?.daysRemaining === 'number') {
        setServerDays(data.daysRemaining);
      }
    } catch {
      setServerDays(prev => Math.min(MAX_SERVER_DAYS, prev + 1));
    } finally {
      setIsUpdatingDays(false);
    }
  };

  const handleCopyUpi = async () => {
    try {
      await navigator.clipboard.writeText(UPI_ID);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2200);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = UPI_ID;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopiedUpi(true);
        setTimeout(() => setCopiedUpi(false), 2200);
      } finally {
        document.body.removeChild(textArea);
      }
    }
  };

  const barPct = Math.max(0, Math.min(100, (serverDays / MAX_SERVER_DAYS) * 100));
  const barColorStyle = getTimeBarColorStyle(serverDays);

  return (
    <div className="space-y-6">
      {/* Top Return Breadcrumb */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Market Dashboard</span>
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>Bhartiya Market</span>
          <span aria-hidden="true">·</span>
          <span>Special Members</span>
        </div>
      </div>

      {/* Centered Focal Payment & Server Time Card */}
      <section
        aria-label="Buy some server time via PhonePe UPI"
        className="max-w-xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm dark:shadow-none transition-colors"
      >
        {/* Above QR Code: "Support Us" heading + "Buy some server time" + 1000-Day Horizontal Bar */}
        <div className="space-y-3 pb-5 border-b border-slate-200 dark:border-slate-800">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Support Us
          </h1>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base sm:text-lg font-semibold tracking-tight text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>Buy some server time</span>
            </h2>
          </div>

          {/* 1000-Day Horizontal Progress Bar */}
          <div
            role="progressbar"
            aria-valuenow={serverDays}
            aria-valuemin={0}
            aria-valuemax={MAX_SERVER_DAYS}
            aria-label="Server time remaining"
            className="w-full h-3.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-full overflow-hidden"
          >
            <div
              className="h-full transition-all duration-300 rounded-full"
              style={{
                width: `${Math.max(serverDays > 0 ? 2 : 0, barPct)}%`,
                ...barColorStyle,
              }}
            />
          </div>

          <div className="flex items-center justify-end">
            <span className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-400">
              2 years
            </span>
          </div>
        </div>

        {/* Clickable PhonePe QR Code Frame */}
        <div className="flex flex-col items-center space-y-4">
          <a
            href={PHONEPE_URL}
            onClick={handleExtendServerTime}
            aria-label="Scan QR code or click to redirect to PhonePe and pay"
            className="group block w-full max-w-[270px] bg-white border border-slate-200 dark:border-transparent rounded-xl p-4 shadow-sm hover:ring-2 hover:ring-blue-500 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {!qrLoadError ? (
              <img
                src={QR_IMAGE_PATH}
                alt="PhonePe UPI QR code for tango596@ybl - Bhartiya Market"
                referrerPolicy="no-referrer"
                onError={() => setQrLoadError(true)}
                className="w-full aspect-square object-contain rounded-lg"
              />
            ) : (
              <div className="w-full aspect-square rounded-lg bg-slate-100 flex flex-col items-center justify-center p-4 text-center text-slate-700 gap-2">
                <QrCode className="w-10 h-10 text-slate-500" />
                <span className="text-xs font-semibold">PhonePe UPI</span>
                <span className="text-xs font-mono text-slate-600">{UPI_ID}</span>
              </div>
            )}

            <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">
              <Smartphone className="w-3.5 h-3.5 shrink-0" />
              <span>Scan with PhonePe or Tap QR to Pay</span>
            </div>
          </a>

          {/* Copyable UPI ID Line */}
          <div className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
            <div className="min-w-0">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">UPI ID</span>
              <span className="text-xs sm:text-sm font-mono font-semibold text-slate-900 dark:text-white truncate block">
                {UPI_ID}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCopyUpi}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-transparent text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {copiedUpi ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-700 dark:text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy ID</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Primary PhonePe Redirect CTA + Universal UPI App Link */}
        <div className="space-y-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
          <a
            href={PHONEPE_URL}
            onClick={handleExtendServerTime}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 active:scale-[0.99] rounded-xl shadow-sm transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            <Smartphone className="w-4 h-4 shrink-0" />
            <span>Open PhonePe &amp; Pay</span>
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          </a>

          <div className="text-center">
            <a
              href={UNIVERSAL_UPI_URL}
              onClick={handleExtendServerTime}
              className="inline-flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors underline underline-offset-4"
            >
              <span>Or pay using any UPI app (GPay, Paytm, BHIM)</span>
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
