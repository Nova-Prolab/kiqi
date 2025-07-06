import { fetchNovels } from '@/lib/github';
import type { Novel } from '@/lib/types';
import FavoritesPageClient from './FavoritesPageClient';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function FavoritesPage() {
  const allNovels = await fetchNovels();

  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-20rem)] text-center">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-lg text-muted-foreground">Cargando novelas...</p>
      </div>
    }>
      <FavoritesPageClient allNovels={allNovels} />
    </Suspense>
  );
}
