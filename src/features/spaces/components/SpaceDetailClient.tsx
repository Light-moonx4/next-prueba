'use client';

import { useLanguage } from '@/i18n/LanguageContext';
import Image from 'next/image';
import BookingFormClient from '@/features/bookings/components/BookingFormClient';

type Space = { id: string; name: string; nameEn: string | null; type: string; description: string | null; descriptionEn: string | null; imageUrl: string | null; pricePerHour: number };

export default function SpaceDetailClient({ space }: { space: Space }) {
  const { t, language } = useLanguage();
  const displayName = language === 'en' && space.nameEn ? space.nameEn : space.name;
  const displayDescription = language === 'en' && space.descriptionEn ? space.descriptionEn : space.description;
  const typeLabels: Record<string, string> = {
    DESK: t.spaces.types.DESK,
    desk: t.spaces.types.DESK,
    MEETING_ROOM: t.spaces.types.MEETING_ROOM,
    meeting_room: t.spaces.types.MEETING_ROOM,
    PRIVATE_OFFICE: t.spaces.types.PRIVATE_OFFICE,
    private_office: t.spaces.types.PRIVATE_OFFICE,
    BOOTH: t.spaces.types.PRIVATE_OFFICE,
    booth: t.spaces.types.PRIVATE_OFFICE,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-6">
          {space.imageUrl ? (
            <div className="relative h-80 w-full">
              <Image src={space.imageUrl} alt={`${t.details.imageAlt} ${displayName}`} fill unoptimized sizes="(max-width: 1024px) 100vw, 50vw" className="rounded-2xl object-cover" />
            </div>
          ) : (
            <div className="h-80 w-full rounded-2xl bg-gradient-to-br from-cyan-900 via-slate-800 to-blue-950 flex items-center justify-center" aria-label={t.spaces.imagePlaceholder}>
              <span aria-hidden="true" className="text-7xl text-cyan-200/80">{space.type.toLowerCase().includes('meeting') ? '▦' : space.type.toLowerCase().includes('desk') ? '▤' : '▣'}</span>
            </div>
          )}
          <div>
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">{typeLabels[space.type] ?? space.type}</span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--foreground)] mt-3">{displayName}</h1>
            <p className="text-2xl font-bold text-cyan-500 mt-2">${space.pricePerHour} <span className="text-sm font-normal text-[var(--muted-foreground)]">{t.spaces.perHour}</span></p>
          </div>
          <div className="bg-[var(--surface)] border border-[var(--surface-border)] rounded-2xl p-6 shadow-xl backdrop-blur-xl">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">{t.details.description}</h2>
            <p className="text-[var(--muted-foreground)] text-sm leading-relaxed">{displayDescription || t.details.noDescription}</p>
          </div>
        </div>
        <div>
          <div className="bg-[var(--surface)] border border-[var(--surface-border)] rounded-2xl p-6 shadow-xl backdrop-blur-xl sticky top-24">
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-4">{t.details.book}</h2>
            <BookingFormClient spaceId={space.id} pricePerHour={space.pricePerHour} />
          </div>
        </div>
      </div>
    </div>
  );
}
