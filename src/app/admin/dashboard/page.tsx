
import { fetchNovels } from '@/lib/github';
import type { Novel } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FilePlus } from 'lucide-react';
import AdminNovelListClient from './AdminNovelListClient'; // Import the new client component

export const metadata = {
  title: 'Panel de Administración de Novelas - Kiqi!',
  description: 'Gestiona tus novelas y capítulos.',
};

export default async function AdminDashboardPage() {
  const novels: Novel[] = await fetchNovels();

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Panel de Administración</h1>
          <Button asChild size="lg">
            <Link href="/admin/create-novel">
              <FilePlus className="mr-2 h-5 w-5" />
              Crear Nueva Novela
            </Link>
          </Button>
        </div>
        
        <AdminNovelListClient novels={novels} />

      </div>
    </section>
  );
}
