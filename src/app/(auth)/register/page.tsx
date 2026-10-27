'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/i18n/LanguageContext';
import { useTheme } from '@/shared/ThemeContext';

export default function RegisterPage() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t.auth.passwordMismatch);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al registrar usuario');
      }

      router.replace('/login');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex justify-center">
      <div className={`auth-card p-8 rounded-2xl shadow-2xl w-full max-w-md border backdrop-blur-xl ${theme === 'dark' ? 'bg-slate-900/75 border-slate-700/80 text-slate-100' : 'bg-white/70 border-slate-300/80 text-slate-900'}`}>
        <button
          type="button"
          onClick={() => router.replace('/')}
          className={`mb-5 inline-flex items-center gap-2 text-sm transition hover:text-cyan-500 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}
        >
          ← {t.auth.backHome}
        </button>

        <h1 className="text-3xl font-extrabold mb-2 text-center bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          {t.auth.registerTitle}
        </h1>
        <p className={`text-center text-sm mb-6 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
          {t.auth.registerSubtitle}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 text-red-300 rounded-xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>
              {t.auth.emailLabel}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={`auth-input w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:border-cyan-500 transition ${theme === 'dark' ? 'bg-slate-800/80 border-slate-600 text-slate-100 placeholder:text-slate-400' : 'bg-white/75 border-slate-300 text-slate-800 placeholder:text-slate-400'}`}
              placeholder={t.auth.emailPlaceholder}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>
              {t.auth.passwordLabel}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={`auth-input w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:border-cyan-500 transition ${theme === 'dark' ? 'bg-slate-800/80 border-slate-600 text-slate-100 placeholder:text-slate-400' : 'bg-white/75 border-slate-300 text-slate-800 placeholder:text-slate-400'}`}
              placeholder={t.auth.passwordPlaceholder}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>
              {t.auth.confirmPasswordLabel}
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className={`auth-input w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:border-cyan-500 transition ${theme === 'dark' ? 'bg-slate-800/80 border-slate-600 text-slate-100 placeholder:text-slate-400' : 'bg-white/75 border-slate-300 text-slate-800 placeholder:text-slate-400'}`}
              placeholder={t.auth.passwordPlaceholder}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl transition shadow-lg shadow-cyan-900/20 disabled:opacity-50 mt-2"
          >
            {loading ? t.auth.registering : t.auth.registerBtn}
          </button>
        </form>

        <p className={`mt-6 text-center text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
          {t.auth.alreadyAccount}{' '}
          <Link href="/login" className="text-cyan-400 hover:underline font-medium">
            {t.auth.loginHere}
          </Link>
        </p>
      </div>
    </div>
  );
}
