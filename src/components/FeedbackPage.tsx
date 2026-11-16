/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ArrowLeft, MessageSquare, Send, CheckCircle2, Mail } from 'lucide-react';

interface FeedbackPageProps {
  onBack: () => void;
}

function isValidEmailOrPhone(value: string): boolean {
  const trimmed = value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const digitsOnly = trimmed.replace(/[\s\-()+]/g, '');
  const phoneRegex = /^\d{10,15}$/;
  return emailRegex.test(trimmed) || phoneRegex.test(digitsOnly);
}

export const FeedbackPage: React.FC<FeedbackPageProps> = ({ onBack }) => {
  const [name, setName] = useState<string>('');
  const [contact, setContact] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [emailDispatched, setEmailDispatched] = useState<boolean>(false);
  const [lastSubmittedPayload, setLastSubmittedPayload] = useState<{
    name: string;
    contact: string;
    message: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedContact = contact.trim();
    const trimmedMessage = message.trim();

    if (!trimmedContact || !isValidEmailOrPhone(trimmedContact)) {
      setError('Please enter a valid Email ID or 10-digit Phone Number before submitting.');
      return;
    }

    if (!trimmedMessage) {
      setError('Please enter your feedback message before submitting.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          contact: trimmedContact,
          message: trimmedMessage,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Could not submit feedback right now.');
      }

      setLastSubmittedPayload({
        name: name.trim() || 'Visitor',
        contact: trimmedContact,
        message: trimmedMessage,
      });
      setEmailDispatched(Boolean(data.emailDispatched));
      setSubmitted(true);
      setName('');
      setContact('');
      setMessage('');
    } catch (err: any) {
      setError(err?.message || 'Could not submit feedback right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const mailtoHref = lastSubmittedPayload
    ? `mailto:agrominrastogi@gmail.com?subject=${encodeURIComponent(
        `Bhartiya Market Feedback from ${lastSubmittedPayload.name}`
      )}&body=${encodeURIComponent(
        `From: ${lastSubmittedPayload.name}\nEmail/Phone: ${lastSubmittedPayload.contact}\n\n${lastSubmittedPayload.message}`
      )}`
    : '';

  return (
    <div className="space-y-6">
      {/* Top Return Breadcrumb */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Market Dashboard</span>
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
          <span>Bhartiya Market</span>
          <span aria-hidden="true">·</span>
          <span>Feedback</span>
        </div>
      </div>

      {/* Main Feedback Card */}
      <section
        aria-labelledby="feedback-page-heading"
        className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6"
      >
        <div className="space-y-2 pb-5 border-b border-slate-800">
          <div className="flex items-center gap-2 text-xs font-medium text-blue-400">
            <MessageSquare className="w-4 h-4 shrink-0" />
            <span>Visitor Feedback</span>
          </div>
          <h1
            id="feedback-page-heading"
            className="text-2xl font-bold tracking-tight text-white [text-wrap:balance]"
          >
            Share Your Feedback
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Your thoughts, listed company requests, and suggestions help make Bhartiya Market sharper for everyone. Please include your email ID or phone number so we can follow up with you.
          </p>
        </div>

        {submitted ? (
          <div className="py-4 space-y-4">
            <div className="flex items-center gap-2 text-base font-semibold text-emerald-400">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>Thank you for your feedback!</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              {emailDispatched
                ? 'Your feedback has been sent to our team. We appreciate you taking the time to share your thoughts.'
                : 'Your feedback has been recorded for our team. We appreciate you taking the time to share your thoughts.'}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {!emailDispatched && mailtoHref && (
                <a
                  href={mailtoHref}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span>Send Copy via Email App</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-200 hover:text-white bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <span>Submit Another Feedback</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="feedback-contact"
                  className="block text-xs font-semibold text-slate-200 mb-1.5"
                >
                  Email ID or Phone Number <span className="text-rose-400">*</span>
                </label>
                <input
                  id="feedback-contact"
                  type="text"
                  required
                  value={contact}
                  onChange={e => {
                    setContact(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="e.g. name@example.com or 9876543210"
                  maxLength={120}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="feedback-name"
                  className="block text-xs font-semibold text-slate-200 mb-1.5"
                >
                  Your Name (optional)
                </label>
                <input
                  id="feedback-name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Aarav Sharma"
                  maxLength={80}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="feedback-message"
                className="block text-xs font-semibold text-slate-200 mb-1.5"
              >
                Feedback or Feature Request <span className="text-rose-400">*</span>
              </label>
              <textarea
                id="feedback-message"
                required
                rows={5}
                value={message}
                onChange={e => {
                  setMessage(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Tell us what you think, report an issue, or request a listed Indian company..."
                maxLength={1000}
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none transition-colors resize-y"
              />
            </div>

            {error && (
              <p role="alert" className="text-xs font-medium text-rose-400">
                {error}
              </p>
            )}

            <div className="flex items-center justify-end gap-4 pt-2 border-t border-slate-800">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                <Send className="w-3.5 h-3.5 shrink-0" />
                <span>{isSubmitting ? 'Submitting...' : 'Submit Feedback'}</span>
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
};
