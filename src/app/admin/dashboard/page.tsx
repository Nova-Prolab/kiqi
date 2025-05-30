
import { fetchNovels } from '@/lib/github';
import type { Novel } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListChecks, FilePlus } from 'lucide-react';

export const metadata = {
  title: 'Panel de Administración de Novelas - Literary Nexus',
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

        {novels.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {novels.map((novel) => (
              <Card key={novel.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-xl line-clamp-2">{novel.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{novel.author}</p>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col justify-end">
                  <Button asChild variant="outline" className="w-full mt-4">
                    <Link href={`/admin/novels/${novel.id}/add-chapter`}>
                      <ListChecks className="mr-2 h-4 w-4" />
                      Gestionar Capítulos ({novel.chapters?.length || 0})
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground">
              No se encontraron novelas. ¡Empieza creando una!
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
