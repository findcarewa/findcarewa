import {
  MessageSquare, Filter, Calendar, ShieldCheck, Heart, Phone,
  Sparkles,
} from './IconLib';
import type { Route } from '../lib/router';
import type { ResourceCategory } from '../lib/supabase';
import { getCategoryIcon, getCategoryColor } from '../lib/icons';

interface HowItWorksProps {
  onNavigate: (route: Route) => void;
  categories: ResourceCategory[];
}

export function HowItWorks({ onNavigate, categories }: HowItWorksProps) {
  const steps = [
    {
      icon: MessageSquare,
      title: 'Describe your need',
      description: 'Search in plain language: "I need a Mandarin-speaking therapist that accepts Medicaid near Bellevue." Our AI understands what you mean.',
      color: 'primary',
    },
    {
      icon: Filter,
      title: 'AI parses & filters',
      description: 'We extract the category, language, insurance, location, and service type from your search. No menus, no guessing.',
      color: 'secondary',
    },
    {
      icon: Calendar,
      title: 'Browse matched resources',
      description: 'See real facilities near you, filtered to your needs. Switch to the map view to find what\'s closest.',
      color: 'accent',
    },
    {
      icon: Phone,
      title: 'Connect directly',
      description: 'Call, get directions, or visit the website, all from one place. Cost estimator helps you understand what you\'ll pay.',
      color: 'success',
    },
  ];

  const resourceTypes = [
    { slug: 'primary-care', name: 'Primary Care' },
    { slug: 'mental-health', name: 'Mental Health' },
    { slug: 'dental', name: 'Dental' },
    { slug: 'food-bank', name: 'Food Banks' },
    { slug: 'transportation', name: 'Transportation' },
    { slug: 'substance-use', name: 'Substance Use' },
    { slug: 'insurance-assistance', name: 'Insurance Help' },
    { slug: 'veteran-services', name: 'Veterans' },
  ];

  return (
    <section className="min-h-screen pt-20 lg:pt-24 pb-16 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary-50 border border-secondary-200 mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-secondary-600" />
            <span className="text-xs font-semibold text-secondary-700 tracking-wide">HOW IT WORKS</span>
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-primary-800 tracking-tight">
            Find care in four steps
          </h1>
          <p className="mt-4 text-lg text-primary-600 max-w-2xl mx-auto">
            No insurance jargon, no phone-tree mazes. Just clear guidance and real resources ready to help, all across Washington State.
          </p>
        </div>

        {/* Steps */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const colors: Record<string, { bg: string; text: string; bgSoft: string }> = {
              primary: { bg: 'bg-primary-600', text: 'text-primary-700', bgSoft: 'bg-primary-50' },
              secondary: { bg: 'bg-secondary-500', text: 'text-secondary-700', bgSoft: 'bg-secondary-50' },
              accent: { bg: 'bg-accent-500', text: 'text-accent-700', bgSoft: 'bg-accent-50' },
              success: { bg: 'bg-success-600', text: 'text-success-700', bgSoft: 'bg-success-50' },
            };
            const c = colors[step.color];
            return (
              <div key={step.title} className="relative group">
                <div className="relative h-full p-6 rounded-2xl bg-white border border-ink-200 hover:border-ink-300 hover:shadow-card-hover transition-all duration-200 ease-out-expo">
                  <div className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-primary-700 text-white text-xs font-bold flex items-center justify-center shadow-md">
                    {i + 1}
                  </div>
                  <div className={`w-12 h-12 rounded-xl ${c.bgSoft} ${c.text} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-display font-bold text-primary-800 mb-1.5">{step.title}</h3>
                  <p className="text-sm text-primary-600 leading-relaxed">{step.description}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-2.5 -translate-y-1/2 z-10">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M6 10H14M14 10L10 6M14 10L10 14" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Example search queries */}
        <div className="rounded-2xl bg-gradient-to-br from-primary-50 to-secondary-50 border border-primary-100 p-6 sm:p-8 mb-12">
          <h2 className="font-display font-bold text-xl text-primary-800 mb-1">Try these searches</h2>
          <p className="text-sm text-primary-600 mb-5">See how natural language search understands exactly what you need.</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {[
              'Mandarin-speaking therapist that accepts Medicaid near Bellevue',
              'Free dental clinic in Yakima',
              'Veteran mental health services in Tacoma',
              'Food bank open today in Seattle',
              'Spanish-speaking primary care in Wenatchee',
              'Transportation to dialysis in Spokane',
            ].map((q) => (
              <button
                key={q}
                onClick={() => onNavigate({ name: 'search', query: q })}
                className="flex items-start gap-2 px-4 py-3 rounded-xl bg-white border border-ink-200 hover:border-primary-300 hover:shadow-soft transition-all duration-200 ease-out-expo text-left group"
              >
                <Sparkles className="w-4 h-4 text-sage-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-primary-700 group-hover:text-sage-700">{q}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Resource types */}
        <div className="mb-12">
          <h2 className="font-display font-bold text-xl text-primary-800 mb-4 text-center">Resource types we cover</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {resourceTypes.map((rt) => {
              const cat = categories.find((c) => c.slug === rt.slug);
              if (!cat) return null;
              const Icon = getCategoryIcon(cat.icon);
              const color = getCategoryColor(cat.color);
              return (
                <button
                  key={rt.slug}
                  onClick={() => onNavigate({ name: 'search', categorySlug: rt.slug })}
                  className="group flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-ink-200 hover:border-ink-300 hover:shadow-soft transition-all duration-200 ease-out-expo"
                >
                  <div className={`w-11 h-11 rounded-xl ${color.bgSoft} ${color.text} flex items-center justify-center transition-transform group-hover:scale-110`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium text-primary-700">{rt.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Crisis support banner */}
        <div className="rounded-2xl bg-gradient-to-br from-ink-900 to-ink-800 p-6 sm:p-8 overflow-hidden relative">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary-500/20 blur-3xl" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div className="w-12 h-12 rounded-2xl bg-danger-600 flex items-center justify-center flex-shrink-0">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-display font-bold text-white text-lg">In crisis? You're not alone.</h3>
              <p className="text-sm text-primary-400 mt-1">
                The 988 Suicide &amp; Crisis Lifeline offers free, confidential support 24/7. Washington Poison Center handles poison emergencies.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <a href="tel:988" className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-danger-600 text-white font-semibold text-sm hover:bg-danger-700 transition-colors">
                <Phone className="w-4 h-4" /> Call 988
              </a>
              <a href="tel:12065262121" className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 text-white font-semibold text-sm hover:bg-white/20 transition-colors">
                <Phone className="w-4 h-4" /> Poison Center
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
