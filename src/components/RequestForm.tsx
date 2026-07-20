import { useState } from 'react';
import { Send, CheckCircle2, Loader2, MapPin } from './IconLib';
import { supabase } from '../lib/supabase';
import type { ResourceCategory } from '../lib/supabase';

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

interface RequestFormProps {
  categories: ResourceCategory[];
  defaultCity?: string;
}

export function RequestForm({ categories, defaultCity }: RequestFormProps) {
  const [category, setCategory] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState(defaultCity || '');
  const [details, setDetails] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !name || !details) {
      setError('Please fill in the category, resource name, and details.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { error: insertError } = await supabase
        .from('resource_requests')
        .insert({
          category,
          name,
          city: city || null,
          details,
          contact_email: contactEmail || null,
        });
      if (insertError) throw insertError;
      sendNotification('resource_request', { category, name, city: city || null, details, contact_email: contactEmail || null });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit your request. Please try again.');
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
            <h2 className="font-display font-extrabold text-2xl text-primary-800">Request submitted!</h2>
            <p className="mt-2 text-sm text-primary-600 max-w-md mx-auto">
              Thank you for helping us expand our directory. Our team will review your request and add the resource if it meets our criteria.
            </p>
            <button
              onClick={() => { setSubmitted(false); setName(''); setDetails(''); setCategory(''); setCity(''); setContactEmail(''); }}
              className="mt-6 px-5 py-2.5 rounded-xl bg-primary-700 text-white text-sm font-semibold hover:bg-primary-800 transition-all duration-200 ease-out-expo shadow-soft"
            >
              Submit another request
            </button>
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
            Request a Resource
          </h1>
          <p className="mt-1 text-sm text-primary-600">
            Know a healthcare, food, or community resource that should be in our directory? Let us know.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-3xl bg-white border border-ink-200 shadow-card p-6 sm:p-8 space-y-5">
          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-semibold text-primary-700 mb-1.5">
              Resource category <span className="text-danger-500">*</span>
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white border border-ink-200 text-sm text-primary-800 focus:outline-none focus:border-sage-400 focus:ring-sage-500/10 transition-all duration-200 ease-out-expo cursor-pointer"
              required
            >
              <option value="">Select a category...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Resource name */}
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-primary-700 mb-1.5">
              Resource name <span className="text-danger-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Cascade Community Clinic"
              className="w-full px-3 py-2.5 rounded-xl bg-white border border-ink-200 text-sm text-primary-800 placeholder:text-primary-400 focus:outline-none focus:border-sage-400 focus:ring-sage-500/10 transition-all duration-200 ease-out-expo"
              required
            />
          </div>

          {/* City */}
          <div>
            <label htmlFor="city" className="block text-sm font-semibold text-primary-700 mb-1.5">
              City
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400" />
              <input
                id="city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g., Seattle"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-ink-200 text-sm text-primary-800 placeholder:text-primary-400 focus:outline-none focus:border-sage-400 focus:ring-sage-500/10 transition-all duration-200 ease-out-expo"
              />
            </div>
          </div>

          {/* Details */}
          <div>
            <label htmlFor="details" className="block text-sm font-semibold text-primary-700 mb-1.5">
              Details <span className="text-danger-500">*</span>
            </label>
            <textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={5}
              placeholder="Share any details you know: address, phone, website, services offered, insurance accepted, languages spoken, etc."
              className="w-full px-3 py-2.5 rounded-xl bg-white border border-ink-200 text-sm text-primary-800 placeholder:text-primary-400 focus:outline-none focus:border-sage-400 focus:ring-sage-500/10 transition-all duration-200 ease-out-expo resize-none"
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
              className="w-full px-3 py-2.5 rounded-xl bg-white border border-ink-200 text-sm text-primary-800 placeholder:text-primary-400 focus:outline-none focus:border-sage-400 focus:ring-sage-500/10 transition-all duration-200 ease-out-expo"
            />
            <p className="mt-1 text-xs text-primary-400">We'll only use this to follow up about your request.</p>
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
              <><Send className="w-4 h-4" /> Submit request</>
            )}
          </button>
        </form>
      </div>
    </section>
  );
}
