/**
 * SEO infrastructure — dynamic metadata, canonical URLs, and Schema.org
 * structured data (JSON-LD) for FindCare WA.
 *
 * All functions are side-effect-free pure helpers except `setPageMeta` which
 * mutates document head tags in-place (idempotent — safe to call on every
 * route change).
 */

import type { ResourceWithCategory, ResourceCategory } from './supabase';
import type { SymptomWithDetails } from './symptoms';

// ─── Site config ─────────────────────────────────────────────────────────────

export const SITE_URL = 'https://findcarewa.org';
export const SITE_NAME = 'FindCare';
export const SITE_TAGLINE = 'Washington State Healthcare Resources';
export const SITE_DESCRIPTION =
  'Find free and low-cost healthcare resources across Washington State. Search by symptom, condition, insurance, location, and more.';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PageMeta {
  title: string;
  description: string;
  canonicalPath: string;
  ogType?: 'website' | 'article';
  ogImage?: string;
  noIndex?: boolean;
}

// ─── Metadata application ─────────────────────────────────────────────────────

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function upsertJsonLd(id: string, json: object) {
  let el = document.head.querySelector<HTMLScriptElement>(`script[data-jsonld="${id}"]`);
  if (!el) {
    el = document.createElement('script');
    el.setAttribute('type', 'application/ld+json');
    el.setAttribute('data-jsonld', id);
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(json);
}

function removeJsonLd(id: string) {
  document.head.querySelector(`script[data-jsonld="${id}"]`)?.remove();
}

/**
 * Apply page metadata to the document head. Idempotent — call on every
 * route change.  Also sets canonical URL, Open Graph, and Twitter tags.
 */
export function setPageMeta(meta: PageMeta) {
  const canonicalUrl = SITE_URL + meta.canonicalPath;
  const ogImage = meta.ogImage ?? `${SITE_URL}/FindCare_Logo.png`;

  document.title = meta.title;
  upsertMeta('name', 'description', meta.description);
  upsertLink('canonical', canonicalUrl);

  // Robots
  upsertMeta('name', 'robots', meta.noIndex ? 'noindex, nofollow' : 'index, follow');

  // Open Graph
  upsertMeta('property', 'og:title', meta.title);
  upsertMeta('property', 'og:description', meta.description);
  upsertMeta('property', 'og:url', canonicalUrl);
  upsertMeta('property', 'og:type', meta.ogType ?? 'website');
  upsertMeta('property', 'og:site_name', SITE_NAME);
  upsertMeta('property', 'og:image', ogImage);

  // Twitter
  upsertMeta('name', 'twitter:card', 'summary_large_image');
  upsertMeta('name', 'twitter:title', meta.title);
  upsertMeta('name', 'twitter:description', meta.description);
  upsertMeta('name', 'twitter:image', ogImage);
}

// ─── Schema.org JSON-LD generators ──────────────────────────────────────────

/** Organization schema — injected once on every page. */
export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/FindCare_Logo.png`,
    description: SITE_DESCRIPTION,
    areaServed: {
      '@type': 'State',
      name: 'Washington',
    },
  };
}

/** WebSite schema with SearchAction — enables sitelinks search box. */
export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/#/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/** MedicalWebPage schema for symptom detail pages. */
export function medicalWebPageSchema(symptom: SymptomWithDetails, canonicalPath: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    name: symptom.name,
    url: SITE_URL + canonicalPath,
    description: symptom.description,
    about: {
      '@type': 'MedicalCondition',
      name: symptom.name,
    },
    audience: {
      '@type': 'Patient',
    },
    ...(symptom.specialties.length > 0 && {
      relatedSpecialty: symptom.specialties.map((s) => ({
        '@type': 'MedicalSpecialty',
        name: s,
      })),
    }),
  };
}

/** FAQPage schema from a list of Q&A pairs. */
export function faqSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer,
      },
    })),
  };
}

/** MedicalClinic schema for a healthcare resource/provider. */
export function medicalClinicSchema(
  resource: ResourceWithCategory,
  category?: ResourceCategory,
) {
  const isStatewide = resource.city.toLowerCase() === 'statewide';

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'MedicalClinic',
    name: resource.name,
    url: SITE_URL + `/#/resource/${resource.id}`,
    description: resource.description,
    ...(resource.phone && { telephone: resource.phone }),
    ...(resource.website && { sameAs: [resource.website] }),
  };

  // Address — omit for statewide/virtual services
  if (!isStatewide && resource.address && !resource.address.toLowerCase().startsWith('various')) {
    schema.address = {
      '@type': 'PostalAddress',
      streetAddress: resource.address,
      addressLocality: resource.city,
      addressRegion: resource.state,
      postalCode: resource.zip_code,
      addressCountry: 'US',
    };
  }

  // Geo coordinates
  if (resource.lat && resource.lng) {
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude: resource.lat,
      longitude: resource.lng,
    };
  }

  // Medical specialty from category
  if (category) {
    schema.medicalSpecialty = {
      '@type': 'MedicalSpecialty',
      name: category.name,
    };
  }

  // Insurance accepted
  const insuranceAccepted: string[] = [];
  if (resource.medicaid) insuranceAccepted.push('Medicaid');
  if (resource.medicare) insuranceAccepted.push('Medicare');
  if (resource.private_insurance) insuranceAccepted.push('Private Insurance');
  if (insuranceAccepted.length > 0) {
    schema.acceptsReservations = false;
  }

  // Cost / payment
  if (resource.cost_free) {
    schema.paymentAccepted = 'Free';
  } else if (resource.sliding_scale) {
    schema.paymentAccepted = 'Sliding Scale';
  }

  // Languages
  if (resource.languages.length > 0) {
    schema.availableLanguage = resource.languages;
  }

  // Rating
  if (resource.rating > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: resource.rating,
      bestRating: 5,
      worstRating: 0,
    };
  }

  return schema;
}

