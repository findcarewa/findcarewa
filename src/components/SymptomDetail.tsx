import { useState, useEffect, useMemo } from 'react';
import {
  ArrowRight, AlertCircle, Loader2, Search, ChevronDown, ChevronUp,
  Stethoscope, Activity, Globe, Heart, Clock, DollarSign, Star,
  Brain, Tooth, Eye, HeartPulse, FirstAid, Baby, Pill, Siren,
  ShieldCheck, Warning,
} from './IconLib';
import type { Route } from '../lib/router';
import {
  fetchSymptomBySlug,
  urgencyColor,
  type SymptomWithDetails,
} from '../lib/symptoms';
import type { ResourceCategory, ResourceWithCategory } from '../lib/supabase';
import { getCategoryIcon, getCategoryColor } from '../lib/icons';
import { formatCost, formatTodayHours, isOpenNow } from '../lib/format';
import { useFavorites } from '../lib/favorites';
import { useAuth } from '../lib/auth';
import {
  setPageMeta, injectPageSchema,
  symptomDetailMeta, medicalWebPageSchema, faqSchema, breadcrumbSchema,
} from '../lib/seo';

function formatReviewDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

interface SymptomDetailProps {
  slug: string;
  resources: ResourceWithCategory[];
  categories: ResourceCategory[];
  onNavigate: (route: Route) => void;
}

// Map specialty keywords to an icon for the hero illustration
function specialtyIcon(specialty: string): React.ComponentType<{ className?: string; weight?: string }> {
  const s = specialty.toLowerCase();
  if (s.includes('ophthal') || s.includes('optom') || s.includes('eye')) return Eye;
  if (s.includes('dent')) return Tooth;
  if (s.includes('psych') || s.includes('neuro') || s.includes('brain')) return Brain;
  if (s.includes('card') || s.includes('heart')) return HeartPulse;
  if (s.includes('pulm') || s.includes('lung') || s.includes('resp')) return Activity;
  if (s.includes('pediat')) return Baby;
  if (s.includes('pharma') || s.includes('medication')) return Pill;
  if (s.includes('crisis') || s.includes('emergency')) return Siren;
  if (s.includes('ortho') || s.includes('physic') || s.includes('sports')) return FirstAid;
  return Stethoscope;
}

