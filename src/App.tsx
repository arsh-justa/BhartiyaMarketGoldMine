/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ALL_INDIAN_COMPANIES, 
  NSE_DEFAULT_BENCHMARK,
  IndianCompany,
  resolveOrGenerateCompany,
} from './data/indianCompanies';
import { DualAxisFinancialChart } from './components/DualAxisFinancialChart';
import { FinancialMetricsCards } from './components/FinancialMetricsCards';
import { CompanySelector } from './components/CompanySelector';
import { CompetitorComparison } from './components/CompetitorComparison';
import { AllCompaniesAnalytics } from './components/AllCompaniesAnalytics';
import { SyncStatusPill } from './components/SyncStatusPill';
import { SpecialMembersPage } from './components/SpecialMembersPage';
import { AboutUsPage } from './components/AboutUsPage';
import { FeedbackPage } from './components/FeedbackPage';
import { LegalPage } from './components/LegalPage';
import { 
  executeMarketSync, 
  fetchCompany10YHistory,
  shouldPerformMonthlyAutoSync,
  getLastSyncTimeDisplay
} from './utils/marketSync';
import { formatInrCrores } from './utils/formatters';
import { Heart, Search, X, Sun, Moon } from 'lucide-react';

type ActiveView = 'dashboard' | 'about' | 'members' | 'terms' | 'privacy' | 'feedback';
type ThemeMode = 'dark' | 'light';