/** BreadcrumbList schema for navigation context. */
export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: SITE_URL + item.path,
    })),
  };
}

// ─── Schema injection helpers ─────────────────────────────────────────────────

/** Inject Organization + WebSite schema (persistent across route changes). */
export function injectSiteSchema() {
  upsertJsonLd('organization', organizationSchema());
  upsertJsonLd('website', websiteSchema());
}

/** Inject or replace a page-specific JSON-LD block. Pass null to remove. */
export function injectPageSchema(id: string, schema: object | null) {
  if (schema === null) {
    removeJsonLd(id);
    return;
  }
  upsertJsonLd(id, schema);
}

// ─── Route → metadata helpers ────────────────────────────────────────────────

export function homeMeta(): PageMeta {
  return {
    title: `${SITE_NAME} - ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    canonicalPath: '/',
  };
}

export function symptomListMeta(): PageMeta {
  return {
    title: 'Symptoms & Conditions Guide | FindCare WA',
    description:
      'Browse common healthcare symptoms and conditions. Understand urgency levels, find recommended care types, and connect with healthcare resources across Washington State.',
    canonicalPath: '/#/symptoms',
  };
}

export function symptomDetailMeta(symptom: SymptomWithDetails): PageMeta {
  const desc = symptom.description.slice(0, 155);
  return {
    title: `${symptom.name} - Symptoms & Care Guide | FindCare WA`,
    description: desc,
    canonicalPath: `/#/symptom/${symptom.slug}`,
    ogType: 'article',
  };
}

