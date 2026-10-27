import Navbar from '@/shared/components/Navbar';
import { Suspense } from 'react';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)]">
      <Suspense fallback={<div className="h-16 bg-slate-950" aria-hidden="true" />}>
        <Navbar />
      </Suspense>
      <main className="flex-1">{children}</main>
    </div>
  );
}