const THEME_STORAGE_KEY = 'bhartiya_market_theme';

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY) === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });
  const [companies, setCompanies] = useState<IndianCompany[]>(ALL_INDIAN_COMPANIES);
  const [nseBenchmark, setNseBenchmark] = useState<IndianCompany>(NSE_DEFAULT_BENCHMARK);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('nse');
  const [periodType, setPeriodType] = useState<'quarterly' | 'yearly'>('quarterly');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>(() => getLastSyncTimeDisplay());
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');

  // Header search state
  const [headerSearch, setHeaderSearch] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage errors
    }
  }, [theme]);

  const selectedCompany: IndianCompany =
    selectedCompanyId === 'nse'
      ? nseBenchmark
      : companies.find(c => c.id === selectedCompanyId) || nseBenchmark;

  const currentRecord = periodType === 'yearly'
    ? selectedCompany.yearlyData[selectedCompany.yearlyData.length - 1]
    : selectedCompany.quarterlyData[selectedCompany.quarterlyData.length - 1];

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const headerSearchResults = useMemo(() => {
    const q = headerSearch.toLowerCase().trim();
    if (!q) return [];
    const qClean = q.replace(/[^a-z0-9]/g, '');
    const tokens = q.split(/\s+/).filter(Boolean);

    const searchableList = [nseBenchmark, ...companies];
    return searchableList
      .filter(c => {
        const sClean = c.symbol.toLowerCase().replace(/[^a-z0-9]/g, '');
        const nClean = c.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const isSymbolMatch = sClean === qClean || sClean.includes(qClean) || qClean.includes(sClean);
        const isFuzzyNameMatch =
          nClean.includes(qClean) ||
          qClean.includes(nClean) ||
          (qClean.includes('southindia') && nClean.includes('southindian'));

        const targetStr = `${c.name} ${c.symbol} ${c.bseCode} ${c.industry} ${c.sector}`.toLowerCase();
        const tokensMatch = tokens.every(tok => {
          const tClean = tok.replace(/[^a-z0-9]/g, '');
          if (!tClean) return true;
          return targetStr.includes(tClean) || (tClean === 'southindia' && targetStr.includes('south indian'));
        });

        return isSymbolMatch || isFuzzyNameMatch || tokensMatch;
      })
      .slice(0, 8);
  }, [headerSearch, companies, nseBenchmark]);

  const handleSelectCompanyAndLoadPage = (companyId: string) => {
    setSelectedCompanyId(companyId);
    setActiveView('dashboard');
    setIsSearchOpen(false);
    setHeaderSearch('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleHeaderSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = headerSearch.trim();
    if (!trimmed) return;

    if (headerSearchResults.length > 0) {
      handleSelectCompanyAndLoadPage(headerSearchResults[0].id);
      return;
    }

    const resolved = resolveOrGenerateCompany(trimmed);
    if (resolved) {
      if (resolved.id === 'nse') {
        handleSelectCompanyAndLoadPage('nse');
      } else {
        handleAddCustomCompany(resolved);
        handleSelectCompanyAndLoadPage(resolved.id);
      }
    }
  };

  const handleManualRefresh = async () => {
    setIsSyncing(true);
    try {
      const { updatedCompanies, result } = await executeMarketSync([nseBenchmark, ...companies]);
      const updatedNse = updatedCompanies.find(c => c.id === 'nse');
      const rest = updatedCompanies.filter(c => c.id !== 'nse');
      if (updatedNse) setNseBenchmark(updatedNse);
      setCompanies(rest);
      setLastSyncedTime(result.syncedAt);
    } catch (err) {
      console.error('Failed to sync market data:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Automated 1st of every month background check
  useEffect(() => {
    if (shouldPerformMonthlyAutoSync()) {
      handleManualRefresh();
    }
  }, []);

  // Fetch real 10-year historical series whenever selected company changes
  const fetchedHistorySymbolsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const targetSymbol = selectedCompany.symbol.toUpperCase();
    if (fetchedHistorySymbolsRef.current.has(targetSymbol)) return;
    fetchedHistorySymbolsRef.current.add(targetSymbol);

    let cancelled = false;
    fetchCompany10YHistory(selectedCompany)
      .then(enriched => {
        if (cancelled) return;
        if (enriched.id === 'nse' || enriched.symbol === 'NSE') {
          setNseBenchmark(enriched);
        } else {
          setCompanies(prev =>
            prev.map(c => (c.id === enriched.id || c.symbol === enriched.symbol ? enriched : c))
          );
        }
      })
      .catch(err => {
        console.warn(`10Y history lookup skipped for ${targetSymbol}:`, err?.message || err);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCompany.id, selectedCompany.symbol]);

  const handleAddCustomCompany = (newComp: IndianCompany) => {
    setCompanies(prev => {
      if (prev.find(c => c.id === newComp.id || c.symbol === newComp.symbol)) {
        return prev;
      }
      return [newComp, ...prev];
    });
    setSelectedCompanyId(newComp.id);
  };

  const handleOpenView = (view: ActiveView) => {
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateDashboardSection = (sectionId?: string, resetToNse: boolean = false) => {
    if (resetToNse) {
      setSelectedCompanyId('nse');
    }
    setActiveView('dashboard');
    if (sectionId) {
      requestAnimationFrame(() => {
        const target = document.getElementById(sectionId);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* 1. TOP NAVIGATION WITH INTEGRATED REFRESH, BRAND, SEARCH, NAV LINKS, SPECIAL MEMBERS & THEME TOGGLE */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-1.5 sm:px-4 lg:px-6 flex items-center justify-between gap-1 sm:gap-2.5 h-14 sm:h-16">
          {/* Top-Left: Manual Refresh Pill, Brand Wordmark & Right-Aligned Company Search */}
          <div className="flex-1 flex items-center gap-1 sm:gap-2.5 min-w-0">
            <SyncStatusPill 
              isSyncing={isSyncing}
              onManualRefresh={handleManualRefresh}
              lastSyncedTimestamp={lastSyncedTime}
              totalCompaniesCount={companies.length}
            />

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block shrink-0" />

            <button
              type="button"
              onClick={() => handleNavigateDashboardSection(undefined, true)}
              className="text-[11px] sm:text-base lg:text-[17px] font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
            >
              Bhartiya Market
            </button>

            {/* Header Search Option right-aligned after Bhartiya Market */}
            <div ref={searchContainerRef} className="relative hidden md:block md:ml-auto w-40 lg:w-56 xl:w-64">
              <form onSubmit={handleHeaderSearchSubmit}>
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={headerSearch}
                  onFocus={() => setIsSearchOpen(true)}
                  onChange={e => {
                    setHeaderSearch(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  placeholder="Search company"
                  aria-label="Search company on Bhartiya Market"
                  className={`w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-blue-500 rounded-lg pl-8 ${
                    headerSearch ? 'pr-7' : 'pr-3'
                  } py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-500 outline-none transition-colors`}
                />
                {headerSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setHeaderSearch('');
                      setIsSearchOpen(false);
                    }}
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>

              {isSearchOpen && headerSearch.trim().length > 0 && (
                <div className="absolute right-0 mt-1.5 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
                  {headerSearchResults.length > 0 ? (
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800/70">
                      {headerSearchResults.map(comp => {
                        const latest = comp.yearlyData[comp.yearlyData.length - 1];
                        return (
                          <button
                            key={comp.id}
                            type="button"
                            onClick={() => handleSelectCompanyAndLoadPage(comp.id)}
                            className="w-full text-left px-3.5 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                {comp.name}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                                <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">{comp.symbol}</span>
                                <span aria-hidden="true">·</span>
                                <span className="truncate">{comp.industry}</span>
                              </div>
                            </div>
                            <div className="text-right shrink-0 font-mono text-[11px]">
                              <div className="text-slate-800 dark:text-slate-200 font-semibold">
                                ₹{(latest?.sharePriceInr ?? 0).toLocaleString('en-IN')}
                              </div>
                              <div className="text-blue-600 dark:text-blue-400 text-[10px]">
                                {formatInrCrores(latest?.marketCapCr ?? 0, true)}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleHeaderSearchSubmit}
                      className="w-full text-left px-3.5 py-3 text-xs text-blue-600 dark:text-blue-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      Load &quot;{headerSearch.toUpperCase()}&quot; on Bhartiya Market
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Top-Right: Special Members followed by Dark/Light View Toggle */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0 ml-auto">
            <button
              type="button"
              onClick={() => handleOpenView('members')}
              aria-label="Special Members"
              title="Special Members"
              className={`p-1.5 sm:px-3 sm:py-2 text-xs font-semibold rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0 flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                activeView === 'members'
                  ? 'bg-slate-900 text-white dark:bg-slate-800 border border-slate-700'
                  : 'text-white bg-blue-600 hover:bg-blue-500'
              }`}
            >
              <Heart className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Special Members</span>
            </button>

            <div
              role="group"
              aria-label="Color theme toggle"
              className="inline-flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 shrink-0"
            >
              <button
                type="button"
                onClick={() => setTheme('light')}
                aria-pressed={theme === 'light'}
                aria-label="Switch to Light view"
                title="Light view"
                className={`inline-flex items-center gap-0.5 sm:gap-1 px-1 sm:px-2.5 py-1 sm:py-1.5 text-[9.5px] sm:text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  theme === 'light'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <Sun className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                aria-pressed={theme === 'dark'}
                aria-label="Switch to Dark view"
                title="Dark view"
                className={`inline-flex items-center gap-0.5 sm:gap-1 px-1 sm:px-2.5 py-1 sm:py-1.5 text-[9.5px] sm:text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <Moon className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span>Dark</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {activeView === 'members' && (
          <SpecialMembersPage onBack={() => handleNavigateDashboardSection()} />
        )}

        {activeView === 'about' && (
          <AboutUsPage
            onBack={() => handleNavigateDashboardSection()}
            onNavigateSpecialMembers={() => handleOpenView('members')}
          />
        )}

        {(activeView === 'terms' || activeView === 'privacy') && (
          <LegalPage
            section={activeView}
            onSwitchSection={sec => handleOpenView(sec)}
            onBack={() => handleNavigateDashboardSection()}
            onOpenFeedback={() => handleOpenView('feedback')}
          />
        )}

        {activeView === 'feedback' && (
          <FeedbackPage onBack={() => handleNavigateDashboardSection()} />
        )}

        {activeView === 'dashboard' && (
          <>
            {/* Mobile & small tablet search bar with live autocomplete */}
            <div className="md:hidden relative">
              <form onSubmit={handleHeaderSearchSubmit} className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={headerSearch}
                  onFocus={() => setIsSearchOpen(true)}
                  onChange={e => {
                    setHeaderSearch(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  placeholder="Search company"
                  aria-label="Search company on Bhartiya Market"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-blue-500 rounded-lg pl-8 pr-8 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-500 outline-none"
                />
                {headerSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setHeaderSearch('');
                      setIsSearchOpen(false);
                    }}
                    aria-label="Clear search"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>

              {isSearchOpen && headerSearch.trim().length > 0 && (
                <div className="mt-1.5 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden z-40">
                  {headerSearchResults.length > 0 ? (
                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800/70">
                      {headerSearchResults.map(comp => {
                        const latest = comp.yearlyData[comp.yearlyData.length - 1];
                        return (
                          <button
                            key={comp.id}
                            type="button"
                            onClick={() => handleSelectCompanyAndLoadPage(comp.id)}
                            className="w-full text-left px-3.5 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                {comp.name}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                                <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">{comp.symbol}</span>
                                <span aria-hidden="true">·</span>
                                <span className="truncate">{comp.industry}</span>
                              </div>
                            </div>
                            <div className="text-right shrink-0 font-mono text-[11px]">
                              <div className="text-slate-800 dark:text-slate-200 font-semibold">
                                ₹{(latest?.sharePriceInr ?? 0).toLocaleString('en-IN')}
                              </div>
                              <div className="text-blue-600 dark:text-blue-400 text-[10px]">
                                {formatInrCrores(latest?.marketCapCr ?? 0, true)}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleHeaderSearchSubmit}
                      className="w-full text-left px-3.5 py-3 text-xs text-blue-600 dark:text-blue-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      Load &quot;{headerSearch.toUpperCase()}&quot; on Bhartiya Market
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Active Company Title Strip directly after Header */}
            <section
              aria-label="Selected Company Heading"
              className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800/80"
            >
              <div className="flex flex-wrap items-baseline gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {selectedCompany.name}
                </h1>
                <span className="font-mono text-sm sm:text-base font-bold text-blue-600 dark:text-blue-400">
                  {selectedCompany.symbol}
                </span>
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span>{selectedCompany.sector}</span>
                <span aria-hidden="true">·</span>
                <span>{selectedCompany.industry}</span>
                {selectedCompany.bseCode !== 'NIFTY50' && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">BSE {selectedCompany.bseCode}</span>
                  </>
                )}
              </div>
            </section>

            {/* KPI Cards */}
            <section aria-label="Key Performance Indicators">
              <FinancialMetricsCards 
                company={selectedCompany} 
                currentRecord={currentRecord} 
                periodType={periodType}
                lastSyncedDisplay={lastSyncedTime}
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
                theme={theme}
              />
            </section>

            {/* Section: Competitors and Peers Comparison with Horizontal Bars (Collapsed by default) */}
            <section id="competitors-section" aria-label="Competitors and Peer Comparison">
              <CompetitorComparison
                currentCompany={selectedCompany}
                allCompanies={companies}
                onSelectCompany={handleSelectCompanyAndLoadPage}
                periodType={periodType}
              />
            </section>

            {/* Quick Company Selector */}
            <section id="select-section" aria-label="Select Company">
              <CompanySelector
                companies={companies}
                selectedCompanyId={selectedCompanyId}
                onSelectCompany={handleSelectCompanyAndLoadPage}
                periodType={periodType}
              />
            </section>

            {/* Section: Aggregate Analysis for All Companies > 500 Cr (Collapsed by default) */}
            <section id="all-companies-section" aria-label="Aggregate Analysis All Companies Above 500 Cr">
              <AllCompaniesAnalytics
                companies={companies}
                onSelectCompany={handleSelectCompanyAndLoadPage}
                selectedCompanyId={selectedCompanyId}
                periodType={periodType}
                onAddCustomCompany={handleAddCustomCompany}
              />
            </section>
          </>
        )}
      </main>

      {/* 3. CLEAN MINIMAL FOOTER (Feedback placed directly after Special Members) */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 mt-10 py-5 text-xs text-slate-600 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center gap-5">
          <button
            type="button"
            onClick={() => handleNavigateDashboardSection()}
            className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap cursor-pointer"
          >
            Market Dashboard
          </button>
          <button
            type="button"
            onClick={() => handleOpenView('about')}
            className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap cursor-pointer"
          >
            About Us
          </button>
          <button
            type="button"
            onClick={() => handleOpenView('members')}
            className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap cursor-pointer"
          >
            Special Members
          </button>
          <button
            type="button"
            onClick={() => handleOpenView('terms')}
            className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap cursor-pointer"
          >
            Terms &amp; Conditions
          </button>
          <button
            type="button"
            onClick={() => handleOpenView('privacy')}
            className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap cursor-pointer"
          >
            Privacy Policy
          </button>
          <button
            type="button"
            onClick={() => handleOpenView('feedback')}
            className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap cursor-pointer"
          >
            Feedback
          </button>
        </div>
      </footer>
    </div>
  );
}
