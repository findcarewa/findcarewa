import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, Phone, Search, Sparkles, Heart } from './IconLib';
import type { Route } from '../lib/router';
import { injectPageSchema, faqSchema } from '../lib/seo';

interface FAQPageProps {
  onNavigate: (route: Route) => void;
}

interface FAQItem {
  q: string;
  a: string;
  category: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    category: 'Getting Started',
    q: 'What is FindCare?',
    a: 'FindCare is a free platform that helps Washington State residents find healthcare, food assistance, transportation, mental health resources, and community services near them. You can search in plain language and filter by insurance, language, cost, and more. No account is required.',
  },
  {
    category: 'Getting Started',
    q: 'Is FindCare free to use?',
    a: 'Yes. FindCare is completely free. You do not need to create an account to search for resources or view details. If you create a free account, you can save and favorite resources for easy access later.',
  },
  {
    category: 'Getting Started',
    q: 'Do I need an account to use FindCare?',
    a: 'No. You have full access to the search, filters, map, and all resource details without creating an account. If you make an account, you can save resources and access them again anytime you sign in.',
  },
  {
    category: 'Search and AI',
    q: 'How does the AI search work?',
    a: 'When you type a natural language query like "I need a Mandarin-speaking therapist that accepts Medicaid near Bellevue," FindCare automatically extracts the category (mental health), language (Mandarin), insurance (Medicaid), and location (Bellevue) from your words. You will see a panel showing exactly what the search understood before filtering the results.',
  },
  {
    category: 'Search and AI',
    q: 'What types of searches can I do?',
    a: 'You can search by condition, need, location, language, insurance, cost, or service type. Examples: "Free dental clinic in Yakima", "Food bank open today in Seattle", "Transportation to dialysis in Spokane", "Veteran mental health services in Tacoma", "Spanish-speaking primary care near me".',
  },
  {
    category: 'Search and AI',
    q: 'Why is my search not finding results?',
    a: 'Try simplifying your search to a single keyword or category first (for example, "dental" or "food bank"). Then add filters using the filter panel below the search bar. If you are searching in a very rural area, results may be limited.',
  },
  {
    category: 'Insurance and Cost',
    q: 'What is Apple Health?',
    a: 'Apple Health is Washington State\'s Medicaid program. It provides free or low-cost health coverage for qualifying residents including adults, children, pregnant women, and people with disabilities. When a resource is listed as "Apple Health" it means they accept Medicaid.',
  },
  {
    category: 'Insurance and Cost',
    q: 'What does sliding scale mean?',
    a: 'Sliding scale means the facility adjusts your fee based on your income. If you are uninsured or have low income, you may pay little or nothing. Many Federally Qualified Health Centers (FQHCs) use this model.',
  },
  {
    category: 'Insurance and Cost',
    q: 'What is an FQHC?',
    a: 'A Federally Qualified Health Center (FQHC) is a health clinic that receives federal funding to serve low-income communities. FQHCs are required to see all patients regardless of ability to pay and offer a sliding-fee scale based on income. They often provide medical, dental, and mental health care under one roof.',
  },
  {
    category: 'Insurance and Cost',
    q: 'How accurate is the cost estimator on resource detail pages?',
    a: 'The cost estimator provides an approximate range based on typical costs for that category and your selected coverage type. Actual costs vary by provider, visit type, and individual insurance plan. Always call the facility directly for accurate cost information before your visit.',
  },
  {
    category: 'Mental Health and Crisis',
    q: 'What if I am having a mental health crisis right now?',
    a: 'Call or text 988 (Suicide and Crisis Lifeline). This is free, confidential, and available 24 hours a day, 7 days a week. For life-threatening emergencies, call 911. Washington State also has the Washington Recovery Help Line at 1-866-789-1511 and the King County Regional Crisis Line at 1-866-427-4747.',
  },
  {
    category: 'Mental Health and Crisis',
    q: 'Is there a crisis line for Indigenous people?',
    a: 'Yes. Washington State created the Native and Strong Lifeline, the first 988 crisis line in the nation designed by and for Indigenous people. Dial 988 and press 4 to be connected with a Native crisis counselor. Available 24/7.',
  },
  {
    category: 'Mental Health and Crisis',
    q: 'Is there a helpline for teens?',
    a: 'Yes. Teen Link is a free, anonymous, confidential helpline by teens, for teens in Washington State. Calls are answered by trained teen volunteers. Available daily from 6pm to 10pm. Call or text 866-TEENLINK (866-833-6546).',
  },
  {
    category: 'Medicaid Transportation',
    q: 'How do I get a free ride to a medical appointment if I have Medicaid?',
    a: 'If you have Apple Health (Medicaid), you may qualify for free Non-Emergency Medical Transportation (NEMT). Your broker depends on your county. King and Snohomish Counties: call Hopelink at 1-800-923-7433. Pierce, Thurston, Kitsap and other western counties: call Paratransit Services at 1-800-756-5438. Yakima and Eastern WA: call People for People at 1-800-233-1624. Spokane and 11 eastern counties: call Special Mobility Services at 1-800-892-4817.',
  },
  {
    category: 'Using FindCare',
    q: 'Can I use the map to find resources near me?',
    a: 'Yes. On the search page, click the Map button to switch to the map view. Resources are displayed as markers on an OpenStreetMap. Click any marker for a quick summary and a link to the full resource detail.',
  },
  {
    category: 'Using FindCare',
    q: 'How do I save a resource to come back to later?',
    a: 'Create a free FindCare account by clicking "Sign In" in the navigation bar. Once signed in, you will see a heart icon on every resource card and in the resource detail panel. Click it to save the resource to your Saved Resources page.',
  },
  {
    category: 'Using FindCare',
    q: 'How do I view my saved resources?',
    a: 'After signing in, click on your profile or the Saved Resources link in the navigation bar. You will see all the resources you have saved, which you can click to view details or unsave.',
  },
  {
    category: 'Using FindCare',
    q: 'Can I request that a resource be added to the directory?',
    a: 'Yes. Click "Request a Resource" in the navigation bar or footer. Fill in the form with as much detail as you know and submit. Our team reviews submissions and adds qualifying resources to the directory.',
  },
  {
    category: 'Using FindCare',
    q: 'How do I report incorrect information about a resource?',
    a: 'On any resource detail page, scroll to the bottom and click "Report an issue or leave feedback about this resource." You can submit a data correction with the correct information and optionally leave your email for follow-up.',
  },
  {
    category: 'About FindCare',
    q: 'Is FindCare a substitute for professional medical advice?',
    a: 'No. FindCare is a directory and navigation tool, not a medical service. The information is for reference only and may not be fully up to date. Always contact the facility directly and consult a qualified healthcare professional for medical advice, diagnosis, or treatment.',
  },
  {
    category: 'About FindCare',
    q: 'How current is the directory?',
    a: 'We regularly update and verify resources, but hours, locations, and services can change. Always call ahead or check the facility\'s website before visiting. If you find an error, please use the feedback form to let us know.',
  },
];

