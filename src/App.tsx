/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ALL_INDIAN_COMPANIES, 
  IndianCompany 
} from './data/indianCompanies';
import { DualAxisFinancialChart } from './components/DualAxisFinancialChart';
import { FinancialMetricsCards } from './components/FinancialMetricsCards';
import { CompanySelector } from './components/CompanySelector';
import { CompetitorComparison } from './components/CompetitorComparison';
import { AllCompaniesAnalytics } from './components/AllCompaniesAnalytics';
import { exportToCsv } from './utils/formatters';
import { Download } from 'lucide-react';

export default function App() {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('reliance');
  const [periodType, setPeriodType] = useState<'quarterly' | 'yearly'>('quarterly');

  const selectedCompany: IndianCompany = 
    ALL_INDIAN_COMPANIES.find(c => c.id === selectedCompanyId) || ALL_INDIAN_COMPANIES[0];

  const currentRecord = periodType === 'yearly'
    ? selectedCompany.yearlyData[selectedCompany.yearlyData.length - 1]
    : selectedCompany.quarterlyData[selectedCompany.quarterlyData.length - 1];

  const handleGlobalExport = () => {
    const rows: Record<string, any>[] = [];
    ALL_INDIAN_COMPANIES.forEach(comp => {
      const records = periodType === 'yearly' ? comp.yearlyData : comp.quarterlyData;
      records.forEach(r => {
        rows.push({
          Company: comp.name,
          Symbol: comp.symbol,
          Sector: comp.sector,
          Industry: comp.industry,
          Category: comp.category,
          Period: r.period,
          Label: r.label,
          'Market Cap (INR Cr)': r.marketCapCr,
          'PAT (INR Cr)': r.patCr,
          'Revenue (INR Cr)': r.revenueCr,
          'PAT Margin (%)': r.patMarginPct,
          'Share Price (INR)': r.sharePriceInr,
          Note: r.eventNote || '',
        });
      });
    });
    exportToCsv(`Indian_Listed_Companies_${periodType.toUpperCase()}_PAT_MarketCap.csv`, rows);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 1. TOP NAVIGATION */}
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-8 h-16">
          <a
            href="/"
            className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-2"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/80" />
            <span>Bharat PAT &amp; MarketCap Analytics</span>
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <a href="#chart-section" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Interactive Chart
            </a>
            <a href="#competitors-section" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Competitor Benchmark
            </a>
            <a href="#all-companies-section" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              All Companies (&gt; ₹500 Cr)
            </a>
            <a href="#select-section" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Company Switcher
            </a>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleGlobalExport}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Dataset ({periodType === 'yearly' ? 'Yearly' : 'Quarterly'})</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* KPI Cards */}
        <section aria-label="Key Performance Indicators">
          <FinancialMetricsCards 
            company={selectedCompany} 
            currentRecord={currentRecord} 
            periodType={periodType}
          />
        </section>

        {/* Core Dual-Axis Financial Chart with Yearly / Quarterly toggle */}
        <section id="chart-section" aria-label="Financial Chart">
          <DualAxisFinancialChart
            companyName={selectedCompany.name}
            symbol={selectedCompany.symbol}
            sector={selectedCompany.sector}
            periodType={periodType}
            onPeriodTypeChange={setPeriodType}
            quarterlyData={selectedCompany.quarterlyData}
            yearlyData={selectedCompany.yearlyData}
          />
        </section>

        {/* Section: Competitors and Peers Comparison with Horizontal Bars */}
        <section id="competitors-section" aria-label="Competitors and Peer Comparison">
          <CompetitorComparison
            currentCompany={selectedCompany}
            allCompanies={ALL_INDIAN_COMPANIES}
            onSelectCompany={setSelectedCompanyId}
            periodType={periodType}
          />
        </section>

        {/* Section: Aggregate Analysis for All Companies > 500 Cr with full real-time search */}
        <section id="all-companies-section" aria-label="Aggregate Analysis All Companies Above 500 Cr">
          <AllCompaniesAnalytics
            companies={ALL_INDIAN_COMPANIES}
            onSelectCompany={setSelectedCompanyId}
            selectedCompanyId={selectedCompanyId}
            periodType={periodType}
          />
        </section>

        {/* Quick Company Selector */}
        <section id="select-section" aria-label="Select Company">
          <CompanySelector
            companies={ALL_INDIAN_COMPANIES}
            selectedCompanyId={selectedCompanyId}
            onSelectCompany={setSelectedCompanyId}
            periodType={periodType}
          />
        </section>
      </main>

      {/* 3. CLEAN MINIMAL FOOTER */}
      <footer className="border-t border-slate-800 bg-slate-950 mt-10 py-5 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>Bharat PAT &amp; MarketCap Analytics · Publicly Listed Indian Companies</span>
          <span className="text-slate-400 font-mono">Market Cap &gt; ₹500 Cr Universe</span>
        </div>
      </footer>
    </div>
  );
}
