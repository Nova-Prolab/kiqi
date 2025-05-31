import { fetchNovels } from '@/lib/github';
import type { Novel } from '@/lib/types';
import NovelBrowser from '@/components/novel/NovelBrowser';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export const dynamic = 'force-dynamic'; // Ensure dynamic rendering for this page

export default async function HomePage() {
  // Fetching novels here, on the server, is fine with 'force-dynamic'
  const novels: Novel[] = await fetchNovels();

  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-20rem)] text-center">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-lg text-muted-foreground">Cargando Kiqi!...</p>
      </div>
    }>
      <NovelBrowser initialNovels={novels} />
    </Suspense>
  );
}