import { fetchNovels, fetchAdvertisement } from '@/lib/github';
import type { Novel, Advertisement } from '@/lib/types';
import NovelBrowser from '@/components/novel/NovelBrowser';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import AdvertisementBanner from '@/components/layout/AdvertisementBanner';

export const dynamic = 'force-dynamic'; // Ensure dynamic rendering for this page

export default async function HomePage() {
  const [novels, advertisement] = await Promise.all([
    fetchNovels(),
    fetchAdvertisement(),
  ]);

  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-20rem)] text-center">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-lg text-muted-foreground">Cargando Kiqi!...</p>
      </div>
    }>
      {advertisement && <AdvertisementBanner ad={advertisement} />}
      <NovelBrowser initialNovels={novels} />
    </Suspense>
  );
}
