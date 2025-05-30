
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { Novel } from '@/lib/types';
import NovelCard from '@/components/novel/NovelCard';
import { Input } from '@/components/ui/input';
import { Search, BookX, Tags, LayoutGrid, Star, FilterX, ChevronLeft, ChevronRight } from 'lucide-react';
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
  "Sobrenatural", "Escolar", "Artes Marciales", "Mecha", "Slice of Life",
  "Psicológico", "Tragedia", "Superhéroes", "Crimen", "Militar"
];

const PREDEFINED_TAGS: string[] = [
  "destacado", "magia", "espadas", "reencarnación", "sistema", 
  "cultivo", "harén", "protagonista astuto", "protagonista OP", "academia", 
  "monstruos", "tecnología avanzada", "viajes en el tiempo", "isekai", "supervivencia", 
  "venganza", "comedia romántica", "drama psicológico", "construcción de mundos", "elementos de juego",
  "no humano", "política", "guerra", "amistad", "familia", "traición", "poderes", "secretos",
  "antihéroe", "imperio", "nobleza", "IA", "realidad virtual", "dioses", "demonios"
];

const ITEMS_PER_PAGE = 18;

export default function NovelBrowser({ initialNovels }: NovelBrowserProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const featuredNovels = useMemo(() => {
    return initialNovels.filter(novel => 
      novel.etiquetas?.some(tag => tag.toLowerCase() === 'destacado')
    );
  }, [initialNovels]);

  const nonFeaturedNovels = useMemo(() => {
    return initialNovels.filter(novel => 
      !novel.etiquetas?.some(tag => tag.toLowerCase() === 'destacado')
    );
  }, [initialNovels]);

  const allUniqueCategories = useMemo(() => {
    const categories = new Set<string>(PREDEFINED_CATEGORIES);
    initialNovels.forEach(novel => { // Use initialNovels to get all possible categories
      if (novel.categoria) {
        categories.add(novel.categoria);
      }
    });
    return Array.from(categories).sort();
  }, [initialNovels]);

  const allUniqueTags = useMemo(() => {
    const tags = new Set<string>(PREDEFINED_TAGS);
    initialNovels.forEach(novel => {
      novel.etiquetas?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [initialNovels]);


  useEffect(() => {
    setMounted(true);
    const query = searchParams.get('q');
    if (query) {
      setSearchTerm(query);
      setCurrentPage(1);
      const lowerQuery = query.toLowerCase();

      if (lowerQuery.startsWith('categoría:')) {
        const categoryValue = query.substring(10).trim();
        const matchedCategory = allUniqueCategories.find(c => c.toLowerCase() === categoryValue.toLowerCase());
        setSelectedCategory(matchedCategory || categoryValue); // Use matched for proper casing if found
        setSelectedTag(null);
      } else if (lowerQuery.startsWith('etiqueta:')) {
        const tagValue = query.substring(9).trim();
        const matchedTag = allUniqueTags.find(t => t.toLowerCase() === tagValue.toLowerCase());
        setSelectedTag(matchedTag || tagValue);
        setSelectedCategory(null);
      } else if (lowerQuery.startsWith('autor:') || lowerQuery.startsWith('traductor:')) {
        setSelectedCategory(null);
        setSelectedTag(null);
      }
    } else {
        // If no query, and if filters were set by URL previously, consider resetting them
        // For now, let badge clicks and clear button handle explicit resets.
    }
  }, [searchParams, allUniqueCategories, allUniqueTags]);


  const categoryCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    nonFeaturedNovels.forEach(novel => {
      if (novel.categoria) {
        counts[novel.categoria] = (counts[novel.categoria] || 0) + 1;
      }
    });
    PREDEFINED_CATEGORIES.forEach(cat => {
      if (!(cat in counts)) counts[cat] = 0;
    });
    return counts;
  }, [nonFeaturedNovels]);

  const tagCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    nonFeaturedNovels.forEach(novel => {
      novel.etiquetas?.forEach(tag => {
        if (tag.toLowerCase() !== 'destacado') { // Exclude 'destacado' from general tag counts
            counts[tag] = (counts[tag] || 0) + 1;
        }
      });
    });
     PREDEFINED_TAGS.forEach(tag => {
      if (tag.toLowerCase() !== 'destacado' && !(tag in counts)) {
        counts[tag] = 0;
      }
    });
    return counts;
  }, [nonFeaturedNovels]);


  const filteredNovels = useMemo(() => {
    let novels = [...nonFeaturedNovels];
    const lowerSearchTerm = searchTerm.toLowerCase();

    let authorQuery: string | null = null;
    let translatorQuery: string | null = null;
    let categoryQueryFromSearch: string | null = null;
    let tagQueryFromSearch: string | null = null;
    let generalQueryText = lowerSearchTerm;

    // Parse search term for prefixes
    if (lowerSearchTerm.startsWith('autor:')) {
      authorQuery = lowerSearchTerm.substring(6).split(' ')[0].trim();
      generalQueryText = lowerSearchTerm.substring(6 + (authorQuery?.length || 0)).trim();
    } else if (lowerSearchTerm.startsWith('traductor:')) {
      translatorQuery = lowerSearchTerm.substring(10).split(' ')[0].trim();
      generalQueryText = lowerSearchTerm.substring(10 + (translatorQuery?.length || 0)).trim();
    } else if (lowerSearchTerm.startsWith('categoría:')) {
      categoryQueryFromSearch = lowerSearchTerm.substring(10).trim();
      generalQueryText = ""; // If searching by category prefix, no general text search
    } else if (lowerSearchTerm.startsWith('etiqueta:')) {
      tagQueryFromSearch = lowerSearchTerm.substring(9).trim();
      generalQueryText = ""; // If searching by tag prefix, no general text search
    }
    generalQueryText = generalQueryText.trim();

    // Apply filters
    novels = novels.filter(novel => {
      // Category filter: use category from search term if present, otherwise use badge-selected category
      const activeCategoryFilter = categoryQueryFromSearch || selectedCategory;
      if (activeCategoryFilter && novel.categoria?.toLowerCase() !== activeCategoryFilter.toLowerCase()) {
        return false;
      }

      // Tag filter: use tag from search term if present, otherwise use badge-selected tag
      const activeTagFilter = tagQueryFromSearch || selectedTag;
      if (activeTagFilter && !novel.etiquetas?.map(t => t.toLowerCase()).includes(activeTagFilter.toLowerCase())) {
        return false;
      }

      // Author filter (only from search term)
      if (authorQuery && !novel.author.toLowerCase().includes(authorQuery)) {
        return false;
      }

      // Translator filter (only from search term)
      if (translatorQuery && !(novel.traductor?.toLowerCase().includes(translatorQuery))) {
        return false;
      }
      
      // General text query (applies if not overridden by specific prefix search type)
      if (generalQueryText) {
        const titleMatch = novel.title.toLowerCase().includes(generalQueryText);
        const authorGeneralMatch = !authorQuery && novel.author.toLowerCase().includes(generalQueryText);
        if (!titleMatch && !authorGeneralMatch) {
            return false;
        }
      }
      return true;
    });
    return novels;
  }, [nonFeaturedNovels, searchTerm, selectedCategory, selectedTag]);

  const totalPages = Math.ceil(filteredNovels.length / ITEMS_PER_PAGE);
  const paginatedNovels = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredNovels.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredNovels, currentPage]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    setCurrentPage(1); 

    const lowerNewSearchTerm = newSearchTerm.toLowerCase();
    if (lowerNewSearchTerm.startsWith('categoría:')) {
      const catVal = lowerNewSearchTerm.substring(10).trim();
      const matchedCategory = allUniqueCategories.find(c => c.toLowerCase() === catVal.toLowerCase());
      setSelectedCategory(matchedCategory || catVal); // This will be used by filter
      setSelectedTag(null);
    } else if (lowerNewSearchTerm.startsWith('etiqueta:')) {
      const tagVal = lowerNewSearchTerm.substring(9).trim();
      const matchedTag = allUniqueTags.find(t => t.toLowerCase() === tagVal.toLowerCase());
      setSelectedTag(matchedTag || tagVal);
      setSelectedCategory(null);
    } else if (!newSearchTerm.match(/^(categoría:|etiqueta:|autor:|traductor:)/i)) {
      // If general search, clear badge selections
      // This behavior can be debated, but often users expect search to override badges.
      // setSelectedCategory(null); 
      // setSelectedTag(null);
      // Let's not clear them automatically, let clear button or new badge click do it.
    }
  };
  
  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category);
    setSelectedTag(null); // Clear tag filter when a category is selected
    setCurrentPage(1);
    // If a category badge is clicked, update the search term to reflect this or clear it.
    if (category) {
      setSearchTerm(`Categoría:${category}`);
    } else {
      // If "Todas las categorías" is clicked, clear category part of search term,
      // but keep other parts like author/tag if they were there.
      // For simplicity, let's clear the search term if "Todas" is clicked.
      setSearchTerm('');
    }
    router.push('/', { scroll: false }); 
  };

  const handleTagSelect = (tag: string | null) => {
    setSelectedTag(tag);
    setSelectedCategory(null); // Clear category filter when a tag is selected
    setCurrentPage(1);
    if (tag) {
      setSearchTerm(`Etiqueta:${tag}`);
    } else {
      setSearchTerm('');
    }
    router.push('/', { scroll: false }); 
  };
  
  const clearAllFilters = () => {
    setSelectedCategory(null);
    setSelectedTag(null);
    setSearchTerm('');
    setCurrentPage(1);
    router.push('/', { scroll: false });
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo(0, 0); 
  };

  if (!mounted) {
    return (
      <div className="space-y-8">
        <div className="py-8 sm:py-10 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="h-14 sm:h-16 bg-muted rounded-xl animate-pulse"></div>
          </div>
        </div>
        <div className="h-10 bg-muted rounded w-1/4 mb-4 animate-pulse mx-auto"></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
          {[...Array(ITEMS_PER_PAGE)].map((_, index) => (
            <div key={index} className="bg-card p-3 rounded-lg shadow animate-pulse">
              <div className="aspect-[3/4] w-full bg-muted rounded-t-md mb-2"></div>
              <div className="h-4 bg-muted rounded w-3/4 mb-1.5"></div>
              <div className="h-3 bg-muted rounded w-1/2 mb-1.5"></div>
              <div className="h-3 bg-muted rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const activeFilterCount = [selectedCategory, selectedTag, searchTerm ? 'search' : null].filter(Boolean).length;

  return (
    <div className="space-y-10">
      <section className="py-6 sm:py-8">
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por título, autor, traductor, categoría o etiqueta (ej: Autor:Nombre)..."
              className="w-full pl-12 pr-4 py-3 rounded-lg shadow-xl text-base focus:ring-2 focus:ring-primary border-border h-14 sm:h-16 text-lg"
              value={searchTerm}
              onChange={handleSearchChange}
              aria-label="Buscar novelas"
            />
          </div>
        </div>
      </section>

      {featuredNovels.length > 0 && !selectedCategory && !selectedTag && !searchTerm && (
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
                variant={selectedCategory === null && !searchTerm.toLowerCase().startsWith('categoría:') ? 'default' : 'outline'}
                className="cursor-pointer text-sm px-3 py-1.5"
                onClick={() => handleCategorySelect(null)}
              >
                Todas ({nonFeaturedNovels.length})
              </Badge>
              {allUniqueCategories.map(category => (
                (categoryCounts[category] > 0 || PREDEFINED_CATEGORIES.includes(category)) &&
                <Badge
                  key={category}
                  variant={selectedCategory === category || searchTerm.toLowerCase() === `categoría:${category.toLowerCase()}` ? 'default' : 'outline'}
                  className="cursor-pointer text-sm px-3 py-1.5"
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
                  variant={selectedTag === null && !searchTerm.toLowerCase().startsWith('etiqueta:') ? 'default' : 'outline'}
                  className="cursor-pointer text-sm px-3 py-1.5"
                  onClick={() => handleTagSelect(null)}
                >
                  Todas ({nonFeaturedNovels.length})
                </Badge>
              {allUniqueTags.map(tag => (
                (tagCounts[tag] > 0 || PREDEFINED_TAGS.includes(tag)) && 
                tag.toLowerCase() !== 'destacado' &&
                <Badge
                  key={tag}
                  variant={selectedTag === tag || searchTerm.toLowerCase() === `etiqueta:${tag.toLowerCase()}` ? 'default' : 'outline'}
                  className="cursor-pointer text-sm px-3 py-1.5"
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
          <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-6">
            { selectedCategory ? `Categoría: ${selectedCategory}` : 
              selectedTag ? `Etiqueta: ${selectedTag}` : 
              searchTerm.toLowerCase().startsWith('categoría:') ? `Categoría: ${searchTerm.substring(10)}` :
              searchTerm.toLowerCase().startsWith('etiqueta:') ? `Etiqueta: ${searchTerm.substring(9)}` :
              searchTerm.toLowerCase().startsWith('autor:') ? `Autor: ${searchTerm.substring(6).split(' ')[0]}`:
              searchTerm.toLowerCase().startsWith('traductor:') ? `Traductor: ${searchTerm.substring(10).split(' ')[0]}`:
              searchTerm ? "Resultados de Búsqueda" : 
              "Todas las Novelas"}
             { (selectedCategory || selectedTag || searchTerm) && ` (${filteredNovels.length})`}
          </h2>
          {paginatedNovels.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 sm:gap-6">
                {paginatedNovels.map((novel) => (
                  <NovelCard key={novel.id} novel={novel} />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="mt-10 flex justify-center items-center space-x-4">
                  <Button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    variant="outline"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    variant="outline"
                  >
                    Siguiente
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
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

