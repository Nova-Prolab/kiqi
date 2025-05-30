
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Novel } from '@/lib/types';
import NovelCard from '@/components/novel/NovelCard';
import { Input } from '@/components/ui/input';
import { Search, BookX } from 'lucide-react';

interface NovelBrowserProps {
  initialNovels: Novel[];
}

export default function NovelBrowser({ initialNovels }: NovelBrowserProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredNovels = useMemo(() => {
    if (!searchTerm) {
      return initialNovels;
    }
    return initialNovels.filter(
      (novel) =>
        novel.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        novel.author.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [initialNovels, searchTerm]);

  if (!mounted) {
    // Basic skeleton or loading state to avoid hydration issues
    return (
      <div className="space-y-8">
        <section className="py-8 sm:py-10 px-4">
          <div className="max-w-xl mx-auto">
            <div className="h-16 bg-muted rounded-xl animate-pulse"></div>
          </div>
        </section>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="bg-card p-4 rounded-lg shadow animate-pulse">
              <div className="aspect-[2/3] w-full bg-muted rounded-t-lg mb-4"></div>
              <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-muted rounded w-1/2 mb-3"></div>
              <div className="h-4 bg-muted rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <section className="py-8 sm:py-10 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar novelas por título o autor..."
              className="w-full pl-14 pr-6 py-4 rounded-xl shadow-xl text-lg focus:ring-2 focus:ring-primary border-border"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Buscar novelas"
            />
          </div>
        </div>
      </section>

      {filteredNovels.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-8">
          {filteredNovels.map((novel) => (
            <NovelCard key={novel.id} novel={novel} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <BookX className="mx-auto h-16 w-16 text-muted-foreground mb-6" />
          <p className="text-2xl font-semibold text-foreground">No se encontraron novelas</p>
          {searchTerm ? (
            <p className="mt-2 text-lg text-muted-foreground">
              Intenta con otros términos de búsqueda o revisa la ortografía.
            </p>
          ) : (
             <p className="mt-2 text-lg text-muted-foreground">
              Parece que no hay novelas disponibles en este momento. ¡Vuelve pronto!
            </p>
          )}
        </div>
      )}
    </div>
  );
}
