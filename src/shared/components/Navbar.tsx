'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from '@/i18n/LanguageContext';
import type { Language } from '@/i18n/dictionaries';
import { useTheme } from '@/shared/ThemeContext';

type CurrentUser = { id: string; email: string; role: 'USER' | 'ADMIN' };

function LanguageSwitcher({ language, setLanguage, theme }: { language: Language; setLanguage: (language: Language) => void; theme: 'light' | 'dark' }) {
  const dark = theme === 'dark';
  return (
    <div role="group" aria-label={language === 'es' ? 'Selector de idioma' : 'Language selector'} className={`inline-flex items-center gap-0.5 rounded-xl border p-1 shadow-inner ${dark ? 'border-slate-700 bg-slate-900/80' : 'border-slate-300 bg-white/75 shadow-slate-400/20'}`}>
      <button
        type="button"
        onClick={() => setLanguage('es')}
        aria-pressed={language === 'es'}
        className={`min-w-10 rounded-lg px-2.5 py-1 text-xs font-bold transition ${language === 'es' ? (dark ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-inset ring-cyan-400/30' : 'bg-cyan-100 text-cyan-800 ring-1 ring-inset ring-cyan-300') : (dark ? 'text-slate-400 hover:text-slate-100' : 'text-slate-600 hover:bg-slate-100')}`}
      >
        ES
      </button>
      <span aria-hidden="true" className={`h-4 w-px ${dark ? 'bg-slate-700' : 'bg-slate-300'}`} />
      <button
        type="button"
        onClick={() => setLanguage('en')}
        aria-pressed={language === 'en'}
        className={`min-w-10 rounded-lg px-2.5 py-1 text-xs font-bold transition ${language === 'en' ? (dark ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-inset ring-cyan-400/30' : 'bg-cyan-100 text-cyan-800 ring-1 ring-inset ring-cyan-300') : (dark ? 'text-slate-400 hover:text-slate-100' : 'text-slate-600 hover:bg-slate-100')}`}
      >
        EN
      </button>
    </div>
  );
}

