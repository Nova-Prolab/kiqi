
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { Novel, AgeRating, NovelStatus } from '@/lib/types';
import { AGE_RATING_VALUES, STATUS_VALUES } from '@/lib/types';
import NovelCard from '@/components/novel/NovelCard';
import { Input } from '@/components/ui/input';
import { Search, BookX, Tags, LayoutGrid, Star, FilterX, ChevronLeft, ChevronRight, Loader2, Shield, ClockIcon, Library, User, Tag as TagIcon, FileSearch, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AgeRatingBadge from '@/components/ui/AgeRatingBadge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

const ageRatingLabels: Record<AgeRating, string> = {
  all: 'Todos',
  pg: '+10',
  teen: '+13',
  mature: '+17',
  adults: '+18',
};

const novelStatusLabels: Record<NovelStatus, string> = {
  ongoing: 'En curso',
  completed: 'Completada',
  hiatus: 'En Hiato',
  dropped: 'Abandonada',
};

const ITEMS_PER_PAGE = 24;

type SearchType = 'title' | 'author' | 'category_search' | 'tag_search' | 'translator';

const searchTypeOptions: { value: SearchType, label: string, icon: React.ElementType }[] = [
    { value: 'title', label: 'Título', icon: Library },
    { value: 'author', label: 'Autor', icon: User },
    { value: 'category_search', label: 'Categoría', icon: LayoutGrid },
    { value: 'tag_search', label: 'Etiqueta', icon: TagIcon },
    { value: 'translator', label: 'Traductor', icon: Users },
];

export default function NovelBrowser({ initialNovels }: NovelBrowserProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [currentInputText, setCurrentInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('title');

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedAgeRating, setSelectedAgeRating] = useState<AgeRating | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<NovelStatus | null>(null);
  const [mounted, setMounted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const updateURLParams = useCallback(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('q', searchTerm);
    if (searchType !== 'title') params.set('st', searchType);
    
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedTag) params.set('tag', selectedTag);
    if (selectedAgeRating) params.set('ageRating', selectedAgeRating);
    if (selectedStatus) params.set('status', selectedStatus);
    
    router.push(`?${params.toString()}`, { scroll: false });
  }, [searchTerm, searchType, selectedCategory, selectedTag, selectedAgeRating, selectedStatus, router]);


  useEffect(() => {
    setMounted(true);
    const queryParam = searchParams.get('q') || '';
    const searchTypeParam = searchParams.get('st') as SearchType | null;
    const categoryQuery = searchParams.get('category');
    const tagQuery = searchParams.get('tag');
    const ageQuery = searchParams.get('ageRating') as AgeRating | null;
    const statusQuery = searchParams.get('status') as NovelStatus | null;

    setCurrentInputText(queryParam);
    setSearchTerm(queryParam);
    if (searchTypeParam && searchTypeOptions.some(opt => opt.value === searchTypeParam)) {
        setSearchType(searchTypeParam);
    } else {
        setSearchType('title');
    }

    if (categoryQuery) setSelectedCategory(categoryQuery);
    if (tagQuery) setSelectedTag(tagQuery);
    if (ageQuery && AGE_RATING_VALUES.includes(ageQuery)) setSelectedAgeRating(ageQuery);
    if (statusQuery && STATUS_VALUES.includes(statusQuery)) setSelectedStatus(statusQuery);
    
    setCurrentPage(1);
  }, [searchParams]);


  const handleSearchExecute = useCallback(() => {
    setSearchTerm(currentInputText);
    setCurrentPage(1);
    if (currentInputText.trim() && (searchType === 'category_search' || searchType === 'tag_search')) {
      setSelectedCategory(null);
      setSelectedTag(null);
    }
  }, [currentInputText, searchType]);

  useEffect(() => {
    if(mounted) {
        updateURLParams();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, searchType, selectedCategory, selectedTag, selectedAgeRating, selectedStatus, mounted]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentInputText(e.target.value);
  };
  
  const handleSearchTypeChange = (value: string) => {
    setSearchType(value as SearchType);
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSearchExecute();
  };
  
  const featuredNovels = useMemo(() => {
    return initialNovels.filter(novel =>
      novel.etiquetas?.some(tag => tag.toLowerCase() === 'destacado')
    );
  }, [initialNovels]);

  const allUniqueCategories = useMemo(() => {
    const categoriesFromNovels = new Set<string>();
    initialNovels.forEach(novel => {
      if (novel.categoria) categoriesFromNovels.add(novel.categoria);
    });
    return Array.from(new Set([...PREDEFINED_CATEGORIES, ...categoriesFromNovels])).sort();
  }, [initialNovels]);

  const allUniqueTags = useMemo(() => {
    const tagsFromNovels = new Set<string>();
    initialNovels.forEach(novel => {
      novel.etiquetas?.forEach(tag => {
        if (tag.toLowerCase() !== 'destacado') tagsFromNovels.add(tag);
      });
    });
    return Array.from(new Set([...PREDEFINED_TAGS, ...tagsFromNovels])).sort();
  }, [initialNovels]);

  const categoryCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    initialNovels.forEach(novel => {
      if (novel.categoria) counts[novel.categoria] = (counts[novel.categoria] || 0) + 1;
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
        if (tag.toLowerCase() !== 'destacado') counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    PREDEFINED_TAGS.forEach(tag => {
      if (!(tag in counts)) counts[tag] = 0;
    });
    return counts;
  }, [initialNovels]);

  const ageRatingCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    initialNovels.forEach(novel => {
      if (novel.ageRating) counts[novel.ageRating] = (counts[novel.ageRating] || 0) + 1;
    });
    AGE_RATING_VALUES.forEach(ar => {
      if (!(ar in counts)) counts[ar] = 0;
    });
    return counts;
  }, [initialNovels]);

  const statusCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    initialNovels.forEach(novel => {
      if (novel.status) counts[novel.status] = (counts[novel.status] || 0) + 1;
    });
    STATUS_VALUES.forEach(st => {
      if (!(st in counts)) counts[st] = 0;
    });
    return counts;
  }, [initialNovels]);

  const filteredNovels = useMemo(() => {
    let novelsToFilter = [...initialNovels];
    const normalizedSearchTerm = searchTerm.toLowerCase().trim();

    if (selectedCategory) {
      novelsToFilter = novelsToFilter.filter(novel => novel.categoria?.trim().toLowerCase() === selectedCategory.toLowerCase());
    }
    if (selectedTag) {
      novelsToFilter = novelsToFilter.filter(novel => novel.etiquetas?.map(t => t.trim().toLowerCase()).includes(selectedTag.toLowerCase()));
    }
    if (selectedAgeRating) {
      novelsToFilter = novelsToFilter.filter(novel => novel.ageRating === selectedAgeRating);
    }
    if (selectedStatus) {
      novelsToFilter = novelsToFilter.filter(novel => novel.status === selectedStatus);
    }

    if (normalizedSearchTerm) {
      novelsToFilter = novelsToFilter.filter(novel => {
        switch (searchType) {
          case 'title':
            return novel.title.trim().toLowerCase().includes(normalizedSearchTerm);
          case 'author':
            return novel.author.trim().toLowerCase().includes(normalizedSearchTerm);
          case 'category_search':
            return novel.categoria?.trim().toLowerCase().includes(normalizedSearchTerm);
          case 'tag_search':
            return novel.etiquetas?.some(tag => tag.trim().toLowerCase().includes(normalizedSearchTerm));
          case 'translator':
            return novel.traductor?.trim().toLowerCase().includes(normalizedSearchTerm);
          default:
            return true;
        }
      });
    }
    return novelsToFilter;
  }, [initialNovels, searchTerm, searchType, selectedCategory, selectedTag, selectedAgeRating, selectedStatus]);

  const totalPages = Math.ceil(filteredNovels.length / ITEMS_PER_PAGE);
  const paginatedNovels = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredNovels.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredNovels, currentPage]);

  const filteredNovelsTitle = useMemo(() => {
    if (selectedCategory) return `Categoría: ${selectedCategory}`;
    if (selectedTag) return `Etiqueta: ${selectedTag}`;
    if (selectedAgeRating) return `Clasificación: ${ageRatingLabels[selectedAgeRating]}`;
    if (selectedStatus) return `Estado: ${novelStatusLabels[selectedStatus]}`;
    if (searchTerm.trim()) {
        const typeLabel = searchTypeOptions.find(opt => opt.value === searchType)?.label || 'Búsqueda';
        return `${typeLabel}: "${searchTerm.trim()}"`;
    }
    return "Todas las Novelas";
  }, [searchTerm, searchType, selectedCategory, selectedTag, selectedAgeRating, selectedStatus]);

  const handleBadgeCategorySelect = (category: string | null) => {
    setSelectedCategory(category);
    if (category) {
      setCurrentInputText(''); setSearchTerm(''); setSearchType('title');
      setSelectedTag(null); setSelectedAgeRating(null); setSelectedStatus(null);
    }
    setCurrentPage(1);
  };

  const handleBadgeTagSelect = (tag: string | null) => {
    setSelectedTag(tag);
     if (tag) {
      setCurrentInputText(''); setSearchTerm(''); setSearchType('title');
      setSelectedCategory(null); setSelectedAgeRating(null); setSelectedStatus(null);
    }
    setCurrentPage(1);
  };

  const handleBadgeAgeRatingSelect = (ageRating: AgeRating | null) => {
    setSelectedAgeRating(ageRating);
    if (ageRating) {
      setCurrentInputText(''); setSearchTerm(''); setSearchType('title');
      setSelectedCategory(null); setSelectedTag(null); setSelectedStatus(null);
    }
    setCurrentPage(1);
  };

  const handleBadgeStatusSelect = (status: NovelStatus | null) => {
    setSelectedStatus(status);
     if (status) {
      setCurrentInputText(''); setSearchTerm(''); setSearchType('title');
      setSelectedCategory(null); setSelectedTag(null); setSelectedAgeRating(null);
    }
    setCurrentPage(1);
  };

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

  const clearAllFilters = () => {
    setCurrentInputText('');
    setSearchTerm('');
    setSearchType('title');
    setSelectedCategory(null);
    setSelectedTag(null);
    setSelectedAgeRating(null);
    setSelectedStatus(null);
    setCurrentPage(1);
    router.push('/', { scroll: false });
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo(0, 0);
  };

  const activeTextSearch = searchTerm.trim().length > 0;
  const activeBadgeFilters = selectedCategory || selectedTag || selectedAgeRating || selectedStatus;
  const totalActiveFilterCount = (activeTextSearch ? 1 : 0) + [selectedCategory, selectedTag, selectedAgeRating, selectedStatus].filter(Boolean).length;
  const isFiltering = activeTextSearch || activeBadgeFilters;

  return (
    <div className="space-y-10">
      <section className="py-6 sm:py-8">
        <form onSubmit={handleFormSubmit} className="max-w-3xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="flex-none w-full sm:w-auto mb-2 sm:mb-0">
                <Select value={searchType} onValueChange={handleSearchTypeChange}>
                    <SelectTrigger className="h-14 sm:h-16 text-base shadow-lg rounded-lg border-border focus:ring-2 focus:ring-primary w-full sm:w-[180px]">
                         <SelectValue placeholder="Tipo de búsqueda" />
                    </SelectTrigger>
                    <SelectContent>
                        {searchTypeOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center">
                                    <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                                    {option.label}
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="relative flex-grow w-full">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Introduce tu búsqueda..."
                className="w-full pl-12 pr-4 py-3 rounded-lg shadow-xl text-base focus:ring-2 focus:ring-primary border-border h-14 sm:h-16 text-lg"
                value={currentInputText}
                onChange={handleInputChange}
                aria-label="Término de búsqueda"
              />
            </div>
            <Button type="submit" size="lg" className="h-14 sm:h-16 text-base shadow-lg w-full sm:w-auto mt-2 sm:mt-0">
                <FileSearch className="mr-2 h-5 w-5"/>
                Buscar
            </Button>
          </div>
        </form>
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
            {` (${filteredNovels.length})`}
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
                <Button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} variant="outline">
                  <ChevronLeft className="mr-2 h-4 w-4" /> Anterior
                </Button>
                <span className="text-sm text-muted-foreground">Página {currentPage} de {totalPages}</span>
                <Button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} variant="outline">
                  Siguiente <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 md:col-span-full">
            <BookX className="mx-auto h-16 w-16 text-muted-foreground mb-6" />
            <p className="text-2xl font-semibold text-foreground">No se encontraron novelas</p>
            {isFiltering ? (
              <p className="mt-2 text-lg text-muted-foreground">Intenta con otros términos de búsqueda o ajusta los filtros.</p>
            ) : (
              <p className="mt-2 text-lg text-muted-foreground">Parece que no hay novelas disponibles en este momento. ¡Vuelve pronto!</p>
            )}
          </div>
        )}
      </section>

      <Separator className="my-10 sm:my-12" />
        
      {totalActiveFilterCount > 0 && (
        <div className="mb-6 text-center">
            <Button variant="outline" onClick={clearAllFilters} className="w-full sm:w-auto">
                <FilterX className="mr-2 h-4 w-4" /> Limpiar Filtros ({totalActiveFilterCount})
            </Button>
        </div>
      )}

      <section className="space-y-8">
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center"><LayoutGrid className="mr-2 h-5 w-5" />Categorías</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Badge variant={selectedCategory === null ? 'default' : 'outline'} className="cursor-pointer text-sm px-3 py-1.5" onClick={() => handleBadgeCategorySelect(null)}>Todas ({initialNovels.length})</Badge>
            {allUniqueCategories.map(category => ((categoryCounts[category] > 0 || PREDEFINED_CATEGORIES.includes(category)) &&
              <Badge key={category} variant={selectedCategory === category ? 'default' : 'outline'} className="cursor-pointer text-sm px-3 py-1.5" onClick={() => handleBadgeCategorySelect(category)}>{category} ({categoryCounts[category] || 0})</Badge>
            ))}
          </CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle className="text-lg flex items-center"><Tags className="mr-2 h-5 w-5" />Etiquetas</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
                <Badge variant={selectedTag === null ? 'default' : 'outline'} className="cursor-pointer text-sm px-3 py-1.5" onClick={() => handleBadgeTagSelect(null)}>Todas ({initialNovels.length})</Badge>
                {allUniqueTags.map(tag => ((tagCounts[tag] > 0 || PREDEFINED_TAGS.includes(tag)) &&
                  <Badge key={tag} variant={selectedTag === tag ? 'default' : 'outline'} className="cursor-pointer text-sm px-3 py-1.5" onClick={() => handleBadgeTagSelect(tag)}>{tag} ({tagCounts[tag] || 0})</Badge>
                ))}
            </CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle className="text-lg flex items-center"><Shield className="mr-2 h-5 w-5" />Clasificación de Edad</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
                <Badge variant={selectedAgeRating === null ? 'default' : 'outline'} className="cursor-pointer text-sm px-3 py-1.5" onClick={() => handleBadgeAgeRatingSelect(null)}>Todas ({initialNovels.length})</Badge>
                {AGE_RATING_VALUES.map(ar => ((ageRatingCounts[ar] > 0) &&
                  <Badge key={ar} variant={selectedAgeRating === ar ? 'default' : 'outline'} className="cursor-pointer text-sm px-3 py-1.5" onClick={() => handleBadgeAgeRatingSelect(ar)}>{ageRatingLabels[ar]} ({ageRatingCounts[ar] || 0})</Badge>
                ))}
            </CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle className="text-lg flex items-center"><ClockIcon className="mr-2 h-5 w-5" />Estado de la Novela</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
                <Badge variant={selectedStatus === null ? 'default' : 'outline'} className="cursor-pointer text-sm px-3 py-1.5" onClick={() => handleBadgeStatusSelect(null)}>Todos ({initialNovels.length})</Badge>
                {STATUS_VALUES.map(st => ((statusCounts[st] > 0) &&
                  <Badge key={st} variant={selectedStatus === st ? 'default' : 'outline'} className="cursor-pointer text-sm px-3 py-1.5" onClick={() => handleBadgeStatusSelect(st)}>{novelStatusLabels[st]} ({statusCounts[st] || 0})</Badge>
                ))}
            </CardContent>
        </Card>
      </section>
    </div>
  );
}
