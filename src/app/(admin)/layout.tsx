import Navbar from '@/shared/components/Navbar';
import { Suspense } from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)]">
      <Suspense fallback={<div className="h-16 bg-slate-950" aria-hidden="true" />}>
        <Navbar />
      </Suspense>
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-center text-xs font-semibold text-amber-400">
        🛡️ MÓDULO DE ADMINISTRACIÓN COSPACE
      </div>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
