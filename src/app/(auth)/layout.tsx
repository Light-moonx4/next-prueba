'use client';

import { useLanguage } from '@/i18n/LanguageContext';
import { useTheme } from '@/shared/ThemeContext';

function AuthPreferences() {
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="mb-4 flex items-center justify-end gap-3" aria-label={language === 'es' ? 'Preferencias de pantalla' : 'Display preferences'}>
      <div role="group" aria-label={language === 'es' ? 'Selector de idioma' : 'Language selector'} className={`inline-flex items-center gap-1 rounded-xl border p-1 shadow-sm ${theme === 'dark' ? 'border-slate-600 bg-slate-900/80' : 'border-slate-300 bg-white/75'}`}>
        <button type="button" onClick={() => setLanguage('es')} aria-pressed={language === 'es'} className={`min-w-11 rounded-lg px-3 py-1.5 text-xs font-bold transition ${language === 'es' ? (theme === 'dark' ? 'bg-cyan-500/20 text-cyan-200 ring-1 ring-inset ring-cyan-400/40' : 'bg-cyan-100 text-cyan-800 ring-1 ring-inset ring-cyan-300') : (theme === 'dark' ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100')}`}>ES</button>
        <span aria-hidden="true" className={`h-5 w-px ${theme === 'dark' ? 'bg-slate-600' : 'bg-slate-300'}`} />
        <button type="button" onClick={() => setLanguage('en')} aria-pressed={language === 'en'} className={`min-w-11 rounded-lg px-3 py-1.5 text-xs font-bold transition ${language === 'en' ? (theme === 'dark' ? 'bg-cyan-500/20 text-cyan-200 ring-1 ring-inset ring-cyan-400/40' : 'bg-cyan-100 text-cyan-800 ring-1 ring-inset ring-cyan-300') : (theme === 'dark' ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100')}`}>EN</button>
      </div>
      <button type="button" className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border text-lg shadow-sm transition ${theme === 'dark' ? 'border-slate-600 bg-slate-900/80 hover:bg-slate-800' : 'border-slate-300 bg-white/75 hover:bg-white'}`} onClick={toggleTheme} aria-label={language === 'es' ? 'Cambiar tema' : 'Change theme'} title={language === 'es' ? 'Cambiar tema' : 'Change theme'}>
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
    </div>
  );
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth-layout min-h-screen flex flex-col items-center justify-center text-[var(--foreground)] px-4 py-8">
      <div className="w-full max-w-md">
        <AuthPreferences />
        {children}
      </div>
    </div>
  );
}
