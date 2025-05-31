
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
  novel: Novel | null;
}

export default function AddChapterPageClient({ novel: initialNovel }: AddChapterPageClientProps) {
  const { currentUser, isLoading: authIsLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [novel, setNovel] = useState<Novel | null>(initialNovel);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);


  useEffect(() => {
    if (authIsLoading) {
      return;
    }

    if (!currentUser) {
      router.push(`/auth/login?redirect=${pathname}`);
      return;
    }

    if (initialNovel) {
      setNovel(initialNovel);
      if (initialNovel.creatorId === currentUser.id) {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
      }
    } else {
      // If initialNovel is null/undefined from the server, it means it wasn't found or env vars failed.
      // The server component page.tsx should have already called notFound().
      // This client component will also call notFound() defensively if initialNovel isn't truthy after auth.
      notFound();
    }
    setIsCheckingAuth(false);

  }, [currentUser, authIsLoading, router, pathname, initialNovel]);


  if (authIsLoading || isCheckingAuth) {
    return (
      <section className="py-8">
        <div className="container mx-auto px-4 text-center flex flex-col items-center justify-center min-h-[calc(100vh-20rem)]">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Cargando información y autenticación...</p>
        </div>
      </section>
    );
  }

  if (!novel) {
    // This handles the case where initialNovel was null, or if anything else unexpected happened.
    // The parent page.tsx (Server Component) is the primary place to call notFound() for data fetching issues.
    console.error("AddChapterPageClient: novel es null o undefined después de la carga y autenticación.");
    notFound();
    return null; // Return null or a fallback UI because notFound() might not immediately stop rendering here.
  }

  if (!currentUser) {
    // This should ideally be caught by the useEffect redirect, but as a fallback:
    console.error("AddChapterPageClient: currentUser es null después de la carga y autenticación.");
    // router.push(`/auth/login?redirect=${pathname}`); // Already handled in useEffect
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