export function searchMeta(query?: string, categorySlug?: string, city?: string): PageMeta {
  let title = 'Find Healthcare Resources | FindCare WA';
  let desc =
    'Search 1,200+ free and low-cost healthcare resources across Washington State by symptom, insurance, location, language, and cost.';
  let path = '/#/search';

  if (categorySlug && city) {
    title = `${capitalize(categorySlug.replace(/-/g, ' '))} in ${capitalize(city)} | FindCare WA`;
    desc = `Find ${categorySlug.replace(/-/g, ' ')} resources in ${capitalize(city)}, Washington State. Filter by insurance, cost, language, and more.`;
    path = `/#/search?cat=${categorySlug}&city=${city}`;
  } else if (categorySlug) {
    title = `${capitalize(categorySlug.replace(/-/g, ' '))} Resources | FindCare WA`;
    desc = `Find ${categorySlug.replace(/-/g, ' ')} resources across Washington State. Filter by insurance, cost, language, and location.`;
    path = `/#/search?cat=${categorySlug}`;
  } else if (city) {
    title = `Healthcare Resources in ${capitalize(city)} | FindCare WA`;
    desc = `Find free and low-cost healthcare resources in ${capitalize(city)}, Washington State.`;
    path = `/#/search?city=${city}`;
  } else if (query) {
    title = `Search: ${query} | FindCare WA`;
    desc = `Search results for "${query}" in healthcare resources across Washington State.`;
    path = `/#/search?q=${encodeURIComponent(query)}`;
  }

  return { title, description: desc, canonicalPath: path };
}

export function resourceDetailMeta(resource: ResourceWithCategory, category?: ResourceCategory): PageMeta {
  const isStatewide = resource.city.toLowerCase() === 'statewide';
  const locationPart = isStatewide ? 'Washington State' : `${resource.city}, WA`;
  const catName = category?.name ?? 'Healthcare';
  return {
    title: `${resource.name} - ${catName} in ${locationPart} | FindCare WA`,
    description: resource.description.slice(0, 155),
    canonicalPath: `/#/resource/${resource.id}`,
    ogType: 'article',
  };
}

export function mapMeta(): PageMeta {
  return {
    title: 'Healthcare Resource Map | FindCare WA',
    description:
      'Find healthcare resources, clinics, food banks, and community services on an interactive map of Washington State.',
    canonicalPath: '/#/map',
  };
}

export function aboutMeta(): PageMeta {
  return {
    title: 'About FindCare | Washington State Healthcare Navigation',
    description:
      'FindCare is a free platform helping Washington State residents find affordable, accessible healthcare and community resources.',
    canonicalPath: '/#/about',
  };
}

export function howItWorksMeta(): PageMeta {
  return {
    title: 'How FindCare Works | Healthcare Search Guide',
    description:
      'Learn how FindCare helps you search for healthcare resources in plain language and filter by insurance, language, cost, and location.',
    canonicalPath: '/#/how-it-works',
  };
}

export function faqMeta(): PageMeta {
  return {
    title: 'Frequently Asked Questions | FindCare WA',
    description:
      'Answers to common questions about FindCare, insurance, crisis support, and finding healthcare resources in Washington State.',
    canonicalPath: '/#/faq',
  };
}

export function savedMeta(): PageMeta {
  return {
    title: 'Saved Resources | FindCare WA',
    description: 'View your saved healthcare resources on FindCare.',
    canonicalPath: '/#/saved',
    noIndex: true,
  };
}

export function requestMeta(): PageMeta {
  return {
    title: 'Request a Resource | FindCare WA',
    description:
      'Suggest a healthcare resource or community service to add to the FindCare Washington State directory.',
    canonicalPath: '/#/request',
    noIndex: true,
  };
}

export function feedbackMeta(): PageMeta {
  return {
    title: 'Feedback | FindCare WA',
    description: 'Share feedback or report an issue with a healthcare resource on FindCare.',
    canonicalPath: '/#/feedback',
    noIndex: true,
  };
}

// ─── Location page metadata ──────────────────────────────────────────────────

export function locationIndexMeta(): PageMeta {
  return {
    title: 'Browse Healthcare Resources by Location | FindCare WA',
    description:
      'Browse healthcare resources by city and county across Washington State. Find clinics, food banks, mental health services, dental care, and community resources near you.',
    canonicalPath: '/#/locations',
  };
}

