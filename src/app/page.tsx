
import { fetchNovels } from '@/lib/github';
import type { Novel } from '@/lib/types';
import NovelBrowser from '@/components/novel/NovelBrowser';

export default async function HomePage() {
  const novels: Novel[] = await fetchNovels();

  return <NovelBrowser initialNovels={novels} />;
}
