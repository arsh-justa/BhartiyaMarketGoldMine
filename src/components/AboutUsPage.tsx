/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ArrowLeft, Flag, ArrowRight } from 'lucide-react';

interface AboutUsPageProps {
  onBack: () => void;
  onNavigateSpecialMembers: () => void;
}

const ABOUT_IMAGE_PATH = '/assets/aistudio/image_8226600f.png';

export const AboutUsPage: React.FC<AboutUsPageProps> = ({
  onBack,
  onNavigateSpecialMembers,
}) => {
  const [imageError, setImageError] = useState(false);

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
          <span>About Us</span>
        </div>
      </div>

      {/* Balanced Two-Column Editorial Feature */}
      <article className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-none transition-colors">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          {/* Visual Column */}
          <div className="lg:col-span-5 relative min-h-[280px] lg:min-h-full bg-slate-100 dark:bg-slate-950">
            {!imageError ? (
              <img
                src={ABOUT_IMAGE_PATH}
                alt="Citizens raising the Indian Tricolor together in unity and pride"
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
                className="w-full h-full object-cover lg:h-full"
              />
            ) : (
              <div className="w-full h-full min-h-[280px] bg-gradient-to-br from-amber-100 via-white to-emerald-100 dark:from-amber-950/60 dark:via-slate-900 dark:to-emerald-950/60 flex flex-col items-center justify-center p-8 text-center gap-3">
                <Flag className="w-10 h-10 text-amber-600 dark:text-amber-400" />
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Building India&apos;s Future Together
                </p>
              </div>
            )}
          </div>

          {/* Editorial Copy Column */}
          <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-center space-y-6">
            <div className="space-y-3">
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                Our Purpose
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white [text-wrap:balance]">
                It Is Time for Indians to Invest in India
              </h1>
            </div>

            <div className="space-y-4 text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed max-w-2xl">
              <p>
                For far too long, global markets have overlooked and undervalued India&apos;s true potential. Yet across every sector, from banking, technology, and manufacturing to energy and infrastructure, Indian enterprises are building the backbone of tomorrow&apos;s world. This is our moment to recognize our own strength first and stand firmly behind the businesses shaping our nation&apos;s future.
              </p>

              <p>
                When you study the fundamentals and choose to invest in the right Indian companies, your capital becomes more than just numbers on a screen. It funds factories, creates dignified livelihoods, inspires innovation, and builds enduring prosperity, creating meaningful wealth not only for your family&apos;s dreams, but for the progress of the entire nation.{' '}
                <strong className="text-slate-900 dark:text-white font-semibold">
                  Let&apos;s build our country together.
                </strong>
              </p>

              <p>
                Honest, accessible financial clarity should never be locked behind expensive walls. Every chart and comparison on Bhartiya Market exists to empower everyday Indian investors to look past short-term noise and back deserving companies with conviction. Your encouragement and generosity keep this mission alive. If this platform adds value to your journey, you can support our ongoing server hosting and open research anytime through our{' '}
                <button
                  type="button"
                  onClick={onNavigateSpecialMembers}
                  className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-semibold underline underline-offset-4 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded"
                >
                  <span>Special Members</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                </button>{' '}
                page.
              </p>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
};
