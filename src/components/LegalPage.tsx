/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  ArrowLeft,
  Scale,
  ShieldCheck,
  Mail,
  FileText,
  Lock,
} from 'lucide-react';

interface LegalPageProps {
  section: 'terms' | 'privacy';
  onSwitchSection: (section: 'terms' | 'privacy') => void;
  onBack: () => void;
  onOpenFeedback: () => void;
}

const CONTACT_EMAIL = 'support@bhartiyamarket.com';
const SITE_URL = 'https://bhartiyamarket.com';
const LAST_UPDATED = 'November 2026';

export const LegalPage: React.FC<LegalPageProps> = ({
  section,
  onSwitchSection,
  onBack,
  onOpenFeedback,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Return Breadcrumb & Section Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Market Dashboard</span>
        </button>

        <div
          role="tablist"
          aria-label="Legal sections"
          className="inline-flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1 gap-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={section === 'terms'}
            onClick={() => onSwitchSection('terms')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              section === 'terms'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span>Terms &amp; Conditions</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={section === 'privacy'}
            onClick={() => onSwitchSection('privacy')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              section === 'privacy'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span>Privacy Policy</span>
          </button>
        </div>
      </div>

      {/* TERMS AND CONDITIONS */}
      {section === 'terms' && (
        <article
          aria-labelledby="terms-heading"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 lg:p-10 space-y-6 shadow-sm dark:shadow-none transition-colors"
        >
          <header className="space-y-1.5 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-400">
              <Scale className="w-4 h-4 shrink-0" />
              <span>Legal Terms · India</span>
            </div>
            <h1
              id="terms-heading"
              className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white"
            >
              Terms and Conditions
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Last Updated: {LAST_UPDATED} · Operated by Bhartiya Market (New Delhi, India)
            </p>
          </header>

          <div className="space-y-6 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            <p>
              Welcome to <strong>Bhartiya Market</strong> ({SITE_URL}), operated from New Delhi, India (&quot;we&quot;, &quot;our&quot;, or &quot;the Platform&quot;). By accessing or using this website, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, please discontinue using the website immediately.
            </p>

            <section className="space-y-2.5">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                1. Purpose, SEBI Non-Registration &amp; No Investment Advice
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Educational &amp; Informational Purpose Only:</strong> Bhartiya Market is a free public fundamental analysis and financial screening utility displaying historical company financials, revenues, Profit After Tax (PAT), market capitalization, peer comparisons, and standard ratios strictly for educational study and general informational reference.
                </li>
                <li>
                  <strong>Not Registered with SEBI:</strong> Neither Bhartiya Market nor its owners, developers, or contributors are registered with the Securities and Exchange Board of India (SEBI) as an Investment Adviser (IA), Research Analyst (RA), Portfolio Manager, or Stock Broker under any SEBI regulations.
                </li>
                <li>
                  <strong>No Stock Recommendations or Favouritism:</strong> We do <strong>not</strong> favour, endorse, promote, or recommend any specific stock, listed company, or industry. No chart, financial ratio, table, default company view, or peer comparison output constitutes a buy, sell, or hold signal, target price, research report, or solicitation to buy or sell any security.
                </li>
                <li>
                  <strong>Market Risk &amp; Independent Advice:</strong> Equity and securities investments are inherently subject to market risks, price volatility, and potential loss of capital. Past performance is not indicative of future results. You are solely responsible for your investment decisions and must consult a SEBI-registered investment adviser before acting on any information.
                </li>
              </ul>
            </section>

            <section className="space-y-2.5">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                2. Data Accuracy, Delays &amp; Third-Party Discrepancies (&quot;As-Is&quot; Basis)
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Third-Party Sources &amp; Delays:</strong> Financial metrics, share prices, quarterly/annual results, and valuation ratios displayed on Bhartiya Market are aggregated automatically from third-party public market feeds and exchange sources. Data may be delayed, estimated, rounded, unadjusted for splits/bonuses/corporate actions, or temporarily unavailable.
                </li>
                <li>
                  <strong>No Guarantee Against Errors or Wrong Information:</strong> Displayed figures may contain errors, omissions, stale entries, calculation or formatting glitches, or discrepancies when compared against official NSE/BSE filings, SEBI disclosures, or audited company financial statements.
                </li>
                <li>
                  <strong>Provided &quot;As-Is&quot; and &quot;As-Available&quot;:</strong> All website content, tools, and datasets are provided strictly on an <strong>&quot;AS-IS&quot;</strong> and <strong>&quot;AS-AVAILABLE&quot;</strong> basis without warranties of any kind—express or implied—including warranties of accuracy, completeness, reliability, timeliness, or fitness for a particular purpose. You must independently verify all numbers with official exchange filings (NSE/BSE) and company reports prior to making any financial decision.
                </li>
              </ul>
            </section>

            <section className="space-y-2.5">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                3. Free Access &amp; Voluntary Donations Policy
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Completely Free Platform:</strong> Bhartiya Market is 100% free to access with no paywalls, mandatory registrations, or paid subscription plans.
                </li>
                <li>
                  <strong>Voluntary, Non-Refundable Server Contributions:</strong> Any payments or contributions made via UPI or PhonePe through our Special Members page are strictly <strong>100% voluntary, non-refundable donations</strong> intended solely to help support server hosting, infrastructure, and maintenance costs.
                </li>
                <li>
                  <strong>No Goods, Tips, or Tax Exemption:</strong> Voluntary contributions do not purchase any premium research, stock tips, advisory services, special access, or contractual rights. Contributions made to Bhartiya Market are <strong>not</strong> tax-exempt charitable donations under Section 80G of the Income Tax Act, 1961.
                </li>
              </ul>
            </section>

            <section className="space-y-2.5">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                4. Limitation of Liability &amp; Indemnification
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>No Liability for Trading or Financial Losses:</strong> To the maximum extent permitted by applicable Indian law, Bhartiya Market and its operators shall under no circumstances be liable for any direct, indirect, incidental, consequential, special, exemplary, or punitive damages—including without limitation trading losses, investment losses, loss of profits, or loss of data—arising out of your access to, use of, inability to use, or reliance upon any delayed, incomplete, misleading, or inaccurate information displayed on this website.
                </li>
                <li>
                  <strong>Indemnification:</strong> You agree to indemnify, defend, and hold harmless Bhartiya Market, its founders, operators, and contributors from and against any claims, liabilities, damages, losses, and expenses (including reasonable legal fees) arising out of your use or misuse of the Platform, your investment or trading decisions, or your violation of these Terms and Conditions.
                </li>
              </ul>
            </section>

            <section className="space-y-2.5">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                5. Governing Law &amp; Exclusive Jurisdiction
              </h2>
              <p>
                These Terms and Conditions shall be governed by and construed in accordance with the laws of the <strong>Republic of India</strong>, without regard to conflict-of-law principles. Any dispute, claim, or legal proceeding arising out of or relating to the Platform shall be subject to the exclusive jurisdiction of the competent courts located in <strong>New Delhi, India</strong>.
              </p>
            </section>

            <section className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Questions or Data Discrepancy Reports
              </h2>
              <p>
                If you notice a financial data discrepancy or have a legal inquiry regarding these Terms, please contact us at{' '}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  {CONTACT_EMAIL}
                </a>{' '}
                or reach out through our{' '}
                <button
                  type="button"
                  onClick={onOpenFeedback}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
                >
                  Feedback page
                </button>
                .
              </p>
            </section>
          </div>
        </article>
      )}

      {/* PRIVACY POLICY (DPDP ACT, 2023 COMPLIANT) */}
      {section === 'privacy' && (
        <article
          aria-labelledby="privacy-heading"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 lg:p-10 space-y-6 shadow-sm dark:shadow-none transition-colors"
        >
          <header className="space-y-1.5 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>DPDP Act, 2023 Compliant · India</span>
            </div>
            <h1
              id="privacy-heading"
              className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white"
            >
              Privacy Policy
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Last Updated: {LAST_UPDATED} · Bhartiya Market ({SITE_URL})
            </p>
          </header>

          <div className="space-y-6 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            <p>
              <strong>Bhartiya Market</strong> respects your privacy and is committed to protecting personal data in accordance with India&apos;s{' '}
              <strong>Digital Personal Data Protection (DPDP) Act, 2023</strong> and applicable rules. This Privacy Policy explains what minimal data is processed when you browse or interact with {SITE_URL}.
            </p>

            <section className="space-y-2.5">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                1. Minimal Personal Data Collected
              </h2>
              <p>
                Bhartiya Market does not require user accounts or login to view financial charts and company metrics. We only process minimal information in the following limited circumstances:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Basic Technical &amp; Local Preferences:</strong> Standard server request metadata (such as temporary IP addresses and user-agent headers for rate limiting and security) and strictly functional browser local storage (such as saving your Light/Dark view preference and latest sync timestamp).
                </li>
                <li>
                  <strong>Voluntary Feedback Submissions:</strong> If you choose to submit feedback via our Feedback form, we collect your provided email ID or phone number, optional name, and your message solely to read and respond to your inquiry.
                </li>
                <li>
                  <strong>Optional Donations via Third-Party UPI / Payment Apps:</strong> When you voluntarily choose to support server costs through the Special Members page, payments are initiated and processed directly by external UPI apps or third-party payment providers (such as PhonePe, Google Pay, Paytm, or BHIM). Bhartiya Market does <strong>not</strong> collect, process, or store your bank account details, UPI PIN, or card numbers on its servers.
                </li>
              </ul>
            </section>

            <section className="space-y-2.5">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                2. Purpose, Storage, Security &amp; Your Rights Under DPDP Act, 2023
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>No Sale or Marketing Sharing:</strong> We <strong>never sell, rent, trade, or share</strong> your personal data with third-party marketers, advertisers, or data brokers. Data is used strictly for operating the Platform, improving technical stability, and replying to visitor feedback.
                </li>
                <li>
                  <strong>Data Security &amp; Retention:</strong> We apply reasonable technical safeguards, including HTTPS/TLS encrypted transport and restricted server access, and retain feedback records only for as long as reasonably necessary to address your inquiry or comply with Indian law.
                </li>
                <li>
                  <strong>Your Rights Under the DPDP Act, 2023:</strong> As a Data Principal in India, you have the right to:
                  <ul className="list-disc pl-5 mt-1.5 space-y-1">
                    <li>Request a summary of personal data processed about you and how it is used;</li>
                    <li>Request correction or updating of inaccurate personal data;</li>
                    <li>Request erasure/deletion of personal data you previously submitted (such as feedback contact records), subject to legal retention obligations; and</li>
                    <li>Seek grievance redressal regarding any privacy concern.</li>
                  </ul>
                </li>
              </ul>
            </section>

            <section className="space-y-2.5 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>3. Grievance Officer &amp; Legal Contact Details</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                For any questions regarding this Privacy Policy, requests for data access or deletion under the DPDP Act, 2023, financial data discrepancy reports, or legal notices, please contact our Grievance Officer:
              </p>
              <div className="text-xs sm:text-sm font-mono space-y-1 pt-1 text-slate-800 dark:text-slate-200">
                <div>
                  <span className="font-sans text-slate-500 dark:text-slate-400">Operator: </span>
                  <span>Bhartiya Market (New Delhi, India)</span>
                </div>
                <div>
                  <span className="font-sans text-slate-500 dark:text-slate-400">Email: </span>
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                  >
                    {CONTACT_EMAIL}
                  </a>
                </div>
                <div className="font-sans pt-1">
                  You may also send a request anytime via the{' '}
                  <button
                    type="button"
                    onClick={onOpenFeedback}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
                  >
                    Feedback page
                  </button>
                  .
                </div>
              </div>
            </section>
          </div>
        </article>
      )}
    </div>
  );
};