export function SymptomDetail({ slug, resources, categories, onNavigate }: SymptomDetailProps) {
  const [symptom, setSymptom] = useState<SymptomWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setOpenFaq(0);
    (async () => {
      try {
        const data = await fetchSymptomBySlug(slug);
        if (!cancelled) {
          setSymptom(data);
          if (!data) {
            setError('Symptom not found.');
          } else {
            // ── SEO: set page meta + JSON-LD schema ──
            const meta = symptomDetailMeta(data);
            setPageMeta(meta);
            injectPageSchema('medicalWebPage', medicalWebPageSchema(data, meta.canonicalPath));
            injectPageSchema('breadcrumb', breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Symptoms', path: '/#/symptoms' },
              { name: data.name, path: `/#/symptom/${data.slug}` },
            ]));
            if (data.faqs.length > 0) {
              injectPageSchema('faq', faqSchema(
                data.faqs.map((f) => ({ question: f.question, answer: f.answer })),
              ));
            } else {
              injectPageSchema('faq', null);
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load symptom.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  // Related resources: match symptom.category_slugs to resource category slugs
  const relatedResources = useMemo(() => {
    if (!symptom || symptom.category_slugs.length === 0) return [];
    const catSlugs = new Set(symptom.category_slugs);
    return resources
      .filter((r) => r.resource_categories && catSlugs.has(r.resource_categories.slug))
      .slice(0, 6);
  }, [symptom, resources]);

  const relatedCategories = useMemo(() => {
    if (!symptom) return [];
    const catSlugs = new Set(symptom.category_slugs);
    return categories.filter((c) => catSlugs.has(c.slug));
  }, [symptom, categories]);

  if (loading) {
    return (
      <section className="min-h-screen pt-20 lg:pt-24 pb-16 bg-cream-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-7 h-7 text-primary-400 animate-spin" />
          <p className="text-sm text-primary-500">Loading symptom information…</p>
        </div>
      </section>
    );
  }

  if (error || !symptom) {
    return (
      <section className="min-h-screen pt-20 lg:pt-24 pb-16 bg-cream-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-14 h-14 rounded-2xl bg-cream-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-primary-400" />
          </div>
          <p className="font-display font-bold text-primary-800 text-lg">
            {error ?? 'Symptom not found'}
          </p>
          <button
            onClick={() => onNavigate({ name: 'symptoms' })}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-700 text-white text-sm font-semibold hover:bg-primary-800 transition-colors"
          >
            <ArrowRight className="w-4 h-4 rotate-180" /> Back to symptoms
          </button>
        </div>
      </section>
    );
  }

  const colors = urgencyColor(symptom.urgency);
  const HeroIcon = symptom.specialties.length > 0
    ? specialtyIcon(symptom.specialties[0])
    : Stethoscope;

  return (
    <section className="min-h-screen pt-20 lg:pt-24 pb-16 bg-cream-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <button
          onClick={() => onNavigate({ name: 'symptoms' })}
          className="inline-flex items-center gap-1.5 text-sm text-primary-500 hover:text-primary-700 transition-colors mb-4"
        >
          <ArrowRight className="w-4 h-4 rotate-180" /> All symptoms
        </button>

        {/* Hero with illustration */}
        <div className="relative rounded-3xl bg-gradient-to-br from-primary-700 to-primary-900 p-6 sm:p-8 mb-6 overflow-hidden">
          <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full bg-white/5" />
          <div className="absolute -right-4 -bottom-12 w-40 h-40 rounded-full bg-white/5" />
          <div className="relative flex items-start gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0 border border-white/20">
              <HeroIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white" weight="regular" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${colors.bg} ${colors.text} ${colors.border} capitalize`}>
                  {symptom.urgency} urgency
                </span>
                {symptom.specialties.slice(0, 2).map((sp) => (
                  <span key={sp} className="text-xs text-slate-300 font-medium">
                    {sp}
                  </span>
                ))}
              </div>
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
                {symptom.name}
              </h1>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="rounded-2xl bg-white border border-ink-200 shadow-soft p-5 sm:p-6 mb-6">
          <h2 className="font-display font-bold text-lg text-primary-800 mb-3">
            About this condition
          </h2>
          <p className="text-sm text-primary-700 leading-relaxed">
            {symptom.description}
          </p>

          {/* Emergency warning — only for red-flag (potentially life-threatening) symptoms */}
          {symptom.red_flag && (
            <div className="mt-4 pt-4 border-t border-ink-100">
              <div className="flex items-start gap-2 rounded-xl bg-danger-50 border border-danger-200 p-3">
                <Warning className="w-4 h-4 text-danger-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-danger-700 leading-relaxed">
                  This can be life-threatening. If symptoms are severe or worsening rapidly,
                  call 911 or go to the nearest emergency room right away. Do not wait.
                </p>
              </div>
            </div>
          )}

          {/* Last reviewed date */}
          {symptom.reviewed_at && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-primary-400">
              <ShieldCheck className="w-3.5 h-3.5 text-sage-500" />
              <span>Last reviewed {formatReviewDate(symptom.reviewed_at)}</span>
            </div>
          )}
        </div>

        {/* Keywords */}
        {symptom.keywords.length > 0 && (
          <div className="mb-6">
            <h2 className="font-display font-bold text-base text-primary-800 mb-2">
              Also known as
            </h2>
            <div className="flex flex-wrap gap-2">
              {symptom.keywords.slice(0, 8).map((kw) => (
                <span
                  key={kw}
                  className="px-2.5 py-1 rounded-lg bg-cream-100 border border-ink-200 text-xs font-medium text-primary-600"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Recommended care types */}
        {symptom.recommended_care_types.length > 0 && (
          <div className="mb-6">
            <h2 className="font-display font-bold text-lg text-primary-800 mb-3 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-sage-600" /> Recommended care types
            </h2>
            <div className="flex flex-wrap gap-2">
              {symptom.recommended_care_types.map((ct) => (
                <span
                  key={ct}
                  className="px-3 py-1.5 rounded-xl bg-sage-50 border border-sage-200 text-xs font-medium text-sage-700 capitalize"
                >
                  {ct.replace(/-/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Related specialties */}
        {symptom.specialties.length > 0 && (
          <div className="mb-6">
            <h2 className="font-display font-bold text-lg text-primary-800 mb-3 flex items-center gap-2">
              <Activity className="w-5 h-5 text-secondary-600" /> Related specialties
            </h2>
            <div className="flex flex-wrap gap-2">
              {symptom.specialties.map((sp) => (
                <span
                  key={sp}
                  className="px-3 py-1.5 rounded-xl bg-secondary-50 border border-secondary-200 text-xs font-medium text-secondary-700"
                >
                  {sp}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* FAQs */}
        {symptom.faqs.length > 0 && (
          <div className="mb-6">
            <h2 className="font-display font-bold text-lg text-primary-800 mb-3">
              Frequently asked questions
            </h2>
            <div className="rounded-2xl bg-white border border-ink-200 shadow-soft overflow-hidden">
              {symptom.faqs.map((faq, i) => {
                const isOpen = openFaq === i;
                return (
                  <div key={faq.id} className="border-b border-ink-100 last:border-0">
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-cream-100 transition-all duration-200 ease-out-expo"
                      aria-expanded={isOpen}
                    >
                      <span className="text-sm font-semibold text-primary-800">{faq.question}</span>
                      <div className="flex-shrink-0 text-primary-400">
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-4 animate-fade-in">
                        <p className="text-sm text-primary-700 leading-relaxed">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Trusted sources */}
        {symptom.sources.length > 0 && (
          <div className="mb-6">
            <h2 className="font-display font-bold text-lg text-primary-800 mb-3">
              Trusted medical sources
            </h2>
            <div className="space-y-2">
              {symptom.sources.map((src) => (
                <a
                  key={src.id}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 p-3 rounded-xl bg-white border border-ink-200 hover:border-primary-300 hover:shadow-soft transition-all duration-200 ease-out-expo"
                >
                  <div className="w-9 h-9 rounded-lg bg-sage-50 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-4 h-4 text-sage-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-primary-800 group-hover:text-primary-900">{src.title}</p>
                    {src.publisher && (
                      <p className="text-xs text-primary-500">{src.publisher}</p>
                    )}
                  </div>
                  <ArrowRight className="w-4 h-4 text-primary-300 group-hover:text-sage-500 transition-colors flex-shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Related resources from FindCare directory */}
        {relatedResources.length > 0 && (
          <div className="mb-6">
            <h2 className="font-display font-bold text-lg text-primary-800 mb-1">
              Related resources
            </h2>
            <p className="text-xs text-primary-500 mb-4">
              Healthcare providers and services from the FindCare directory that may help with this condition.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {relatedResources.map((r) => (
                <RelatedResourceCard
                  key={r.id}
                  resource={r}
                  category={categories.find((c) => c.id === r.category_id)}
                  onClick={() => onNavigate({ name: 'resource', id: r.id })}
                />
              ))}
            </div>
          </div>
        )}

        {/* Search CTA */}
        <div className="rounded-2xl bg-gradient-to-br from-primary-700 to-primary-800 p-5 mb-6 text-center">
          <p className="text-sm text-slate-200 mb-3">
            Find more providers for {symptom.name.toLowerCase()} near you
          </p>
          <button
            onClick={() => onNavigate({ name: 'search', query: symptom.keywords[0] ?? symptom.name })}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-primary-800 text-sm font-semibold hover:bg-cream-100 transition-colors"
          >
            <Search className="w-4 h-4" /> Search for care
          </button>
        </div>

        {/* Back link */}
        <button
          onClick={() => onNavigate({ name: 'symptoms' })}
          className="inline-flex items-center gap-1.5 text-sm text-primary-500 hover:text-primary-700 transition-colors"
        >
          <ArrowRight className="w-4 h-4 rotate-180" /> Back to all symptoms
        </button>

        {/* Disclaimer */}
        <p className="mt-6 text-xs text-primary-400 text-center leading-relaxed">
          This information is for educational purposes only and is not a substitute for professional
          medical advice, diagnosis, or treatment. Always seek the advice of a qualified healthcare
          provider with questions about a medical condition.
        </p>
      </div>
    </section>
  );
}

// ─── Related resource card (compact version) ──────────────────────────────────

function RelatedResourceCard({
  resource, category, onClick,
}: {
  resource: ResourceWithCategory;
  category?: ResourceCategory;
  onClick: () => void;
}) {
  const Icon = category ? getCategoryIcon(category.icon) : Stethoscope;
  const color = category ? getCategoryColor(category.color) : getCategoryColor('teal');
  const { isFavorite, toggle } = useFavorites();
  const { user } = useAuth();
  const isFav = isFavorite(resource.id);
  const open = isOpenNow(resource.hours);
  const todayHours = formatTodayHours(resource.hours);

  return (
    <button
      onClick={onClick}
      className="card-editorial group text-left rounded-2xl bg-white border border-ink-200 overflow-hidden shadow-soft hover:shadow-card hover:-translate-y-0.5 hover:border-sage-200 transition-all duration-200 ease-out-expo flex flex-col"
    >
      <div className={`relative h-20 overflow-hidden bg-gradient-to-br ${color.pastelBg}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className={`w-10 h-10 ${color.pastelAccent} opacity-40 transition-transform duration-500 group-hover:scale-110 group-hover:opacity-60`} strokeWidth={1.5} />
        </div>
        <div className="absolute top-1.5 right-1.5 flex flex-col items-end gap-1">
          {user && (
            <button
              onClick={(e) => { e.stopPropagation(); toggle(resource.id); }}
              className="w-6 h-6 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center hover:bg-white transition-colors"
              aria-label={isFav ? "Remove from saved" : "Save resource"}
            >
              <Heart className={'w-3 h-3 ' + (isFav ? 'text-danger-600 fill-danger-600' : 'text-primary-400')} />
            </button>
          )}
          {open ? (
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide bg-sage-600/90 text-white backdrop-blur-sm">Open</span>
          ) : (
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide bg-primary-800/70 text-white backdrop-blur-sm">Closed</span>
          )}
        </div>
        {category && (
          <div className={`absolute top-1.5 left-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide bg-white/70 ${color.pastelText} backdrop-blur-sm`}>
            <Icon className="w-2.5 h-2.5" />
            {category.name}
          </div>
        )}
      </div>
      <div className="p-3 flex-1 flex flex-col">
        <h3 className="font-display font-bold text-xs text-primary-800 leading-tight group-hover:text-primary-700 transition-colors line-clamp-2">
          {resource.name}
        </h3>
        <p className="mt-0.5 text-[11px] text-primary-500 line-clamp-1 leading-relaxed">{resource.description}</p>
        <div className="mt-1.5 space-y-0.5 text-[10px] text-primary-600 flex-1">
          <div className="flex items-center gap-1">
            <Clock className="w-2.5 h-2.5 text-primary-400" />
            <span className="truncate">{todayHours}</span>
          </div>
          <div className="flex items-center gap-1">
            <DollarSign className="w-2.5 h-2.5 text-primary-400" />
            <span className="truncate">{formatCost(resource.cost_estimate_min, resource.cost_estimate_max, resource.cost_free, resource.sliding_scale)}</span>
          </div>
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {resource.cost_free && <span className="px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-accent-50 text-accent-700">Free</span>}
          {resource.medicaid && <span className="px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-success-50 text-success-700">Apple Health</span>}
          {resource.telehealth && <span className="px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-secondary-50 text-secondary-700">Telehealth</span>}
        </div>
      </div>
    </button>
  );
}