export default function Navbar() {
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutConfirmationOpen, setLogoutConfirmationOpen] = useState(false);

  const loadSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      if (!res.ok) {
        setUser(null);
        return;
      }
      const data = await res.json();
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setCheckingSession(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch('/api/auth/me', { cache: 'no-store' })
      .then(async (res) => res.ok ? res.json() : null)
      .then((data) => { if (active) setUser(data?.user ?? null); })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setCheckingSession(false); });
    return () => { active = false; };
  }, [pathname]);

  useEffect(() => {
    const onPageShow = () => void loadSession();
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, [loadSession]);

  useEffect(() => {
    if (!logoutConfirmationOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loggingOut) setLogoutConfirmationOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [logoutConfirmationOpen, loggingOut]);

  const handleLogout = () => {
    if (loggingOut) return;
    setLogoutConfirmationOpen(true);
  };

  const confirmLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST', cache: 'no-store' });
    } finally {
      setUser(null);
      setMenuOpen(false);
      setLogoutConfirmationOpen(false);
      setLoggingOut(false);
      router.replace('/');
      router.refresh();
    }
  };

  const publicLinks = (
    <>
      <Link href="/" className="hover:text-cyan-400 transition">{t.nav.home}</Link>
      <Link href="/spaces" className="hover:text-cyan-400 transition">{t.nav.spaces}</Link>
    </>
  );

  return (
    <nav
      className={`navbar-shell w-full border-b sticky top-0 z-50 transition-colors duration-300 ${isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-100/85 border-slate-300/70 text-slate-800'}`}
      style={{ backgroundColor: isDark ? 'rgba(2, 6, 23, 0.94)' : 'rgba(226, 232, 240, 0.86)', backdropFilter: 'blur(18px) saturate(140%)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="CoSpace Logo" width={40} height={40} className="rounded-full border border-cyan-500/30 object-cover" />
            <span className="font-bold text-xl tracking-wide bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">CoSpace</span>
          </Link>

          <div className="hidden md:flex items-center space-x-6 text-sm font-medium">
            {publicLinks}
            {!checkingSession && user && (
              <>
                <Link href="/dashboard" className="hover:text-cyan-400 transition">{t.nav.dashboard}</Link>
                {user.role === 'ADMIN' && (
                  <Link href="/admin" className="hover:text-amber-300 transition text-amber-400">{t.nav.admin}</Link>
                )}
              </>
            )}
          </div>

          <div className="hidden md:flex items-center space-x-3">
            <LanguageSwitcher language={language} setLanguage={setLanguage} theme={theme} />
            <button onClick={toggleTheme} className={`theme-toggle p-2 rounded-lg border text-yellow-500 transition ${isDark ? 'bg-slate-900 border-slate-700 hover:bg-slate-800' : 'bg-white/75 border-slate-300 hover:bg-white'}`} title={language === 'es' ? 'Cambiar tema' : 'Change theme'} aria-label={language === 'es' ? 'Cambiar tema' : 'Change theme'}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            {!checkingSession && user ? (
              <>
                <div className="hidden lg:flex flex-col text-right leading-tight max-w-48">
                  <span className="text-xs text-slate-400">Sesión iniciada</span>
                  <span className="text-xs font-semibold text-slate-200 truncate" title={user.email}>{user.email}</span>
                  <span className="text-[10px] uppercase tracking-wide text-cyan-400">{user.role === 'ADMIN' ? 'Administrador' : 'Usuario'}</span>
                </div>
                <button onClick={handleLogout} disabled={loggingOut} className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 transition disabled:opacity-50">
      {loggingOut ? t.nav.loggingOut : t.nav.logout}
                </button>
              </>
            ) : !checkingSession ? (
              <Link href="/login" className="navbar-login-link px-4 py-2 text-sm font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-md shadow-cyan-900/20">
                {t.nav.login}
              </Link>
            ) : null}
          </div>

          <div className="md:hidden flex items-center gap-2">
            <button onClick={toggleTheme} className={`theme-toggle p-1.5 text-sm rounded border text-yellow-500 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white/75 border-slate-300'}`} aria-label={language === 'es' ? 'Cambiar tema' : 'Change theme'}>{theme === 'dark' ? '☀️' : '🌙'}</button>
            <LanguageSwitcher language={language} setLanguage={setLanguage} theme={theme} />
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 text-slate-300 hover:text-white focus:outline-none">☰</button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className={`navbar-mobile-menu md:hidden border-b px-4 pt-2 pb-4 space-y-2 text-sm ${isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-100/95 border-slate-300 text-slate-800'}`}>
          <Link href="/" className="block py-2 hover:text-cyan-400" onClick={() => setMenuOpen(false)}>{t.nav.home}</Link>
          <Link href="/spaces" className="block py-2 hover:text-cyan-400" onClick={() => setMenuOpen(false)}>{t.nav.spaces}</Link>
          {user && <Link href="/dashboard" className="block py-2 hover:text-cyan-400" onClick={() => setMenuOpen(false)}>{t.nav.dashboard}</Link>}
          {user?.role === 'ADMIN' && <Link href="/admin" className="block py-2 text-amber-400 hover:text-amber-300" onClick={() => setMenuOpen(false)}>{t.nav.admin}</Link>}
          <div className="pt-2">
            {user ? (
              <button onClick={handleLogout} disabled={loggingOut} className="w-full text-center py-2 rounded-lg bg-red-600/20 text-red-300 border border-red-500/30 font-semibold disabled:opacity-50">
                {loggingOut ? t.nav.loggingOut : `${t.nav.logout} (${user.email})`}
              </button>
            ) : (
              <Link href="/login" className="navbar-login-link block text-center py-2 rounded-lg bg-cyan-600 text-white font-semibold" onClick={() => setMenuOpen(false)}>{t.nav.login}</Link>
            )}
          </div>
        </div>
      )}

      {logoutConfirmationOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 py-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !loggingOut) setLogoutConfirmationOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-confirmation-title"
            className="w-full max-w-md rounded-2xl border border-gray-600 bg-gray-800 p-6 text-gray-100 shadow-2xl"
          >
            <h2 id="logout-confirmation-title" className="text-xl font-bold">{t.nav.logoutConfirmTitle}</h2>
            <p className="mt-2 text-sm text-gray-300">
              {user?.email ? `${t.nav.logoutConfirm} (${user.email})` : t.nav.logoutConfirm}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setLogoutConfirmationOpen(false)}
                disabled={loggingOut}
                className="rounded-lg border border-gray-500 bg-gray-700 px-4 py-2 text-sm font-semibold text-gray-100 transition hover:bg-gray-600 disabled:opacity-50"
              >
                {t.nav.cancel}
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                disabled={loggingOut}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
              >
                {loggingOut ? t.nav.loggingOut : t.nav.logout}
              </button>
            </div>
          </section>
        </div>
      )}
    </nav>
  );
}
