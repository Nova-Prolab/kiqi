'use client';

import { useMemo, useState, useEffect } from 'react';
import type { Novel } from '@/lib/types';
import { useFavorites } from '@/contexts/FavoritesContext';
import NovelCard from '@/components/novel/NovelCard';
import { Loader2, HeartCrack, Library } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function FavoritesPageClient({ allNovels }: { allNovels: Novel[] }) {
  const { favoriteIds, isLoaded: favoritesLoaded } = useFavorites();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const favoriteNovels = useMemo(() => {
    if (!favoritesLoaded) return [];
    return allNovels.filter(novel => favoriteIds.includes(novel.id));
  }, [allNovels, favoriteIds, favoritesLoaded]);

  // Loading state now only depends on the client-side context hydration
  if (!favoritesLoaded || !isMounted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-20rem)] text-center">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-lg text-muted-foreground">Cargando tus novelas favoritas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-primary">Mis Favoritos</h1>
        <p className="text-lg text-muted-foreground mt-1">
          Tu colección personal de novelas.
        </p>
      </header>

      {favoriteNovels.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
          {favoriteNovels.map((novel) => (
            <NovelCard key={novel.id} novel={novel} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 md:py-24 border-2 border-dashed rounded-lg">
          <HeartCrack className="mx-auto h-16 w-16 text-muted-foreground mb-6" />
          <h2 className="text-2xl font-semibold text-foreground">No tienes novelas favoritas</h2>
          <p className="mt-2 text-lg text-muted-foreground max-w-md mx-auto">
            Puedes añadir novelas a tus favoritos desde la página de detalles de cada novela.
          </p>
          <Button asChild className="mt-6">
            <Link href="/">
              <Library className="mr-2 h-4 w-4" />
              Explorar Novelas
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
