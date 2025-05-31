
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { Novel } from '@/lib/types';
import NovelCard from '@/components/novel/NovelCard';
import { Input } from '@/components/ui/input';
import { Search, BookX, Tags, LayoutGrid, Star, FilterX, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
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
  "magia", "espadas", "reencarnación", "sistema",
  "cultivo", "harén", "protagonista astuto", "protagonista OP", "academia",
  "monstruos", "tecnología avanzada", "viajes en el tiempo", "isekai", "supervivencia",
  "venganza", "comedia romántica", "drama psicológico", "construcción de mundos", "elementos de juego",
  "no humano", "política", "guerra", "amistad", "familia", "traición", "poderes", "secretos",
  "antihéroe", "imperio", "nobleza", "IA", "realidad virtual", "dioses", "demonios"
];

const ITEMS_PER_PAGE = 24;

export default function NovelBrowser({ initialNovels }: NovelBrowserProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setMounted(true);
    const query = searchParams.get('q');
    if (query) {
      setSearchTerm(query);
      setCurrentPage(1); // Reset page on new search from URL

      const lowerQuery = query.toLowerCase().trim();
      if (lowerQuery.startsWith('categoría:')) {
        const categoryValue = query.substring(10).trim();
        setSelectedCategory(categoryValue);
        setSelectedTag(null);
      } else if (lowerQuery.startsWith('etiqueta:')) {
        const tagValue = query.substring(9).trim();
        setSelectedTag(tagValue);
        setSelectedCategory(null);
      } else if (lowerQuery.startsWith('autor:') || lowerQuery.startsWith('traductor:')) {
        setSelectedCategory(null);
        setSelectedTag(null);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    setCurrentPage(1); // Reset page when filters change
  }, [selectedCategory, selectedTag, searchTerm]);

  const featuredNovels = useMemo(() => {
    return initialNovels.filter(novel =>
      novel.etiquetas?.some(tag => tag.toLowerCase() === 'destacado')
    );
  }, [initialNovels]);

  const allUniqueCategories = useMemo(() => {
    const categoriesFromNovels = new Set<string>();
    initialNovels.forEach(novel => {
      if (novel.categoria) {
        categoriesFromNovels.add(novel.categoria);
      }
    });
    return Array.from(new Set([...PREDEFINED_CATEGORIES, ...categoriesFromNovels])).sort();
  }, [initialNovels]);

  const allUniqueTags = useMemo(() => {
    const tagsFromNovels = new Set<string>();
    initialNovels.forEach(novel => {
      novel.etiquetas?.forEach(tag => {
        if (tag.toLowerCase() !== 'destacado') {
          tagsFromNovels.add(tag);
        }
      });
    });
    return Array.from(new Set([...PREDEFINED_TAGS, ...tagsFromNovels])).sort();
  }, [initialNovels]);

  const categoryCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    initialNovels.forEach(novel => {
      if (novel.categoria) {
        counts[novel.categoria] = (counts[novel.categoria] || 0) + 1;
      }
    });
    PREDEFINED_CATEGORIES.forEach(cat => {
      if (!(cat in counts)) counts[cat] = 0;
    });
    return counts;
  }, [initialNovels]);

  const tagCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    initialNovels.forEach(novel => {
      novel.etiquetas?.forEach(tag => {
        if (tag.toLowerCase() !== 'destacado') {
          counts[tag] = (counts[tag] || 0) + 1;
        }
      });
    });
    PREDEFINED_TAGS.forEach(tag => {
      if (!(tag in counts)) counts[tag] = 0;
    });
    return counts;
  }, [initialNovels]);

  const filteredNovels = useMemo(() => {
    let novelsToFilter = [...initialNovels];
    const lowerSearchTerm = searchTerm.toLowerCase().trim();

    let authorQuery: string | null = null;
    let translatorQuery: string | null = null;
    // categoryQueryFromSearchInput and tagQueryFromSearchInput are not strictly needed for filtering
    // as selectedCategory/selectedTag (UI state) are kept in sync by handleSearchChange.
    // We primarily rely on selectedCategory and selectedTag for filtering.
    let generalSearchText = "";

    if (lowerSearchTerm.startsWith('autor:')) {
      authorQuery = lowerSearchTerm.substring(6).trim();
    } else if (lowerSearchTerm.startsWith('traductor:')) {
      translatorQuery = lowerSearchTerm.substring(10).trim();
    } else if (lowerSearchTerm.startsWith('categoría:')) {
      // The actual filtering for category is handled by selectedCategory state,
      // which is updated by handleSearchChange. No need for generalSearchText here.
    } else if (lowerSearchTerm.startsWith('etiqueta:')) {
      // Similar to category, selectedTag handles this.
    } else {
      generalSearchText = lowerSearchTerm; // Only if no specific prefix, it's a general search term
    }
    
    novelsToFilter = novelsToFilter.filter(novel => {
      // Filter by UI-selected category (driven by badges or "Categoría:" prefix)
      if (selectedCategory && novel.categoria?.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }

      // Filter by UI-selected tag (driven by badges or "Etiqueta:" prefix)
      if (selectedTag && !novel.etiquetas?.map(t => t.toLowerCase()).includes(selectedTag.toLowerCase())) {
        return false;
      }
      
      // Filter by author query from "Autor:" prefix
      if (authorQuery && !novel.author.toLowerCase().includes(authorQuery)) {
        return false;
      }
      
      // Filter by translator query from "Traductor:" prefix
      if (translatorQuery && !(novel.traductor?.toLowerCase().includes(translatorQuery))) {
        return false;
      }
      
      // Filter by general search text (only if no specific field prefix like Autor/Traductor was used)
      if (generalSearchText) {
        const titleMatch = novel.title.toLowerCase().includes(generalSearchText);
        const authorGeneralMatch = novel.author.toLowerCase().includes(generalSearchText);
        const translatorGeneralMatch = novel.traductor?.toLowerCase().includes(generalSearchText);
        
        if (!titleMatch && !authorGeneralMatch && !translatorGeneralMatch) {
          return false;
        }
      }
      
      return true;
    });
    return novelsToFilter;
  }, [initialNovels, searchTerm, selectedCategory, selectedTag]);

  const totalPages = Math.ceil(filteredNovels.length / ITEMS_PER_PAGE);
  const paginatedNovels = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredNovels.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredNovels, currentPage]);

  const filteredNovelsTitle = useMemo(() => {
    if (selectedCategory) return `Categoría: ${selectedCategory}`;
    if (selectedTag) return `Etiqueta: ${selectedTag}`;
    const lowerSearch = searchTerm.toLowerCase().trim();
    if (lowerSearch.startsWith('categoría:')) return `Categoría: ${searchTerm.substring(10).trim()}`;
    if (lowerSearch.startsWith('etiqueta:')) return `Etiqueta: ${searchTerm.substring(9).trim()}`;
    if (lowerSearch.startsWith('autor:')) return `Autor: ${searchTerm.substring(6).trim()}`;
    if (lowerSearch.startsWith('traductor:')) return `Traductor: ${searchTerm.substring(10).trim()}`;
    if (searchTerm.trim()) return "Resultados de Búsqueda";
    return "Todas las Novelas";
  }, [searchTerm, selectedCategory, selectedTag]);


  if (!mounted) {
    return (
      <div className="space-y-8 py-10">
        <div className="flex flex-col items-center justify-center text-center">
          <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
          <p className="text-lg text-muted-foreground">Cargando novelas...</p>
        </div>
        <div className="py-8 sm:py-10 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="h-14 sm:h-16 bg-muted rounded-xl animate-pulse"></div>
          </div>
        </div>
        <div className="h-10 bg-muted rounded w-1/4 mb-4 animate-pulse mx-auto"></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 animate-pulse">
          {[...Array(ITEMS_PER_PAGE > 12 ? 12 : ITEMS_PER_PAGE)].map((_, index) => (
            <div key={index} className="bg-card p-3 rounded-lg shadow">
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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm); // Update search term state

    const lowerNewSearchTerm = newSearchTerm.toLowerCase().trim();

    // Update UI filter states (selectedCategory, selectedTag) based on search term prefixes
    if (lowerNewSearchTerm.startsWith('categoría:')) {
      const catVal = newSearchTerm.substring(10).trim(); // Use original casing for display
      setSelectedCategory(catVal);
      setSelectedTag(null);
    } else if (lowerNewSearchTerm.startsWith('etiqueta:')) {
      const tagVal = newSearchTerm.substring(9).trim(); // Use original casing for display
      setSelectedTag(tagVal);
      setSelectedCategory(null);
    } else if (lowerNewSearchTerm.startsWith('autor:') || lowerNewSearchTerm.startsWith('traductor:')) {
      // If searching by author/translator prefix, clear badge-selected category/tag
      setSelectedCategory(null);
      setSelectedTag(null);
    } else if (lowerNewSearchTerm === "") {
      // If search term is cleared, reset UI filters
      setSelectedCategory(null);
      setSelectedTag(null);
    }
    // If it's a general text search (no prefix and not empty), selectedCategory/Tag remain as they were (if set by badges).
  };

  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category);
    setSelectedTag(null); // Clear tag filter when category is selected
    if (category) {
      setSearchTerm(`Categoría:${category}`); // Update search box to reflect badge click
    } else {
      setSearchTerm(''); // Clear search box if "Todas" categories is clicked
    }
    router.push(`/?q=${category ? `Categoría:${encodeURIComponent(category)}` : ''}`, { scroll: false });
  };

  const handleTagSelect = (tag: string | null) => {
    setSelectedTag(tag);
    setSelectedCategory(null); // Clear category filter when tag is selected
    if (tag) {
      setSearchTerm(`Etiqueta:${tag}`); // Update search box
    } else {
      setSearchTerm(''); // Clear search box
    }
    router.push(`/?q=${tag ? `Etiqueta:${encodeURIComponent(tag)}` : ''}`, { scroll: false });
  };

  const clearAllFilters = () => {
    setSelectedCategory(null);
    setSelectedTag(null);
    setSearchTerm('');
    router.push('/', { scroll: false });
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo(0, 0);
  };

  const activeFilterCount = [selectedCategory, selectedTag, searchTerm.trim() ? 'search' : null].filter(Boolean).length;
  const isFiltering = selectedCategory || selectedTag || searchTerm.trim();

  return (
    <div className="space-y-10">
      <section className="py-6 sm:py-8">
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por título, autor, o usar Categoría:/Etiqueta:/Autor:/Traductor:"
              className="w-full pl-12 pr-4 py-3 rounded-lg shadow-xl text-base focus:ring-2 focus:ring-primary border-border h-14 sm:h-16 text-lg"
              value={searchTerm}
              onChange={handleSearchChange}
              aria-label="Buscar novelas"
            />
          </div>
        </div>
      </section>

      {featuredNovels.length > 0 && !isFiltering && (
        <section className="bg-gradient-to-br from-primary/10 via-background to-background py-8 rounded-xl shadow-lg border border-primary/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-primary flex items-center mb-6">
              <Star className="mr-3 h-7 w-7 text-amber-400" />
              Novelas Destacadas
            </h2>
            <div className="flex overflow-x-auto space-x-4 sm:space-x-6 pb-4 -mx-4 px-4">
              {featuredNovels.slice(0,10).map((novel) => (
                <div key={`featured-${novel.id}`} className="flex-none w-40 sm:w-48 md:w-52">
                  <NovelCard novel={novel} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      
      {isFiltering && featuredNovels.length > 0 && <Separator className="my-8 sm:my-10" />}


      <section>
        <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-6">
            {filteredNovelsTitle}
            {(isFiltering || searchTerm.trim()) && ` (${filteredNovels.length})`}
        </h2>
        {paginatedNovels.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
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
            {isFiltering ? (
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
      </section>

      <Separator className="my-10 sm:my-12" />
        
      {activeFilterCount > 0 && (
        <div className="mb-6 text-center">
            <Button variant="outline" onClick={clearAllFilters} className="w-full sm:w-auto">
                <FilterX className="mr-2 h-4 w-4" />
                Limpiar Filtros ({activeFilterCount})
            </Button>
        </div>
      )}

      <section className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <LayoutGrid className="mr-2 h-5 w-5" />
              Categorías
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Badge
              variant={selectedCategory === null ? 'default' : 'outline'}
              className="cursor-pointer text-sm px-3 py-1.5"
              onClick={() => handleCategorySelect(null)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleCategorySelect(null)}
            >
              Todas ({initialNovels.length})
            </Badge>
            {allUniqueCategories.map(category => (
              (categoryCounts[category] > 0 || PREDEFINED_CATEGORIES.includes(category)) &&
              <Badge
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                className="cursor-pointer text-sm px-3 py-1.5"
                onClick={() => handleCategorySelect(category)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleCategorySelect(category)}
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
                    variant={selectedTag === null ? 'default' : 'outline'}
                    className="cursor-pointer text-sm px-3 py-1.5"
                    onClick={() => handleTagSelect(null)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleTagSelect(null)}
                >
                    Todas ({initialNovels.length})
                </Badge>
            {allUniqueTags.map(tag => (
                (tagCounts[tag] > 0 || PREDEFINED_TAGS.includes(tag)) &&
                <Badge
                    key={tag}
                    variant={selectedTag === tag ? 'default' : 'outline'}
                    className="cursor-pointer text-sm px-3 py-1.5"
                    onClick={() => handleTagSelect(tag)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleTagSelect(tag)}
                >
                    {tag} ({tagCounts[tag] || 0})
                </Badge>
            ))}
            </CardContent>
        </Card>
      </section>
    </div>
  );
}

    