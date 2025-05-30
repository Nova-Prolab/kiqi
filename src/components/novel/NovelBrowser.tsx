
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Novel } from '@/lib/types';
import NovelCard from '@/components/novel/NovelCard';
import { Input } from '@/components/ui/input';
import { Search, BookX, Tags, LayoutGrid, Star, FilterX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';


interface NovelBrowserProps {
  initialNovels: Novel[];
}

const PREDEFINED_CATEGORIES: string[] = [
  "Acción", "Aventura", "Ciencia Ficción", "Fantasía", "Romance", 
  "Misterio", "Suspense", "Terror", "Comedia", "Drama", 
  "Histórico", "Urbano", "Wuxia", "Xianxia", "Realismo Mágico", 
  "Cyberpunk", "Steampunk", "LitRPG", "GameLit", "Post-apocalíptico",
  "Sobrenatural", "Escolar", "Artes Marciales", "Mecha", "Slice of Life"
];

const PREDEFINED_TAGS: string[] = [
  "destacado", "magia", "espadas", "reencarnación", "sistema", 
  "cultivo", "harén", "protagonista astuto", "protagonista OP", "academia", 
  "monstruos", "tecnología avanzada", "viajes en el tiempo", "isekai", "supervivencia", 
  "venganza", "comedia romántica", "drama psicológico", "construcción de mundos", "elementos de juego",
  "no humano", "política", "guerra", "amistad", "familia", "traición"
];

export default function NovelBrowser({ initialNovels }: NovelBrowserProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const featuredNovels = useMemo(() => {
    return initialNovels.filter(novel => 
      novel.etiquetas?.map(tag => tag.toLowerCase()).includes('destacado')
    );
  }, [initialNovels]);

  const categoryCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    initialNovels.forEach(novel => {
      if (novel.categoria) {
        counts[novel.categoria] = (counts[novel.categoria] || 0) + 1;
      }
    });
    return counts;
  }, [initialNovels]);

  const tagCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    initialNovels.forEach(novel => {
      novel.etiquetas?.forEach(tag => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return counts;
  }, [initialNovels]);

  const uniqueCategories = useMemo(() => {
    const categories = new Set<string>(PREDEFINED_CATEGORIES);
    initialNovels.forEach(novel => {
      if (novel.categoria) {
        categories.add(novel.categoria);
      }
    });
    return Array.from(categories).sort();
  }, [initialNovels]);

  const uniqueTags = useMemo(() => {
    const tags = new Set<string>(PREDEFINED_TAGS);
    initialNovels.forEach(novel => {
      novel.etiquetas?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [initialNovels]);

  const filteredNovels = useMemo(() => {
    let novels = initialNovels;

    if (selectedCategory) {
      novels = novels.filter(novel => novel.categoria === selectedCategory);
    }

    if (selectedTag) {
      novels = novels.filter(novel => novel.etiquetas?.includes(selectedTag));
    }

    if (searchTerm) {
      novels = novels.filter(
        (novel) =>
          novel.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          novel.author.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return novels;
  }, [initialNovels, searchTerm, selectedCategory, selectedTag]);

  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category);
    setSelectedTag(null); 
  };

  const handleTagSelect = (tag: string | null) => {
    setSelectedTag(tag);
    setSelectedCategory(null); 
  };
  
  const clearAllFilters = () => {
    setSelectedCategory(null);
    setSelectedTag(null);
    setSearchTerm('');
  }

  if (!mounted) {
    return (
      <div className="space-y-8">
        <div className="py-8 sm:py-10 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="h-16 bg-muted rounded-xl animate-pulse"></div> {/* Search bar skeleton */}
          </div>
        </div>
        <div className="h-10 bg-muted rounded w-1/4 mb-4 animate-pulse mx-auto"></div> {/* Section title skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="bg-card p-4 rounded-lg shadow animate-pulse">
              <div className="aspect-[2/3] w-full bg-muted rounded-t-lg mb-3"></div>
              <div className="h-5 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const activeFilterCount = [selectedCategory, selectedTag, searchTerm].filter(Boolean).length;

  return (
    <div className="space-y-10">
      <section className="py-6 sm:py-8">
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar novelas por título o autor..."
              className="w-full pl-12 pr-4 py-3 rounded-lg shadow-lg text-base focus:ring-2 focus:ring-primary border-border h-14 sm:h-16 text-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Buscar novelas"
            />
          </div>
        </div>
      </section>

      {featuredNovels.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-primary flex items-center">
              <Star className="mr-3 h-6 w-6 sm:h-7 sm:w-7" />
              Novelas Destacadas
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {featuredNovels.slice(0,6).map((novel) => ( 
              <NovelCard key={`featured-${novel.id}`} novel={novel} />
            ))}
          </div>
          <Separator className="my-8 sm:my-10" />
        </section>
      )}
      
      <div className="grid md:grid-cols-12 gap-8">
        <aside className="md:col-span-3 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <LayoutGrid className="mr-2 h-5 w-5" />
                Categorías
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Badge
                variant={selectedCategory === null ? 'default' : 'secondary'}
                className="cursor-pointer text-sm px-3 py-1"
                onClick={() => handleCategorySelect(null)}
              >
                Todas ({initialNovels.length})
              </Badge>
              {uniqueCategories.map(category => (
                <Badge
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'secondary'}
                  className="cursor-pointer text-sm px-3 py-1"
                  onClick={() => handleCategorySelect(category)}
                >
                  {category} ({categoryCounts[category] || 0})
                </Badge>
              ))}
            </CardContent>
          </Card>

          <Card>
             <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Tags className="mr-2 h-5 w-5" />
                Etiquetas
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
               <Badge
                  variant={selectedTag === null ? 'default' : 'secondary'}
                  className="cursor-pointer text-sm px-3 py-1"
                  onClick={() => handleTagSelect(null)}
                >
                  Todas ({initialNovels.length})
                </Badge>
              {uniqueTags.map(tag => (
                <Badge
                  key={tag}
                  variant={selectedTag === tag ? 'default' : 'secondary'}
                  className="cursor-pointer text-sm px-3 py-1"
                  onClick={() => handleTagSelect(tag)}
                >
                  {tag} ({tagCounts[tag] || 0})
                </Badge>
              ))}
            </CardContent>
          </Card>
            {activeFilterCount > 0 && (
               <Button variant="outline" onClick={clearAllFilters} className="w-full">
                <FilterX className="mr-2 h-4 w-4" />
                Limpiar Filtros ({activeFilterCount})
              </Button>
            )}
        </aside>

        <main className="md:col-span-9">
          {filteredNovels.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredNovels.map((novel) => (
                <NovelCard key={novel.id} novel={novel} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 md:col-span-full">
              <BookX className="mx-auto h-16 w-16 text-muted-foreground mb-6" />
              <p className="text-2xl font-semibold text-foreground">No se encontraron novelas</p>
              {searchTerm || selectedCategory || selectedTag ? (
                <p className="mt-2 text-lg text-muted-foreground">
                  Intenta con otros términos de búsqueda o ajusta los filtros.
                </p>
              ) : (
                <p className="mt-2 text-lg text-muted-foreground">
                  Parece que no hay novelas disponibles en este momento. ¡Vuelve pronto!
                </p>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
