'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';

type HomeUser = { role: 'USER' | 'ADMIN' };

export default function HomePage() {
  const { t } = useLanguage();
  const [user, setUser] = useState<HomeUser | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let active = true;
    fetch('/api/auth/me', { cache: 'no-store' })
      .then(async (response) => response.ok ? response.json() : null)
      .then((data) => { if (active) setUser(data?.user ?? null); })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setCheckingSession(false); });
    return () => { active = false; };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
      <div className="text-center max-w-3xl mx-auto space-y-6">
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent leading-tight">
          {t.home.title}
        </h1>
        <p className="text-slate-400 text-lg sm:text-xl">
          {t.home.subtitle}
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6">
          <Link
            href="/spaces"
            className="px-8 py-3.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl shadow-lg shadow-cyan-900/20 transition-all text-center"
          >
            {t.home.exploreBtn}
          </Link>
          {!checkingSession && (
            <Link
              href={user ? (user.role === 'ADMIN' ? '/admin' : '/dashboard') : '/login'}
              className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold rounded-xl transition-all text-center"
            >
              {user ? (user.role === 'ADMIN' ? t.nav.admin : t.nav.dashboard) : t.home.loginBtn}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
