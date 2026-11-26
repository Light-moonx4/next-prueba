import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import SpacesCatalogClient from '@/features/spaces/components/SpacesCatalogClient';
import { resolveSpaceImages } from '@/features/spaces/image';

export default function SpacesPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-slate-400">Cargando espacios...</div>}>
      <SpacesList />
    </Suspense>
  );
}

async function SpacesList() {
  const records = await prisma.space.findMany({
    where: { isActive: true },
  });
  const spaces = await resolveSpaceImages(records);

  return <SpacesCatalogClient spaces={spaces.map((space) => ({ ...space, pricePerHour: Number(space.pricePerHour) }))} />;
}
