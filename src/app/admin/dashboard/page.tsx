import { fetchNovels } from '@/lib/github';
import type { Novel } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FilePlus, Loader2 } from 'lucide-react';
import AdminNovelListClient from './AdminNovelListClient';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic'; // Ensure dynamic rendering

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
        
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <p className="text-lg text-muted-foreground">Cargando panel de administración...</p>
          </div>
        }>
          <AdminNovelListClient novels={novels} />
        </Suspense>

      </div>
    </section>
  );
}