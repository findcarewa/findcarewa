import { useState, useEffect, useRef } from 'react';
import {
  List as PhList, X as PhX, Heart as PhHeart,
  ChatCircleDots as PhFeedback, User as PhUser, SignOut as PhSignOut,
  Bookmark as PhBookmark, MapTrifold as PhMap,
} from '@phosphor-icons/react';
import type { Route } from '../lib/router';
import { useAuth } from '../lib/auth';
import { AuthModal } from './AuthModal';

interface NavbarProps {
  route: Route;
  onNavigate: (route: Route) => void;
}

export function Navbar({ route, onNavigate }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [profileMenu, setProfileMenu] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!profileMenu) return;
    const onClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [profileMenu]);

  const isActive = (name: string) => route.name === name;

  const navLinks: { label: string; route: Route; icon?: React.ReactNode }[] = [
    { label: 'Home',        route: { name: 'home' } },
    { label: 'Find Care',   route: { name: 'search' } },
    { label: 'Health Map',  route: { name: 'map' }, icon: <PhMap size={15} weight="regular" /> },
    { label: 'How It Works',route: { name: 'how-it-works' } },
    { label: 'FAQ',         route: { name: 'faq' } },
    { label: 'About',       route: { name: 'about' } },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ease-out-expo ${
          scrolled || route.name !== 'home'
            ? 'bg-cream-50/80 backdrop-blur-xl border-b border-ink-200/50 shadow-soft'
            : 'bg-transparent'
        }`}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <button onClick={() => onNavigate({ name: 'home' })} className="flex items-center gap-3 group">
              <div className="relative flex-shrink-0 w-9 h-9 transition-transform group-hover:scale-105">
                <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                  <rect width="36" height="36" rx="8" fill="#0f172a"/>
                  {/* Heart with magnifier — right lobe flows into search handle */}
                  <path
                    d="M18 26C15 23.5 8.5 20 8.5 14C8.5 11.2 10.8 9 13.5 9C15.3 9 16.8 9.9 18 11.4C19.2 9.9 20.7 9 22.5 9C25.2 9 27.5 11.2 27.5 14C27.5 16.2 26.2 18.3 24.3 20.3"
                    stroke="#10b981" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"
                  />
                  {/* Magnifier circle */}
                  <circle cx="22.5" cy="21.5" r="2.8" stroke="#10b981" strokeWidth="2.1"/>
                  {/* Magnifier handle */}
                  <line x1="24.5" y1="23.5" x2="27" y2="26" stroke="#10b981" strokeWidth="2.1" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="font-display font-bold text-lg tracking-tight leading-none">
                <span className="text-primary-800">Find</span><span className="text-sage-600">Care</span>
              </span>
            </button>

            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => onNavigate(link.route)}
                  className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ease-out-expo flex items-center gap-1.5 ${
                    isActive(link.route.name)
                      ? 'bg-sage-50 text-sage-700'
                      : 'text-primary-600 hover:text-primary-800 hover:bg-cream-100'
                  }`}
                >
                  {link.icon}
                  {link.label}
                </button>
              ))}

              {user ? (
                <div className="relative ml-2" ref={profileRef}>
                  <button
                    onClick={() => setProfileMenu(!profileMenu)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-cream-100 hover:bg-cream-200 text-sm font-medium text-primary-700 transition-colors"
                    aria-label="Account menu"
                    aria-expanded={profileMenu}
                  >
                    <PhUser size={18} weight="regular" />
                    <span className="hidden sm:inline max-w-[120px] truncate">{user.email?.split('@')[0]}</span>
                  </button>
                  {profileMenu && (
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-ink-200 shadow-card py-2 z-50 animate-fade-in">
                      <div className="px-4 py-2.5 border-b border-ink-100">
                        <p className="text-[10px] text-ink-400 font-medium uppercase tracking-wide">Signed in as</p>
                        <p className="text-xs font-semibold text-primary-800 truncate">{user.email}</p>
                      </div>
                      <button
                        onClick={() => { onNavigate({ name: 'saved' }); setProfileMenu(false); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-primary-700 hover:bg-cream-100 transition-colors"
                      >
                        <PhBookmark size={16} weight="regular" /> Saved Resources
                      </button>
                      <button
                        onClick={() => { onNavigate({ name: 'feedback' }); setProfileMenu(false); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-primary-700 hover:bg-cream-100 transition-colors"
                      >
                        <PhFeedback size={16} weight="regular" /> Feedback
                      </button>
                      <div className="border-t border-ink-100 my-1.5" />
                      <button
                        onClick={() => { signOut(); setProfileMenu(false); onNavigate({ name: 'home' }); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-danger-600 hover:bg-danger-50 transition-colors"
                      >
                        <PhSignOut size={16} weight="regular" /> Sign out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowAuth(true)}
                  className="ml-2 flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-cream-100 hover:bg-cream-200 text-sm font-medium text-primary-700 transition-colors"
                >
                  <PhUser size={18} weight="regular" /> Sign In
                </button>
              )}

              <a href="tel:988" className="ml-2 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-danger-600 text-white text-sm font-semibold hover:bg-danger-700 transition-colors">
                <PhHeart size={16} weight="fill" /> 988
              </a>
            </div>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2.5 rounded-lg hover:bg-cream-100 transition-colors"
              aria-label="Menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <PhX size={24} weight="regular" className="text-primary-700" /> : <PhList size={24} weight="regular" className="text-primary-700" />}
            </button>
          </div>

          {mobileOpen && (
            <div className="md:hidden pb-4 border-t border-ink-200/50 animate-fade-in">
              <div className="pt-3 flex flex-col gap-1">
                {navLinks.map((link) => (
                  <button
                    key={link.label}
                    onClick={() => { onNavigate(link.route); setMobileOpen(false); }}
                    className={`px-4 py-3 rounded-xl text-left text-sm font-medium transition-colors ${
                      isActive(link.route.name) ? 'bg-sage-50 text-sage-700' : 'text-primary-700 hover:bg-cream-100'
                    }`}
                  >
                    {link.label}
                  </button>
                ))}
                {user ? (
                  <>
                    <button
                      onClick={() => { onNavigate({ name: 'saved' }); setMobileOpen(false); }}
                      className="px-4 py-3 rounded-xl text-left text-sm font-medium text-primary-700 hover:bg-cream-100"
                    >
                      Saved Resources
                    </button>
                    <button
                      onClick={() => { signOut(); setMobileOpen(false); onNavigate({ name: 'home' }); }}
                      className="px-4 py-3 rounded-xl text-left text-sm font-medium text-danger-600 hover:bg-danger-50"
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => { setShowAuth(true); setMobileOpen(false); }}
                    className="px-4 py-3 rounded-xl text-left text-sm font-medium text-primary-700 hover:bg-cream-100 flex items-center gap-2"
                  >
                    <PhUser size={18} weight="regular" /> Sign In / Sign Up
                  </button>
                )}
                <a href="tel:988" className="mt-2 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-danger-600 text-white text-sm font-semibold">
                  <PhHeart size={18} weight="fill" /> 988 Crisis Line
                </a>
              </div>
            </div>
          )}
        </nav>
      </header>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
