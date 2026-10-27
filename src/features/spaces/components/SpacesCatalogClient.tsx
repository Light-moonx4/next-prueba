'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/i18n/LanguageContext';

type SpaceCard = {
  id: string;
  name: string;
  nameEn: string | null;
  type: string;
  description: string | null;
  descriptionEn: string | null;
  imageUrl: string | null;
  pricePerHour: number;
};

export default function SpacesCatalogClient({ spaces }: { spaces: SpaceCard[] }) {
  const { t, language } = useLanguage();
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
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">{t.spaces.title}</h1>
        <p className="text-slate-400 text-sm mt-1">{t.spaces.subtitle}</p>
      </div>

      {spaces.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/60 rounded-2xl border border-slate-800">
          <p className="text-slate-400 text-lg">{t.spaces.noSpaces}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {spaces.map((space) => {
            const displayName = language === 'en' && space.nameEn ? space.nameEn : space.name;
            const displayDescription = language === 'en' && space.descriptionEn ? space.descriptionEn : space.description;
            return (
              <article key={space.id} className="overflow-hidden bg-slate-900 border border-slate-800 rounded-2xl shadow-xl hover:border-slate-700 transition">
              {space.imageUrl ? (
                <div className="relative h-48 w-full">
                  <Image src={space.imageUrl} alt={displayName} fill unoptimized sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
                </div>
              ) : (
                <div className="h-48 w-full bg-gradient-to-br from-cyan-900 via-slate-800 to-blue-950 flex items-center justify-center" aria-label={t.spaces.imagePlaceholder}>
                  <span className="text-5xl text-cyan-200/80" aria-hidden="true">{space.type.toLowerCase().includes('meeting') ? '▦' : space.type.toLowerCase().includes('desk') ? '▤' : '▣'}</span>
                </div>
              )}
              <div className="p-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">{typeLabels[space.type] ?? space.type}</span>
                  <span className="text-sm font-bold text-cyan-400">${space.pricePerHour} {t.spaces.perHour}</span>
                </div>
                <h2 className="text-xl font-bold text-slate-100 mb-2">{displayName}</h2>
                <p className="text-slate-400 text-sm line-clamp-3 mb-4">{displayDescription || t.spaces.noDescription}</p>
                <Link href={`/spaces/${space.id}`} className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl text-center text-sm transition block">{t.spaces.viewDetails}</Link>
              </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
