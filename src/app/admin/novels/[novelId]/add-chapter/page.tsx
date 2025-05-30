
import { fetchNovelById } from '@/lib/github';
import ManageNovelChapters from '@/components/admin/ManageNovelChapters';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export async function generateMetadata({ params }: { params: { novelId: string } }): Promise<Metadata> {
  const novel = await fetchNovelById(params.novelId);
  if (!novel) {
    return { 
      title: 'Novela no encontrada - Literary Nexus',
    };
  }
  return {
    title: `Gestionar Capítulos: ${novel.title} - Literary Nexus`,
    description: `Añade o edita capítulos para ${novel.title}.`,
  };
}

export default async function AddChapterToNovelPage({ params }: { params: { novelId: string } }) {
  const novel = await fetchNovelById(params.novelId);

  if (!novel) {
    notFound();
  }

  return (
    <section className="py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <Button variant="outline" asChild className="mb-6">
          <Link href="/admin/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Panel
          </Link>
        </Button>
        <ManageNovelChapters novelId={novel.id} novelTitle={novel.title} />
      </div>
    </section>
  );
}
