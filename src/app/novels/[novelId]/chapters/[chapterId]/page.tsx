
import { fetchChapter } from '@/lib/github';
import ReaderView from '@/components/reader/ReaderView';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { novelId: string, chapterId: string } }): Promise<Metadata> {
  const data = await fetchChapter(params.novelId, params.chapterId);
  if (!data) {
    return { 
      title: 'Chapter Not Found - NovaNexus',
      description: 'The chapter you are looking for could not be found.',
    };
  }
  return {
    title: `Chapter ${data.chapter.order}: ${data.chapter.title} - ${data.novel.title} - NovaNexus`,
    description: `Read Chapter ${data.chapter.order} of ${data.novel.title}.`,
  };
}

export default async function ChapterPage({ params }: { params: { novelId: string; chapterId: string } }) {
  const data = await fetchChapter(params.novelId, params.chapterId);

  if (!data) {
    notFound();
  }

  const { novel, chapter } = data;

  return <ReaderView novel={novel} currentChapter={chapter} />;
}
