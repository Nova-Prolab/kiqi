
'use client'; // This page now uses client-side hooks for auth and data fetching

import React, { useEffect, useState } from 'react';
import ManageNovelChapters from '@/components/admin/ManageNovelChapters';
import { fetchNovelById } from '@/lib/github';
import { useRouter, usePathname, notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, ShieldAlert } from 'lucide-react';
import type { Novel } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';

// Metadata generation needs to be handled differently or removed if page is fully client-rendered for data
// export async function generateMetadata({ params }: { params: { novelId: string } }): Promise<Metadata> {
//   // This would require this page to be a Server Component or use a server-side data fetching mechanism
// }

export default function AddChapterToNovelPage({ params: routeParams }: { params: { novelId: string } }) {
  const params = React.use(routeParams); // Use React.use to unwrap params
  const { novelId } = params;
  const { currentUser, isLoading: authIsLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [novel, setNovel] = useState<Novel | null | undefined>(undefined); // undefined for initial loading state
  const [isLoadingNovel, setIsLoadingNovel] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (authIsLoading) {
      return; // Wait for authentication to load
    }

    if (!currentUser) {
      router.push(`/auth/login?redirect=${pathname}`);
      return;
    }

    async function loadNovel() {
      if (!novelId) {
        notFound();
        return;
      }
      try {
        setIsLoadingNovel(true);
        const fetchedNovel = await fetchNovelById(novelId);
        
        if (!fetchedNovel) {
          console.warn(`[AddChapterPage] Novel with id ${novelId} not found.`);
          setNovel(null); // Explicitly set to null if not found
        } else {
          setNovel(fetchedNovel);
          if (fetchedNovel.creatorId === currentUser.id) {
            setIsAuthorized(true);
          } else {
            setIsAuthorized(false);
            console.warn(`[AddChapterPage] User ${currentUser.username} not authorized for novel ${novelId}. CreatorID: ${fetchedNovel.creatorId}`);
          }
        }
      } catch (error) {
        console.error(`[AddChapterPage] Error fetching novel ${novelId}:`, error);
        setNovel(null); // Set to null on error
      } finally {
        setIsLoadingNovel(false);
      }
    }

    loadNovel();
  }, [novelId, currentUser, authIsLoading, router, pathname]);

  if (authIsLoading || isLoadingNovel || novel === undefined) {
    return (
      <section className="py-8">
        <title>Gestionar Capítulos - NovaNexus</title>
        <div className="container mx-auto px-4 text-center flex flex-col items-center justify-center min-h-[calc(100vh-20rem)]">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Cargando información de la novela y autenticación...</p>
        </div>
      </section>
    );
  }

  if (novel === null) { // Novel fetch failed or not found
    notFound();
    return null;
  }

  if (!isAuthorized) {
    return (
      <section className="py-8">
        <title>Acceso Denegado - NovaNexus</title>
        <div className="container mx-auto px-4 text-center max-w-md">
          <ShieldAlert className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Acceso Denegado</h1>
          <p className="text-muted-foreground mb-6">
            No tienes permiso para gestionar los capítulos de esta novela. Pertenece a otro usuario o es una novela oficial.
          </p>
          <Button variant="outline" asChild>
            <Link href="/admin/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Panel
            </Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8">
       <title>{`Gestionar Capítulos: ${novel.title} - NovaNexus`}</title>
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
