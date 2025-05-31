
'use client'; // Mark as client component for auth checks

import { fetchNovelById } from '@/lib/github';
import ManageNovelChapters from '@/components/admin/ManageNovelChapters';
import { notFound, useRouter, usePathname } from 'next/navigation';
// import type { Metadata } from 'next'; // Metadata from server for client components can be tricky
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, ShieldAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Novel } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';

// Server-side metadata generation might not work as expected if we need auth checks before fetching
// export async function generateMetadata({ params }: { params: { novelId: string } }): Promise<Metadata> {
//   const novel = await fetchNovelById(params.novelId);
//   if (!novel) {
//     return { 
//       title: 'Novela no encontrada - Literary Nexus',
//     };
//   }
//   return {
//     title: `Gestionar Capítulos: ${novel.title} - Literary Nexus`,
//     description: `Añade o edita capítulos para ${novel.title}.`,
//   };
// }

export default function AddChapterToNovelPage({ params }: { params: { novelId: string } }) {
  const { novelId } = params;
  const { currentUser, isLoading: authIsLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [novel, setNovel] = useState<Novel | null | undefined>(undefined); // undefined: loading, null: not found
  const [isLoadingNovel, setIsLoadingNovel] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!authIsLoading && !currentUser) {
      router.push(`/auth/login?redirect=${pathname}`);
    }
  }, [currentUser, authIsLoading, router, pathname]);

  useEffect(() => {
    async function loadNovel() {
      if (!novelId) return;
      setIsLoadingNovel(true);
      try {
        const fetchedNovel = await fetchNovelById(novelId);
        setNovel(fetchedNovel);
      } catch (error) {
        console.error("Error fetching novel for chapter management:", error);
        setNovel(null); // Set to null on error
      }
      setIsLoadingNovel(false);
    }
    loadNovel();
  }, [novelId]);

  useEffect(() => {
    if (currentUser && novel) {
      if (novel.creatorId === currentUser.id) {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
      }
    } else if (novel === null) { // Novel not found after fetch attempt
        setIsAuthorized(false); 
    }
  }, [currentUser, novel]);


  if (authIsLoading || isLoadingNovel || novel === undefined) {
    return (
      <section className="py-8">
        <div className="container mx-auto px-4 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Cargando información de la novela y autenticación...</p>
        </div>
      </section>
    );
  }

  if (novel === null) { // Explicitly novel not found
    notFound();
  }
  
  if (!currentUser) { // Should be caught by the redirect effect, but as a fallback
     return (
      <section className="py-8">
        <div className="container mx-auto px-4 text-center">
          <p>Redirigiendo a inicio de sesión...</p>
        </div>
      </section>
    );
  }

  if (!isAuthorized) {
     return (
      <section className="py-8">
        <div className="container mx-auto px-4 text-center max-w-md">
           <ShieldAlert className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Acceso Denegado</h1>
          <p className="text-muted-foreground mb-6">
            No tienes permiso para gestionar los capítulos de esta novela, o la novela no existe.
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
  
  // At this point, novel is not null, user is logged in and authorized
  const safeNovel = novel as Novel; 

  return (
    <section className="py-8">
      <title>{`Gestionar Capítulos: ${safeNovel.title} - Literary Nexus`}</title>
      <div className="container mx-auto px-4 max-w-3xl">
        <Button variant="outline" asChild className="mb-6">
          <Link href="/admin/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Panel
          </Link>
        </Button>
        <ManageNovelChapters novelId={safeNovel.id} novelTitle={safeNovel.title} />
      </div>
    </section>
  );
}
