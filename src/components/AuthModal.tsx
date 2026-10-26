import { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Loader2, Activity, CheckCircle2 } from './IconLib';
import { useAuth } from '../lib/auth';

interface AuthModalProps {
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function MetaIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" aria-hidden="true">
      <path d="M9.198 21.5h4v-8.01h3.604l.396-3.98h-4V7.5a1 1 0 0 1 1-1h3v-4h-3a5 5 0 0 0-5 5v2.01h-2l-.396 3.98h2.396v8.01z"/>
    </svg>
  );
}

export function AuthModal({ onClose, initialMode = 'signin' }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'facebook' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { signIn, signUp, signInWithOAuth } = useAuth();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  async function handleOAuth(provider: 'google' | 'facebook') {
    setError(null);
    setOauthLoading(provider);
    try {
      const { error: err } = await signInWithOAuth(provider);
      if (err) throw new Error(err);
      // Redirect happens automatically; no onClose needed
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setOauthLoading(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'signin') {
        const { error: err } = await signIn(email, password);
        if (err) throw new Error(err);
        onClose();
      } else {
        if (!displayName.trim()) throw new Error('Please enter your name.');
        const { error: err } = await signUp(email, password, displayName);
        if (err) throw new Error(err);
        setSuccess(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-md bg-white rounded-3xl shadow-soft p-8 text-center animate-scale-in">
          <div className="w-16 h-16 rounded-full bg-success-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-success-600" />
          </div>
          <h2 className="font-display font-bold text-2xl text-primary-800">Check your email</h2>
          <p className="mt-2 text-sm text-primary-600">
            We sent a confirmation link to <strong>{email}</strong>. Click the link in the email to activate your account, then sign in.
          </p>
          <button
            onClick={() => { setSuccess(false); setMode('signin'); }}
            className="mt-6 w-full py-3 rounded-xl bg-primary-700 text-white font-semibold text-sm hover:bg-primary-800 transition-all duration-200 ease-out-expo shadow-soft"
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-soft overflow-hidden animate-scale-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
      >
        <div className="bg-gradient-to-br from-primary-600 to-secondary-600 px-8 py-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-white" />
          </button>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display font-bold text-white text-lg">FindCare</span>
          </div>
          <h2 id="auth-title" className="font-display font-bold text-2xl">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="text-white/80 text-sm mt-1">
            {mode === 'signin'
              ? 'Sign in to save and access your favorite resources.'
              : 'Save resources, track favorites, and get personalized help.'}
          </p>
        </div>

        <div className="px-8 py-6">
          {/* OAuth buttons */}
          <div className="space-y-3 mb-5">
            <button
              type="button"
              onClick={() => handleOAuth('google')}
              disabled={oauthLoading !== null || loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl bg-white border border-ink-200 text-sm font-medium text-primary-800 hover:bg-cream-50 hover:border-ink-300 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 ease-out-expo shadow-soft"
            >
              {oauthLoading === 'google' ? (
                <Loader2 className="w-5 h-5 animate-spin text-primary-400" />
              ) : (
                <GoogleIcon />
              )}
              Continue with Google
            </button>

            <button
              type="button"
              onClick={() => handleOAuth('facebook')}
              disabled={oauthLoading !== null || loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl bg-[#0866FF] text-white text-sm font-medium hover:bg-[#0757e0] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 ease-out-expo"
            >
              {oauthLoading === 'facebook' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <MetaIcon />
              )}
              Continue with Meta
            </button>
          </div>

          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-ink-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white text-primary-400 font-medium">or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label htmlFor="displayName" className="block text-sm font-semibold text-primary-700 mb-1.5">
                  Your name
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Jane Smith"
                  autoComplete="name"
                  className="w-full px-3 py-2.5 rounded-xl bg-white border border-ink-200 text-sm text-primary-800 placeholder:text-primary-400 focus:outline-none focus:border-sage-400 focus:ring-sage-500/10 transition-all"
                  required
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-primary-700 mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete={mode === 'signin' ? 'email' : 'username email'}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-ink-200 text-sm text-primary-800 placeholder:text-primary-400 focus:outline-none focus:border-sage-400 focus:ring-sage-500/10 transition-all"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-primary-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  minLength={mode === 'signup' ? 8 : undefined}
                  className="w-full px-3 py-2.5 pr-10 rounded-xl bg-white border border-ink-200 text-sm text-primary-800 placeholder:text-primary-400 focus:outline-none focus:border-sage-400 focus:ring-sage-500/10 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-400 hover:text-primary-700"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-danger-50 border border-danger-200 p-3 text-sm text-danger-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary-700 text-white font-semibold text-sm hover:bg-primary-800 disabled:bg-primary-400 disabled:cursor-not-allowed transition-all duration-200 ease-out-expo shadow-soft"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> {mode === 'signin' ? 'Signing in...' : 'Creating account...'}</>
              ) : (
                mode === 'signin' ? 'Sign in' : 'Create account'
              )}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-primary-500">
            {mode === 'signin' ? (
              <>
                No account yet?{' '}
                <button
                  onClick={() => { setMode('signup'); setError(null); }}
                  className="font-semibold text-sage-600 hover:text-sage-700"
                >
                  Sign up free
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => { setMode('signin'); setError(null); }}
                  className="font-semibold text-sage-600 hover:text-sage-700"
                >
                  Sign in
                </button>
              </>
            )}
          </div>

          <p className="mt-4 text-center text-xs text-primary-400">
            You can use FindCare fully without an account. An account lets you save and favorite resources.
          </p>
        </div>
      </div>
    </div>
  );
}
