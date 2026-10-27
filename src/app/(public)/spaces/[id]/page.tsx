import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import SpaceDetailClient from '@/features/spaces/components/SpaceDetailClient';
import { Suspense } from 'react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function SpaceDetailPage({ params }: PageProps) {
  return (
    <Suspense fallback={<div className="py-20 text-center text-slate-400">Cargando detalles del espacio...</div>}>
      <SpaceDetailData params={params} />
    </Suspense>
  );
}

async function SpaceDetailData({ params }: PageProps) {
  const { id } = await params;

  const space = await prisma.space.findUnique({
    where: { id },
  });

  if (!space || !space.isActive) {
    notFound();
  }

  return <SpaceDetailClient space={{ ...space, pricePerHour: Number(space.pricePerHour) }} />;
}
