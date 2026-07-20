import { ShieldCheck, Heart, Users, MapPin, Sparkles, Building2 } from './IconLib';
import type { Route } from '../lib/router';

interface AboutPageProps {
  onNavigate: (route: Route) => void;
  totalResources: number;
  totalCities: number;
  totalCounties: number;
}

export function AboutPage({ onNavigate, totalResources, totalCities, totalCounties }: AboutPageProps) {
  const stats = [
    { value: `${totalResources.toLocaleString()}+`, label: 'Resources', icon: Building2, color: 'primary' },
    { value: totalCounties.toString(), label: 'Counties', icon: MapPin, color: 'secondary' },
    { value: totalCities.toString(), label: 'Communities', icon: Users, color: 'accent' },
    { value: '20', label: 'Care Categories', icon: Heart, color: 'success' },
  ];

  const colors: Record<string, string> = {
    primary: 'text-primary-700 bg-primary-50',
    secondary: 'text-secondary-700 bg-secondary-50',
    accent: 'text-accent-700 bg-accent-50',
    success: 'text-success-700 bg-success-50',
  };

  return (
    <section className="min-h-screen pt-20 lg:pt-24 pb-16 bg-cream-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sage-50 border border-sage-200 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-sage-600" />
            <span className="text-xs font-semibold text-sage-700 tracking-wide">ABOUT FINDCARE</span>
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-primary-800 tracking-tight">
            Healthcare access for every Washingtonian
          </h1>
          <p className="mt-4 text-lg text-primary-600 max-w-2xl mx-auto">
            FindCare is a free, AI-powered platform that helps people find the right care and community resources  - 
            without the confusion of insurance jargon or endless phone trees.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="rounded-2xl bg-white border border-ink-200 shadow-card p-6 text-center">
                <div className={`w-12 h-12 rounded-xl mx-auto ${colors[stat.color]} flex items-center justify-center mb-3`}>
                  <Icon className="w-6 h-6" />
                </div>
                <p className="font-display font-extrabold text-2xl sm:text-3xl text-primary-800">{stat.value}</p>
                <p className="text-sm text-primary-500 mt-0.5">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Mission */}
        <div className="rounded-3xl bg-white border border-ink-200 shadow-card p-6 sm:p-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center">
              <Heart className="w-5 h-5" />
            </div>
            <h2 className="font-display font-bold text-xl text-primary-800">Our mission</h2>
          </div>
          <p className="text-sm text-primary-600 leading-relaxed">
            Washington State has a fragmented healthcare landscape  -  hundreds of clinics, community organizations,
            crisis lines, and social services spread across 39 counties. Finding the right resource at the right time
            can be overwhelming, especially for people who are uninsured, non-English speakers, or facing a crisis.
          </p>
          <p className="text-sm text-primary-600 leading-relaxed mt-3">
            FindCare cuts through that complexity. Describe what you need in plain language, and we'll match you
            to the right level of care  -  filtered by your insurance, your language, your location, and your needs.
            From emergency rooms to food banks, it's all in one place.
          </p>
        </div>

        {/* Features */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <div className="rounded-2xl bg-white border border-ink-200 shadow-card p-6">
            <div className="w-10 h-10 rounded-xl bg-secondary-100 text-secondary-700 flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-primary-800 mb-1">AI-powered search</h3>
            <p className="text-sm text-primary-600 leading-relaxed">
              No menus or dropdowns required. Type "Mandarin-speaking therapist that accepts Medicaid near Bellevue"
              and we'll do the rest.
            </p>
          </div>
          <div className="rounded-2xl bg-white border border-ink-200 shadow-card p-6">
            <div className="w-10 h-10 rounded-xl bg-success-100 text-success-700 flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-primary-800 mb-1">Free &amp; confidential</h3>
            <p className="text-sm text-primary-600 leading-relaxed">
              No accounts, no sign-up, no data collection. FindCare is free to use and your searches are anonymous.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-3xl bg-gradient-to-br from-primary-600 to-secondary-600 p-6 sm:p-8 text-center text-white">
          <h2 className="font-display font-bold text-xl sm:text-2xl">Ready to find care?</h2>
          <p className="text-sm text-white/80 mt-1 mb-4">Start with a search or browse the directory.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-2">
            <button
              onClick={() => onNavigate({ name: 'search' })}
              className="px-5 py-2.5 rounded-xl bg-white text-primary-700 font-semibold text-sm hover:bg-cream-100 transition-colors"
            >
              Search for resources
            </button>
            <button
              onClick={() => onNavigate({ name: 'how-it-works' })}
              className="px-5 py-2.5 rounded-xl bg-white/15 backdrop-blur-sm text-white font-semibold text-sm hover:bg-white/25 transition-colors"
            >
              Learn how it works
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
