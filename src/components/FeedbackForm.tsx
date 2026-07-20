import { useState } from 'react';
import { Send, CheckCircle2, Loader2, AlertCircle, ThumbsUp } from './IconLib';
import { supabase } from '../lib/supabase';
import type { Resource } from '../lib/supabase';

async function sendNotification(type: 'resource_request' | 'feedback', data: Record<string, unknown>) {
  try {
    await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, data }),
    });
  } catch {
    // Silently fail - the database insert is the source of truth
  }
}

interface FeedbackFormProps {
  resourceId?: string;
  resource?: Resource;
}

const FEEDBACK_TYPES = [
  { value: 'suggestion', label: 'Suggestion', icon: ThumbsUp },
  { value: 'report_issue', label: 'Report an Issue', icon: AlertCircle },
  { value: 'praise', label: 'Praise', icon: CheckCircle2 },
  { value: 'data_correction', label: 'Data Correction', icon: AlertCircle },
];

export function FeedbackForm({ resourceId, resource }: FeedbackFormProps) {
  const [feedbackType, setFeedbackType] = useState('suggestion');
  const [message, setMessage] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('Please enter a message.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { error: insertError } = await supabase
        .from('feedback')
        .insert({
          resource_id: resourceId || null,
          feedback_type: feedbackType,
          message,
          contact_email: contactEmail || null,
        });
      if (insertError) throw insertError;
      sendNotification('feedback', { feedback_type: feedbackType, message, resource_name: resource?.name, contact_email: contactEmail || null });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <section className="min-h-screen pt-20 lg:pt-24 pb-16 bg-cream-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-white border border-ink-200 shadow-card p-8 sm:p-12 text-center animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-success-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-success-600" />
            </div>
            <h2 className="font-display font-extrabold text-2xl text-primary-800">Feedback received!</h2>
            <p className="mt-2 text-sm text-primary-600 max-w-md mx-auto">
              Thank you for taking the time to share your thoughts. Your feedback helps us improve FindCare for everyone.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen pt-20 lg:pt-24 pb-16 bg-cream-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-primary-800 tracking-tight">
            Feedback
          </h1>
          <p className="mt-1 text-sm text-primary-600">
            Help us improve FindCare or report an issue with a resource.
          </p>
        </div>

        {resource && (
          <div className="mb-4 rounded-xl bg-secondary-50 border border-secondary-200 p-4">
            <p className="text-sm font-medium text-secondary-800">About: {resource.name}</p>
            <p className="text-xs text-secondary-600 mt-0.5">{resource.city}, {resource.county} County</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="rounded-3xl bg-white border border-ink-200 shadow-card p-6 sm:p-8 space-y-5">
          {/* Feedback type */}
          <div>
            <label className="block text-sm font-semibold text-primary-700 mb-2">Feedback type</label>
            <div className="grid grid-cols-2 gap-2">
              {FEEDBACK_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFeedbackType(type.value)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      feedbackType === type.value
                        ? 'bg-sage-50 border-sage-300 text-sage-700'
                        : 'bg-white border-ink-200 text-primary-600 hover:border-primary-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {type.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Message */}
          <div>
            <label htmlFor="message" className="block text-sm font-semibold text-primary-700 mb-1.5">
              Message <span className="text-danger-500">*</span>
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              placeholder="Tell us what's on your mind..."
              className="w-full px-3 py-2.5 rounded-xl bg-white border border-ink-200 text-sm text-primary-800 placeholder:text-primary-400 focus:outline-none focus:border-sage-400 focus:ring-sage-500/10 transition-all resize-none"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-primary-700 mb-1.5">
              Your email <span className="text-primary-400 font-normal">(optional)</span>
            </label>
            <input
              id="email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2.5 rounded-xl bg-white border border-ink-200 text-sm text-primary-800 placeholder:text-primary-400 focus:outline-none focus:border-sage-400 focus:ring-sage-500/10 transition-all"
            />
            <p className="mt-1 text-xs text-primary-400">Leave your email if you'd like a response.</p>
          </div>

          {error && (
            <div className="rounded-xl bg-danger-50 border border-danger-200 p-3 text-sm text-danger-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary-700 text-white font-semibold text-sm hover:bg-primary-800 disabled:bg-primary-400 disabled:cursor-not-allowed transition-all duration-200 ease-out-expo shadow-soft"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
            ) : (
              <><Send className="w-4 h-4" /> Send feedback</>
            )}
          </button>
        </form>
      </div>
    </section>
  );
}
