
'use client';

import ManageNovelChapters from '@/components/admin/ManageNovelChapters';
import { useRouter, usePathname, notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, ShieldAlert } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import type { Novel } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';

interface AddChapterPageClientProps {
  novel: Novel | null; // Novel puede ser null si no se encontró o hubo error
}

export default function AddChapterPageClient({ novel: initialNovel }: AddChapterPageClientProps) {
  const { currentUser, isLoading: authIsLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Estado para manejar el novel, aunque ya viene como prop,
  // podríamos necesitarlo si quisiéramos re-fetchear o algo en el cliente (no es el caso ahora)
  const [novel, setNovel] = useState<Novel | null>(initialNovel);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);


  useEffect(() => {
    if (authIsLoading) {
      return; // Esperar a que la autenticación se cargue
    }

    if (!currentUser) {
      router.push(`/auth/login?redirect=${pathname}`);
      return;
    }

    if (initialNovel) {
      setNovel(initialNovel); // Sincronizar el estado si la prop cambia (aunque no debería en este flujo)
      if (initialNovel.creatorId === currentUser.id) {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
      }
    } else {
      // Si initialNovel es null (pasado desde el Server Component), significa que no se encontró.
      // El Server Component ya debería haber llamado a notFound(), pero como una doble verificación:
      notFound();
    }
    setIsCheckingAuth(false);

  }, [currentUser, authIsLoading, router, pathname, initialNovel]);


  if (authIsLoading || isCheckingAuth) {
    return (
      <section className="py-8">
        <div className="container mx-auto px-4 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Cargando información de la novela y autenticación...</p>
        </div>
      </section>
    );
  }

  // A este punto, authIsLoading y isCheckingAuth son false.
  // currentUser debería estar definido debido al redirect anterior.
  // novel debería estar definido o notFound() ya fue llamado.

  if (!novel) {
    // Este caso debería ser manejado por el notFound() del Server Component
    // o el notFound() en el useEffect. Lo mantenemos como una salvaguarda.
    console.error("AddChapterPageClient: novel es null o undefined después de la carga y autenticación.");
    notFound();
    return null; // o un error más explícito
  }
  
  if (!currentUser) {
     // Este caso también debería ser manejado por la redirección en el useEffect.
     // Si llegamos aquí, algo muy raro pasó.
    console.error("AddChapterPageClient: currentUser es null después de la carga y autenticación.");
    router.push(`/auth/login?redirect=${pathname}`);
    return <p>Redirigiendo a inicio de sesión...</p>;
  }


  if (!isAuthorized) {
     return (
      <section className="py-8">
        <div className="container mx-auto px-4 text-center max-w-md">
           <ShieldAlert className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Acceso Denegado</h1>
          <p className="text-muted-foreground mb-6">
            No tienes permiso para gestionar los capítulos de esta novela.
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
  return (
    <section className="py-8">
      {/* El título se genera en el Server Component, podemos añadir uno en cliente si es necesario */}
      {/* <title>{`Gestionar Capítulos: ${novel.title} - Literary Nexus`}</title> */}
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
