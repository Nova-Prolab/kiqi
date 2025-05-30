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
      <div className="space-y-12">
        <section className="relative text-center py-16 sm:py-24 px-4 bg-gradient-to-br from-primary/80 via-primary to-secondary/70 rounded-xl shadow-2xl overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
          <div className="relative z-10">
            <h1 className="text-4xl font-bold tracking-tight text-primary-foreground sm:text-5xl lg:text-6xl">
              Bienvenido a Literary Nexus
            </h1>
            <p className="mt-6 text-lg leading-8 text-primary-foreground/90 sm:text-xl max-w-2xl mx-auto">
              Descubre novelas cautivadoras y sumérgete en mundos extraordinarios. Tu próxima aventura literaria comienza aquí.
            </p>
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
      <section className="relative text-center py-16 sm:py-24 px-6 bg-gradient-to-br from-primary/90 via-primary to-secondary/80 rounded-xl shadow-2xl overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'52\' height=\'26\' viewBox=\'0 0 52 26\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M10 10c0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6h2c0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4v2c-3.314 0-6-2.686-6-6 0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6zm25.464-1.95l8.486 8.486-1.414 1.414-8.486-8.486 1.414-1.414z\' /%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}></div>
        
        <div className="relative z-10">
          <h1 className="text-4xl font-bold tracking-tight text-primary-foreground sm:text-5xl lg:text-6xl">
            Bienvenido a Literary Nexus
          </h1>
          <p className="mt-6 text-lg leading-8 text-primary-foreground/90 sm:text-xl max-w-3xl mx-auto">
            Descubre novelas cautivadoras y sumérgete en mundos extraordinarios. Tu próxima aventura literaria comienza aquí.
          </p>
          <div className="mt-10 max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar novelas por título o autor..."
                className="w-full pl-10 pr-4 py-3 rounded-lg shadow-md text-base focus:ring-2 focus:ring-accent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Buscar novelas"
              />
            </div>
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
