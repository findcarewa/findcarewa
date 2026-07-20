import { useState, useEffect } from 'react';
import {
  X, MapPin, Phone, Globe, Clock, Star, Check, DollarSign, Navigation,
  Stethoscope, ShieldCheck, Accessibility, Heart,
  Languages as LanguagesIcon, Sparkles, MessageSquare, Images,
} from './IconLib';
import type { ResourceCategory, ResourceWithCategory } from '../lib/supabase';
import { useFavorites } from '../lib/favorites';
import { useAuth } from '../lib/auth';
import { getCategoryIcon, getCategoryColor } from '../lib/icons';
import {
  formatCost, formatHoursList, isOpenNow, formatPhone, formatLanguages,
  getDirectionsUrl, estimateCost,
} from '../lib/format';
import {
  fetchPlaceResult, placePhotoUrl, clearbitLogoUrl,
  isVirtualService, hasGoogleKey, PlaceResult,
} from '../lib/resourceImage';
import { PlacePhotoGallery } from './ResourceImage';

interface FacilityDetailProps {
  resource: ResourceWithCategory;
  categories: ResourceCategory[];
  onClose: () => void;
  onNavigate: (route: any) => void;
}

type Coverage = 'uninsured' | 'medicaid' | 'medicare' | 'private';

export function ResourceDetail({ resource, categories, onClose, onNavigate }: FacilityDetailProps) {
  const category = categories.find((c) => c.id === resource.category_id);
  const Icon  = category ? getCategoryIcon(category.icon) : Stethoscope;
  const color = category ? getCategoryColor(category.color) : getCategoryColor('teal');
  const open  = isOpenNow(resource.hours);
  const hoursList = formatHoursList(resource.hours);
  const virtual   = isVirtualService(resource);

  const { isFavorite, toggle } = useFavorites();
  const { user } = useAuth();
  const isFav = isFavorite(resource.id);

  const [coverage, setCoverage] = useState<Coverage>(
    resource.medicaid ? 'medicaid' : resource.private_insurance ? 'private' : 'uninsured'
  );
  const costEstimate = estimateCost(resource, coverage);

  // ── Hero image state ────────────────────────────────────────────────────────
  type HeroKind = 'avatar' | 'loading' | 'photo' | 'logo';
  const [heroKind,  setHeroKind]  = useState<HeroKind>('loading');
  const [heroSrc,   setHeroSrc]   = useState<string>('');
  const [placeResult, setPlaceResult] = useState<PlaceResult | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const [heroErrored, setHeroErrored] = useState(false);

  useEffect(() => {
    setShowGallery(false);
    setHeroErrored(false);
    setPlaceResult(null);

    if (resource.photo_url) {
      setHeroSrc(resource.photo_url); setHeroKind('photo'); return;
    }

    if (virtual) {
      if (resource.domain) { setHeroSrc(clearbitLogoUrl(resource.domain)); setHeroKind('logo'); }
      else { setHeroKind('avatar'); }
      return;
    }

    if (!hasGoogleKey()) {
      if (resource.domain) { setHeroSrc(clearbitLogoUrl(resource.domain)); setHeroKind('logo'); }
      else { setHeroKind('avatar'); }
      return;
    }

    setHeroKind('loading');
    fetchPlaceResult(resource).then((result) => {
      setPlaceResult(result);
      if (result.photos.length > 0) {
        setHeroSrc(placePhotoUrl(result.photos[0], 1200));
        setHeroKind('photo');
      } else if (resource.domain) {
        setHeroSrc(clearbitLogoUrl(resource.domain));
        setHeroKind('logo');
      } else {
        setHeroKind('avatar');
      }
    });
  }, [resource.id]);

  function handleHeroError() {
    if (heroErrored) return;
    setHeroErrored(true);
    if (resource.domain) { setHeroSrc(clearbitLogoUrl(resource.domain)); setHeroKind('logo'); }
    else { setHeroKind('avatar'); }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);

  const coverageOptions: { value: Coverage; label: string; available: boolean }[] = [
    { value: 'uninsured', label: 'Uninsured',   available: resource.accepts_uninsured || resource.sliding_scale },
    { value: 'medicaid',  label: 'Apple Health', available: resource.medicaid },
    { value: 'medicare',  label: 'Medicare',     available: resource.medicare },
    { value: 'private',   label: 'Private',      available: resource.private_insurance },
  ];

  const photoCount  = placeResult?.photos.length ?? 0;
  const isLoading   = heroKind === 'loading';
  const isPhoto     = heroKind === 'photo';
  const isLogo      = heroKind === 'logo';
  const isAvatar    = heroKind === 'avatar';

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-primary-950/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      <div
        className="relative w-full sm:max-w-2xl lg:max-w-3xl max-h-[92vh] sm:max-h-[88vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-card overflow-hidden flex flex-col animate-scale-in"
        role="dialog" aria-modal="true" aria-label={resource.name}
      >
        {/* ── Hero image ──────────────────────────────────────────────────────────── */}
        <div className={`relative flex-shrink-0 overflow-hidden ${isLogo ? 'h-32 sm:h-40 bg-white' : 'h-48 sm:h-60 bg-ink-100'}`}>

          {isLoading && (
            <div className={`w-full h-full ${color.bg} flex items-center justify-center animate-pulse`}>
              <Icon className="w-16 h-16 text-white opacity-30" />
            </div>
          )}

          {isPhoto && (
            <>
              <img src={heroSrc} alt={resource.name} className="w-full h-full object-cover" onError={handleHeroError} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            </>
          )}

          {isLogo && (
            <div className="w-full h-full flex items-center justify-center bg-white px-8">
              <img src={heroSrc} alt={`${resource.name} logo`} className="max-h-20 max-w-[60%] object-contain" onError={handleHeroError} />
            </div>
          )}

          {isAvatar && (
            <div className={`w-full h-full flex items-center justify-center ${color.bg}`}>
              <Icon className="w-16 h-16 text-white opacity-30" />
            </div>
          )}

          <button onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-primary-700 hover:bg-white shadow-soft z-10"
            aria-label="Close">
            <X className="w-5 h-5" />
          </button>

          <div className="absolute top-3 left-3 z-10">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide backdrop-blur-md ${open ? 'bg-success-600/90 text-white' : 'bg-primary-800/80 text-white'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${open ? 'bg-white animate-pulse' : 'bg-white/60'}`} />
              {open ? 'Open now' : 'Closed'}
            </span>
          </div>

          {isPhoto && category && (
            <div className={`absolute bottom-3 left-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wide ${color.bg} text-white`}>
              <Icon className="w-3.5 h-3.5" />
              {category.name}
            </div>
          )}

          {isPhoto && resource.rating > 0 && !photoCount && (
            <div className="absolute bottom-3 right-4 flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md">
              <Star className="w-3.5 h-3.5 text-warning-500 fill-warning-500" />
              <span className="text-xs font-bold text-primary-800">{resource.rating.toFixed(1)}</span>
            </div>
          )}

          {isPhoto && photoCount > 1 && (
            <button
              onClick={() => setShowGallery((s) => !s)}
              className="absolute bottom-3 right-4 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md text-xs font-semibold text-primary-700 hover:bg-white transition-colors"
            >
              <Images className="w-3.5 h-3.5" />
              {photoCount} photos
            </button>
          )}
        </div>

        {/* ── Scrollable body ─────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-5 sm:p-6 space-y-6">

            {showGallery && placeResult && (
              <PlacePhotoGallery
                placeId={resource.google_place_id ?? ''}
                resource={resource}
                name={resource.name}
              />
            )}

            <div>
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-display font-extrabold text-2xl text-primary-800 tracking-tight flex-1">{resource.name}</h2>
                {user && (
                  <button onClick={() => toggle(resource.id)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border transition-all ${isFav ? 'bg-danger-50 border-danger-200' : 'bg-cream-50 border-ink-200'}`}
                    aria-label={isFav ? 'Remove from saved' : 'Save resource'}>
                    <Heart className={`w-5 h-5 ${isFav ? 'text-danger-600 fill-danger-600' : 'text-primary-400'}`} />
                  </button>
                )}
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-sm text-primary-500">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                {resource.city.toLowerCase() === 'statewide'
                  ? <>Statewide service · {resource.state}</>
                  : <>{resource.address}, {resource.city}, {resource.state} {resource.zip_code}</>
                }
              </div>
              <p className="mt-3 text-sm text-primary-600 leading-relaxed">{resource.description}</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {resource.phone && (
                <ActionTile href={`tel:${resource.phone}`} icon={Phone} label="Call" sub={formatPhone(resource.phone)} color={color} />
              )}
              {resource.address && !resource.address.toLowerCase().startsWith('various') && (
                <ActionTile href={getDirectionsUrl(resource)} icon={Navigation} label="Directions" sub="Open in Maps" color={color} external />
              )}
              {resource.website && (
                <ActionTile href={resource.website} icon={Globe} label="Website" sub="Visit site" color={color} external />
              )}
            </div>

            <button
              onClick={() => { onClose(); onNavigate({ name: 'feedback', resourceId: resource.id }); }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cream-50 border border-ink-200 text-sm font-medium text-primary-700 hover:bg-cream-100 transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              Report an issue or leave feedback
            </button>

            {!resource.cost_free && (
              <div className="rounded-2xl bg-cream-50 border border-ink-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-sage-50 text-sage-700 flex items-center justify-center">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-primary-800">Cost estimator</h3>
                    <p className="text-xs text-primary-500">Estimated out-of-pocket for your coverage</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {coverageOptions.map((opt) => (
                    <button key={opt.value} onClick={() => setCoverage(opt.value)} disabled={!opt.available}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        coverage === opt.value ? 'bg-sage-600 border-sage-600 text-white'
                          : opt.available ? 'bg-white border-ink-200 text-primary-700 hover:border-sage-200'
                          : 'bg-cream-50 border-ink-200 text-primary-300 cursor-not-allowed'
                      }`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div className="rounded-xl bg-white border border-ink-200 p-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-medium text-primary-500">{costEstimate.label}</span>
                    <span className="font-display font-extrabold text-xl text-primary-800">
                      {formatCost(costEstimate.min, costEstimate.max, resource.cost_free, resource.sliding_scale)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-primary-500 leading-relaxed">{costEstimate.note}</p>
                </div>
              </div>
            )}

            {resource.services.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-primary-800 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-sage-600" /> Services offered
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {resource.services.map((s) => (
                    <span key={s} className="px-2.5 py-1 rounded-lg bg-cream-50 border border-ink-200 text-xs font-medium text-primary-700">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {resource.specialties.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-primary-800 mb-2 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-sage-600" /> Specialties
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {resource.specialties.map((s) => (
                    <span key={s} className="px-2.5 py-1 rounded-lg bg-secondary-50 border border-secondary-200 text-xs font-medium text-secondary-700">{s}</span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-bold text-primary-800 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-sage-600" /> Hours of operation
              </h3>
              <div className="rounded-xl bg-white border border-ink-200 overflow-hidden">
                {hoursList.map((entry) => (
                  <div key={entry.day} className={`flex items-center justify-between px-3 py-2 text-sm border-b border-ink-100 last:border-0 ${entry.isToday ? 'bg-sage-50' : ''}`}>
                    <span className={`font-medium ${entry.isToday ? 'text-sage-700' : 'text-primary-600'}`}>
                      {entry.day}
                      {entry.isToday && <span className="ml-2 text-[10px] uppercase font-bold text-sage-600">Today</span>}
                    </span>
                    <span className={`${entry.isToday ? 'text-primary-800 font-semibold' : 'text-primary-500'}`}>{entry.hours}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-primary-800 mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sage-600" /> Insurance &amp; access
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <InfoPill label="Apple Health"        value={resource.medicaid} />
                <InfoPill label="Medicare"            value={resource.medicare} />
                <InfoPill label="Private insurance"   value={resource.private_insurance} />
                <InfoPill label="Uninsured accepted"  value={resource.accepts_uninsured} />
                <InfoPill label="Sliding scale"       value={resource.sliding_scale} />
                <InfoPill label="Free to all"         value={resource.cost_free} />
                <InfoPill label="Free options avail." value={!resource.cost_free && resource.sliding_scale} />
                <InfoPill label="Walk-ins welcome"    value={resource.walk_ins_welcome} />
                <InfoPill label="Appointments"        value={resource.appointments} />
                <InfoPill label="Telehealth"          value={resource.telehealth} />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wide text-primary-500 mb-2 flex items-center gap-1.5">
                  <LanguagesIcon className="w-3.5 h-3.5" /> Languages
                </h3>
                <p className="text-sm text-primary-700">{formatLanguages(resource.languages)}</p>
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wide text-primary-500 mb-2 flex items-center gap-1.5">
                  <Accessibility className="w-3.5 h-3.5" /> Accessibility
                </h3>
                {resource.accessibility.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {resource.accessibility.map((a) => (
                      <span key={a} className="px-2 py-0.5 rounded-md bg-cream-50 border border-ink-200 text-[11px] font-medium text-primary-600">{a}</span>
                    ))}
                  </div>
                ) : <p className="text-sm text-primary-400">Contact facility for details</p>}
              </div>
            </div>

            {resource.audiences.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wide text-primary-500 mb-2">Serves</h3>
                <div className="flex flex-wrap gap-1.5">
                  {resource.audiences.map((a) => (
                    <span key={a} className="px-2.5 py-1 rounded-lg bg-accent-50 border border-accent-200 text-xs font-medium text-accent-700">{a}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2 text-xs text-primary-400 border-t border-ink-100">
              <MapPin className="w-3.5 h-3.5" />
              {resource.county.toLowerCase() === 'statewide'
                ? <>Statewide service · {resource.state}</>
                : <>Located in {resource.county} County, {resource.state}</>
              }
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 p-4 border-t border-ink-100 bg-white">
          <div className="flex gap-2">
            {resource.phone && (
              <a href={`tel:${resource.phone}`} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary-700 text-white font-semibold text-sm hover:bg-primary-800 transition-colors shadow-soft">
                <Phone className="w-4 h-4" />
                Call {formatPhone(resource.phone)}
              </a>
            )}
            {resource.address && !resource.address.toLowerCase().startsWith('various') && (
              <a href={getDirectionsUrl(resource)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-sage-600 text-white font-semibold text-sm hover:bg-sage-700 transition-colors">
                <Navigation className="w-4 h-4" />
                Directions
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionTile({ href, icon: Icon, label, sub, color, external }: {
  href: string; icon: any; label: string; sub: string;
  color: ReturnType<typeof getCategoryColor>; external?: boolean;
}) {
  return (
    <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}
      className="group flex flex-col items-center gap-1 p-3 rounded-xl bg-white border border-ink-200 hover:border-sage-200 hover:shadow-soft transition-all">
      <div className={`w-9 h-9 rounded-lg ${color.bgSoft} ${color.text} flex items-center justify-center transition-transform group-hover:scale-110`}>
        <Icon className="w-4.5 h-4.5" />
      </div>
      <span className="text-xs font-semibold text-primary-800">{label}</span>
      <span className="text-[10px] text-primary-400 truncate max-w-full text-center">{sub}</span>
    </a>
  );
}

function InfoPill({ label, value }: { label: string; value: boolean }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium ${
      value ? 'bg-success-50 border-success-200 text-success-700' : 'bg-cream-100 border-ink-200 text-primary-400'
    }`}>
      <span className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${value ? 'bg-success-500' : 'bg-ink-300'}`}>
        {value ? <Check className="w-3 h-3 text-white" strokeWidth={3} /> : <X className="w-3 h-3 text-white" strokeWidth={3} />}
      </span>
      {label}
    </div>
  );
}