export function FAQPage({ onNavigate }: FAQPageProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // ── SEO: inject FAQ schema for rich results ──
  useEffect(() => {
    injectPageSchema('faq', faqSchema(
      FAQ_ITEMS.map((f) => ({ question: f.q, answer: f.a })),
    ));
    return () => { injectPageSchema('faq', null); };
  }, []);

  const categories = Array.from(new Set(FAQ_ITEMS.map((f) => f.category)));

  const filtered = FAQ_ITEMS.filter((item) => {
    const matchesSearch = !search.trim() || (item.q + item.a).toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !activeCategory || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <section className="min-h-screen pt-20 lg:pt-24 pb-16 bg-cream-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary-50 border border-secondary-200 mb-4">
            <HelpCircle className="w-3.5 h-3.5 text-secondary-600" />
            <span className="text-xs font-semibold text-secondary-700 tracking-wide">FAQ</span>
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-primary-800 tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="mt-3 text-primary-600 max-w-xl mx-auto">
            Answers to common questions about FindCare, how to find resources, insurance, crisis support, and more.
          </p>
        </div>

        {/* Crisis callout */}
        <div className="rounded-2xl bg-danger-50 border border-danger-200 p-4 mb-6 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-danger-600 flex items-center justify-center flex-shrink-0">
            <Phone className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-danger-800 text-sm">In a mental health crisis?</p>
            <p className="text-xs text-danger-700">Call or text <strong>988</strong> anytime. For emergencies, call <strong>911</strong>.</p>
          </div>
          <a href="tel:988" className="px-4 py-2 rounded-xl bg-danger-600 text-white text-sm font-bold hover:bg-danger-700 transition-colors flex-shrink-0">
            988
          </a>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-ink-200 text-sm focus:outline-none focus:border-sage-400 focus:ring-4 focus:ring-sage-500/10 transition-all duration-200 ease-out-expo"
            aria-label="Search FAQ"
          />
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ease-out-expo ${!activeCategory ? 'bg-primary-700 text-white' : 'bg-white border border-ink-200 text-primary-600 hover:border-primary-300'}`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ease-out-expo ${activeCategory === cat ? 'bg-primary-700 text-white' : 'bg-white border border-ink-200 text-primary-600 hover:border-primary-300'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FAQ items */}
        <div className="rounded-2xl bg-white border border-ink-200 shadow-soft overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-primary-500 text-sm">No questions match your search.</p>
            </div>
          ) : (
            filtered.map((item) => {
              const globalIdx = FAQ_ITEMS.indexOf(item);
              const isOpen = openIndex === globalIdx;
              return (
                <div key={globalIdx} className="border-b border-ink-100 last:border-0">
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : globalIdx)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-cream-100 transition-all duration-200 ease-out-expo"
                    aria-expanded={isOpen}
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-sage-600 mb-0.5 block">{item.category}</span>
                      <span className="text-sm font-semibold text-primary-800">{item.q}</span>
                    </div>
                    <div className="flex-shrink-0 text-primary-400">
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 pt-0 animate-fade-in">
                      <p className="text-sm text-primary-700 leading-relaxed">{item.a}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Bottom CTAs */}
        <div className="mt-8 grid sm:grid-cols-3 gap-4">
          {[
            { icon: Search, label: 'Find a resource', desc: 'Search the directory', action: () => onNavigate({ name: 'search' }) },
            { icon: Sparkles, label: 'How it works', desc: 'Learn about AI search', action: () => onNavigate({ name: 'how-it-works' }) },
            { icon: Heart, label: 'Request a resource', desc: 'Add missing resources', action: () => onNavigate({ name: 'request' }) },
          ].map(({ icon: Icon, label, desc, action }) => (
            <button
              key={label}
              onClick={action}
              className="group flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-ink-200 hover:border-primary-300 hover:shadow-soft transition-all duration-200 ease-out-expo text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-sage-50 text-sage-700 flex items-center justify-center transition-transform group-hover:scale-110">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-primary-800">{label}</p>
                <p className="text-xs text-primary-500">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
