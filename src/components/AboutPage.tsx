import {
  ShieldCheck, Heart, Users, MapPin, Sparkles, Building2,
  FileText, Microscope, Stethoscope, AlertCircle, CheckCircle2,
} from './IconLib';
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
            FindCare is a free, AI-powered platform that helps people find the right care and community resources
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
            Washington State has a fragmented healthcare landscape with hundreds of clinics, community organizations,
            crisis lines, and social services spread across 39 counties. Finding the right resource at the right time
            can be overwhelming, especially for people who are uninsured, non-English speakers, or facing a crisis.
          </p>
          <p className="text-sm text-primary-600 leading-relaxed mt-3">
            FindCare cuts through that complexity. Describe what you need in plain language, and we'll match you
            to the right level of care, filtered by your insurance, your language, your location, and your needs.
            From emergency rooms to food banks, it's all in one place.
          </p>
        </div>

        {/* Healthcare navigation purpose */}
        <div className="rounded-3xl bg-white border border-ink-200 shadow-card p-6 sm:p-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-secondary-100 text-secondary-700 flex items-center justify-center">
              <Stethoscope className="w-5 h-5" />
            </div>
            <h2 className="font-display font-bold text-xl text-primary-800">Why healthcare navigation matters</h2>
          </div>
          <p className="text-sm text-primary-600 leading-relaxed">
            Navigating the healthcare system shouldn't require expertise in medical billing, insurance networks, or
            social services infrastructure. Yet for many Washingtonians, particularly those who are uninsured,
            underinsured, or facing language barriers, that's exactly the barrier they face.
          </p>
          <p className="text-sm text-primary-600 leading-relaxed mt-3">
            FindCare serves as a bridge between people and care. We don't provide medical advice or treatment.
            Instead, we help you understand what type of care might be appropriate for your situation and connect
            you with providers and community organizations that can help. Whether you need a primary care doctor,
            a food bank, a crisis counselor, or a ride to a medical appointment, our goal is to get you there with
            as little friction as possible.
          </p>
        </div>

        {/* Methodology */}
        <div className="rounded-3xl bg-white border border-ink-200 shadow-card p-6 sm:p-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent-100 text-accent-700 flex items-center justify-center">
              <Microscope className="w-5 h-5" />
            </div>
            <h2 className="font-display font-bold text-xl text-primary-800">Our methodology</h2>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-primary-700 mb-1">How we collect data</h3>
              <p className="text-sm text-primary-600 leading-relaxed">
                Our resource directory is compiled from publicly available information, including provider websites,
                the Washington State Department of Health, HealthierHere, the Washington Health Alliance, and direct
                outreach to community organizations. We do not accept payment for listings, and providers cannot pay
                to improve their ranking in search results.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-primary-700 mb-1">How we verify resources</h3>
              <p className="text-sm text-primary-600 leading-relaxed">
                Each resource is reviewed before publication and periodically re-verified. We check that the facility
                exists, accepts the listed insurance types, offers the listed services, and that contact information
                is current. However, healthcare services change frequently. Hours shift, clinics close, and insurance
                networks change. We encourage you to always call ahead before visiting.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-primary-700 mb-1">How search ranking works</h3>
              <p className="text-sm text-primary-600 leading-relaxed">
                FindCare uses a hybrid search engine that combines keyword matching, fuzzy typo tolerance, and
                semantic intent detection. When you type a natural-language query like "my child has a fever," we
                identify the likely intent (symptom-based), extract relevant symptoms from our database, and boost
                resources in categories that typically address those symptoms. Rankings also factor in whether a
                resource is currently open, its rating, and how well it matches your filters (insurance, language,
                cost, location).
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-primary-700 mb-1">Symptom content</h3>
              <p className="text-sm text-primary-600 leading-relaxed">
                Our symptom information pages are written to help you understand what type of care might be appropriate
                for common concerns. Each symptom page shows a "Last reviewed" date indicating when the content was
                last checked by our editorial team. Symptom content is informational only and is not a substitute for
                professional medical evaluation.
              </p>
            </div>
          </div>
        </div>

        {/* Editorial & source policy */}
        <div className="rounded-3xl bg-white border border-ink-200 shadow-card p-6 sm:p-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-sage-100 text-sage-700 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="font-display font-bold text-xl text-primary-800">Editorial &amp; source policy</h2>
          </div>
          <p className="text-sm text-primary-600 leading-relaxed mb-4">
            FindCare is an independent directory and navigation tool. We are not affiliated with, endorsed by, or
            sponsored by any healthcare provider, insurance company, or government agency. Our editorial decisions
            are made independently of any commercial relationship.
          </p>
          <h3 className="text-sm font-semibold text-primary-700 mb-2">Trusted sources we reference</h3>
          <p className="text-sm text-primary-600 leading-relaxed mb-3">
            When developing symptom content, care recommendations, and resource categories, we reference guidance
            from the following public health authorities:
          </p>
          <div className="space-y-2">
            {[
              { name: 'Centers for Disease Control and Prevention (CDC)', desc: 'National public health guidance on diseases, conditions, and preventive care.' },
              { name: 'National Institutes of Health (NIH)', desc: 'Medical research and clinical guidance on conditions, treatments, and health topics.' },
              { name: 'Washington State Department of Health', desc: 'State-specific health programs, facility licensing, and public health resources.' },
            ].map((src) => (
              <div key={src.name} className="flex items-start gap-2.5 p-3 rounded-xl bg-cream-50 border border-ink-100">
                <CheckCircle2 className="w-4 h-4 text-sage-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-primary-700">{src.name}</p>
                  <p className="text-xs text-primary-500 leading-relaxed mt-0.5">{src.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-primary-600 leading-relaxed mt-4">
            We also reference Washington-specific resources including HealthierHere, the Washington Health Alliance,
            Apple Health (Medicaid) program details, and 211 Washington. Resource listings are sourced from the
            providers themselves and verified through public records.
          </p>
        </div>

        {/* Medical disclaimer */}
        <div className="rounded-3xl bg-danger-50 border border-danger-200 p-6 sm:p-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-danger-100 text-danger-700 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h2 className="font-display font-bold text-xl text-danger-800">Medical disclaimer</h2>
          </div>
          <p className="text-sm text-danger-700 leading-relaxed">
            FindCare is a directory and navigation tool. It is <strong>not a medical service</strong> and does not
            provide medical advice, diagnosis, or treatment recommendations. The information on this site, including
            symptom descriptions, care type suggestions, and resource listings, is for general informational purposes
            only and is not a substitute for professional medical advice, diagnosis, or treatment.
          </p>
          <p className="text-sm text-danger-700 leading-relaxed mt-3">
            Always seek the advice of a qualified healthcare provider with any questions you may have about a medical
            condition. Never disregard professional medical advice or delay seeking it because of something you have
            read on FindCare. If you think you may have a medical emergency, call 911 or go to the nearest emergency
            room immediately. For mental health crises, call or text 988.
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