export function locationMeta(
  locationName: string,
  isCounty: boolean,
  resourceCount: number,
  specialty?: string,
  specialtyName?: string,
): PageMeta {
  const locLabel = isCounty ? `${locationName} County` : locationName;
  if (specialty && specialtyName) {
    return {
      title: `${specialtyName} in ${locLabel} | FindCare WA`,
      description: `Find ${specialtyName.toLowerCase()} resources in ${locLabel}, Washington State. ${resourceCount} verified healthcare providers and community services available.`,
      canonicalPath: `/#/locations/${slugify(locationName)}/${specialty}`,
      ogType: 'website',
    };
  }
  return {
    title: `Healthcare Resources in ${locLabel} | FindCare WA`,
    description: `Find free and low-cost healthcare resources in ${locLabel}, Washington State. ${resourceCount} verified clinics, food banks, mental health, dental, and community services.`,
    canonicalPath: `/#/locations/${slugify(locationName)}`,
    ogType: 'website',
  };
}

/** ItemList schema for a location page — a collection of healthcare providers. */
export function locationItemListSchema(
  locationName: string,
  isCounty: boolean,
  resources: ResourceWithCategory[],
  canonicalPath: string,
) {
  const locLabel = isCounty ? `${locationName} County` : locationName;
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Healthcare Resources in ${locLabel}, Washington`,
    url: SITE_URL + canonicalPath,
    numberOfItems: resources.length,
    itemListElement: resources.slice(0, 20).map((r, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'MedicalClinic',
        name: r.name,
        url: SITE_URL + `/#/resource/${r.id}`,
        ...(r.address && {
          address: {
            '@type': 'PostalAddress',
            addressLocality: r.city,
            addressRegion: r.state,
          },
        }),
      },
    })),
  };
}

/** CollectionPage schema for a location page. */
export function collectionPageSchema(
  locationName: string,
  isCounty: boolean,
  canonicalPath: string,
  resourceCount: number,
) {
  const locLabel = isCounty ? `${locationName} County` : locationName;
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Healthcare Resources in ${locLabel}, Washington`,
    url: SITE_URL + canonicalPath,
    description: `Browse ${resourceCount} healthcare resources in ${locLabel}, Washington State.`,
    about: {
      '@type': 'Place',
      name: locLabel,
      address: {
        '@type': 'PostalAddress',
        addressRegion: 'WA',
        addressCountry: 'US',
      },
    },
  };
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// ─── Sitemap generation ──────────────────────────────────────────────────────

export function generateSitemapXml(
  resources: ResourceWithCategory[],
  symptoms: { slug: string; updated_at: string }[],
  categories: { slug: string }[],
): string {
  const now = new Date().toISOString();
  const staticPages = [
    { path: '/', priority: '1.0', changefreq: 'weekly' },
    { path: '/#/search', priority: '0.9', changefreq: 'weekly' },
    { path: '/#/symptoms', priority: '0.8', changefreq: 'weekly' },
    { path: '/#/map', priority: '0.7', changefreq: 'weekly' },
    { path: '/#/about', priority: '0.5', changefreq: 'monthly' },
    { path: '/#/how-it-works', priority: '0.5', changefreq: 'monthly' },
    { path: '/#/faq', priority: '0.5', changefreq: 'monthly' },
  ];

  const urls: string[] = [];

  for (const p of staticPages) {
    urls.push(`  <url>
    <loc>${SITE_URL}${p.path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`);
  }

  for (const cat of categories) {
    urls.push(`  <url>
    <loc>${SITE_URL}/#/search?cat=${cat.slug}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
  }

  for (const s of symptoms) {
    urls.push(`  <url>
    <loc>${SITE_URL}/#/symptom/${s.slug}</loc>
    <lastmod>${s.updated_at}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`);
  }

  for (const r of resources) {
    urls.push(`  <url>
    <loc>${SITE_URL}/#/resource/${r.id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
