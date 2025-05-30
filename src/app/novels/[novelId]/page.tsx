import { fetchNovelById } from '@/lib/github';
import NovelDetailClient from '@/components/novel/NovelDetailClient';
import { notFound } from 'next/navigation';
import type { Novel } from '@/lib/types';

export async function generateMetadata({ params }: { params: { novelId: string } }) {
  const novel = await fetchNovelById(params.novelId);
  if (!novel) {
    return { title: 'Novel Not Found' };
  }
  return {
    title: `${novel.title} - Literary Nexus`,
    description: novel.summary,
  };
}

export default async function NovelDetailPage({ params }: { params: { novelId: string } }) {
  const novel: Novel | undefined = await fetchNovelById(params.novelId);

  if (!novel) {
    notFound();
  }

  return <NovelDetailClient novel={novel} />;
}
