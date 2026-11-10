/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ALL_INDIAN_COMPANIES, 
  AGGREGATE_500CR_BENCHMARK, 
  IndianCompany 
} from './data/indianCompanies';
import { DualAxisFinancialChart } from './components/DualAxisFinancialChart';
import { FinancialMetricsCards } from './components/FinancialMetricsCards';
import { CompanySelector } from './components/CompanySelector';
import { QuarterlyDataTable } from './components/QuarterlyDataTable';
import { AllCompaniesAnalytics } from './components/AllCompaniesAnalytics';
import { MultiCompanyComparison } from './components/MultiCompanyComparison';
import { exportToCsv } from './utils/formatters';
import { 
  TrendingUp, 
  Download, 
  Briefcase,
  Layers,
  BarChart3,
  Building2,
  Calendar
} from 'lucide-react';

export default function App() {
  // Universe of all companies including the >500 Cr composite benchmark
  const allCompanyOptions = [AGGREGATE_500CR_BENCHMARK, ...ALL_INDIAN_COMPANIES];

  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('reliance');
  const [timeframe, setTimeframe] = useState<'4Q' | '8Q' | '12Q'>('12Q');
  const [minMarketCapCr, setMinMarketCapCr] = useState<number>(500);

  const selectedCompany: IndianCompany = 
    allCompanyOptions.find(c => c.id === selectedCompanyId) || ALL_INDIAN_COMPANIES[0];

  const latestRecord = selectedCompany.quarterlyData[selectedCompany.quarterlyData.length - 1];

  const handleGlobalExport = () => {
    const rows: Record<string, any>[] = [];
    ALL_INDIAN_COMPANIES.forEach(comp => {
      comp.quarterlyData.forEach(q => {
        rows.push({
          Company: comp.name,
          Symbol: comp.symbol,
          Sector: comp.sector,
          Category: comp.category,
          Quarter: q.quarter,
          'Period Ended': q.periodEnded,
          'Fiscal Year': q.financialYear,
          'Market Cap (INR Cr)': q.marketCapCr,
          'Quarterly PAT (INR Cr)': q.patCr,
          'Quarterly Revenue (INR Cr)': q.revenueCr,
          'PAT Margin (%)': q.patMarginPct,
          'Share Price (INR)': q.sharePriceInr,
          Note: q.eventNote || '',
        });
      });
    });
    exportToCsv('Indian_Public_Companies_Quarterly_PAT_MarketCap_Above_500Cr.csv', rows);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 1. TOP BAR CONTRACT (§2) */}
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Brand Wordmark (Single text element) */}
          <a
            href="/"
            className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-2"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/80" />
            <span>Bharat Quarterly PAT & MarketCap Analytics</span>
          </a>

          {/* Zone 2: Clean 4-5 Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <a href="#chart-section" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Quarterly Chart
            </a>
            <a href="#analyze-all-section" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Analyse All (&gt;500 Cr)
            </a>
            <a href="#companies-section" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Company Universe
            </a>
            <a href="#matrix-section" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Comparison Matrix
            </a>
            <a href="#ledger-section" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Quarterly Ledger
            </a>
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleGlobalExport}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export All &gt;500 Cr Data</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Editorial Context Banner */}
        <div className="border-b border-slate-800/80 pb-6">
          <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
            <span>NSE & BSE Indian Listed Universe</span>
            <span aria-hidden="true">·</span>
            <span>Market Capitalisation &gt; ₹500 Cr</span>
            <span aria-hidden="true">·</span>
            <span>Quarterly Audited Financial Filings (Q1 FY24 – Q4 FY26)</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight mt-2 text-balance">
            Quarterly PAT & Market Capitalisation of Indian Companies
          </h1>

          <p className="mt-2 text-sm sm:text-base text-slate-400 max-w-3xl leading-relaxed">
            Correlating quarterly audited bottom-line profitability with public equity valuation across all companies exceeding ₹500 Crore market cap. The graph plots{' '}
            <strong className="text-emerald-400 font-semibold">Quarterly PAT (Profit After Tax) in green</strong> on the right
            Y-axis alongside{' '}
            <strong className="text-blue-400 font-semibold">Market Capitalisation in blue</strong> on the left Y-axis
            across 3 fiscal years of reporting quarters on the X-axis.
          </p>
        </div>

        {/* Financial KPI Summary Cards */}
        <section aria-label="Key Performance Indicators">
          <FinancialMetricsCards 
            company={selectedCompany} 
            currentRecord={latestRecord} 
          />
        </section>

        {/* Main Dual-Axis Graph Section with Quarters on X */}
        <section id="chart-section" aria-label="Dual-Axis Quarterly Graph">
          <DualAxisFinancialChart
            companyName={selectedCompany.name}
            symbol={selectedCompany.symbol}
            sector={selectedCompany.sector}
            category={selectedCompany.category}
            data={selectedCompany.quarterlyData}
            timeframe={timeframe}
            onTimeframeChange={setTimeframe}
          />
        </section>

        {/* Comprehensive "Analyse All Companies > 500 Cr" Section */}
        <section id="analyze-all-section" aria-label="Analyze All Companies Above 500 Cr">
          <AllCompaniesAnalytics
            companies={ALL_INDIAN_COMPANIES}
            onSelectCompany={setSelectedCompanyId}
            selectedCompanyId={selectedCompanyId}
          />
        </section>

        {/* Company Quick Selector with > 500 Cr threshold */}
        <section id="companies-section" aria-label="Select Company">
          <CompanySelector
            companies={allCompanyOptions}
            selectedCompanyId={selectedCompanyId}
            onSelectCompany={setSelectedCompanyId}
            minMarketCapCr={minMarketCapCr}
            onMinMarketCapChange={setMinMarketCapCr}
          />
        </section>

        {/* Cross-Tier Comparative Matrix */}
        <section id="matrix-section" aria-label="Cross-Company Matrix">
          <MultiCompanyComparison
            companies={ALL_INDIAN_COMPANIES}
            onSelectCompany={setSelectedCompanyId}
          />
        </section>

        {/* Detailed Quarterly Ledger Table */}
        <section id="ledger-section" aria-label="Quarterly Financial Ledger">
          <QuarterlyDataTable
            companyName={selectedCompany.name}
            symbol={selectedCompany.symbol}
            data={selectedCompany.quarterlyData}
          />
        </section>

        {/* Company Profile & Quarterly Methodology */}
        <section id="about-section" className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-400" />
                <span>{selectedCompany.name} — Corporate Profile</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedCompany.description}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Headquarters</span>
                  <span className="text-slate-200 font-medium">{selectedCompany.headquarters}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">BSE Scrip Code</span>
                  <span className="font-mono text-slate-200">{selectedCompany.bseCode}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">NSE Symbol</span>
                  <span className="font-mono text-slate-200">{selectedCompany.symbol}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Market Cap Category</span>
                  <span className="text-blue-300 font-medium">{selectedCompany.category}</span>
                </div>
              </div>
            </div>

            <div className="border-t md:border-t-0 md:border-l border-slate-800 md:pl-6 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Quarterly Reporting Cycle Rules
              </h4>
              <ul className="text-xs text-slate-400 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                  <span>
                    <strong className="text-slate-200">X-Axis (Quarters):</strong> Q1 (Apr-Jun), Q2 (Jul-Sep), Q3 (Oct-Dec), Q4 (Jan-Mar).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span>
                    <strong className="text-emerald-400">Green Y-Axis (PAT):</strong> Quarterly reported Profit After Tax in ₹ Crores.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                  <span>
                    <strong className="text-blue-400">Blue Y-Axis (Market Cap):</strong> Market Capitalisation in ₹ Crores / Lakh Crores.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <span>
                    <strong className="text-slate-200">Coverage:</strong> All companies with Market Cap &gt; ₹500 Cr across Mega, Large, Mid, and Small Cap tiers.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      {/* 3. CLEAN FOOTER */}
      <footer className="border-t border-slate-800 bg-slate-950 mt-12 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span>Bharat Quarterly PAT & MarketCap Analytics</span>
            <span aria-hidden="true">·</span>
            <span>Companies &gt; ₹500 Cr</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>Quarterly filings indexed to NSE/BSE disclosures</span>
            <span aria-hidden="true">·</span>
            <span>₹1 Lakh Cr = ₹1,00,000 Crore</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
