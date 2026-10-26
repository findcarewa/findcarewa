import { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Loader2, Activity, CheckCircle2 } from './IconLib';
import { useAuth } from '../lib/auth';

interface AuthModalProps {
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export function AuthModal({ onClose, initialMode = 'signin' }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { signIn, signUp } = useAuth();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

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
        const { error: err, needsEmailConfirm } = await signUp(email, password, displayName);
        if (err) throw new Error(err);
        if (needsEmailConfirm) {
          setSuccess(true);
        } else {
          onClose();
        }
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
