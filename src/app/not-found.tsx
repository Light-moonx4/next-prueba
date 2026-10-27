'use client';

import Link from 'next/link';
import { useLanguage } from '@/i18n/LanguageContext';

export default function NotFound() {
  const { t } = useLanguage();
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
      <div className="bg-slate-900 border border-slate-800 p-8 sm:p-12 rounded-3xl shadow-2xl max-w-lg w-full">
        <span className="text-6xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          404
        </span>
        <h1 className="text-2xl font-bold text-slate-100 mt-4">{t.notFound.title}</h1>
        <p className="text-slate-400 text-sm mt-2 mb-8">
          {t.notFound.message}
        </p>
        <Link
          href="/"
          className="w-full py-3 px-6 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl transition shadow-lg shadow-cyan-900/20 block text-center"
        >
          {t.notFound.home}
        </Link>
      </div>
    </div>
  );
}
