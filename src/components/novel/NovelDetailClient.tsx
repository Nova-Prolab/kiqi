
'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Novel, RecentChapterInfo, NovelStatus } from '@/lib/types';
import { useRecentlyRead } from '@/hooks/useRecentlyRead';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import StarRatingDisplay from '@/components/ui/StarRatingDisplay';
import NovelCard from '@/components/novel/NovelCard';
import { fetchNovels } from '@/lib/github';
import { 
  List, ChevronRight, BookOpen, ArrowLeft, Tag, CalendarDays, UserCircle, Clock, History, 
  BookCheck, FileText, Users, Shield, BarChart, Loader2, Award, ThumbsUp, TrendingUp,
  CheckCircle, PauseCircle, XCircle, BookCopy
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import React, { useState, useEffect, useMemo } from 'react';
import AgeRatingBadge from '@/components/ui/AgeRatingBadge';
import { cn } from "@/lib/utils";

interface NovelDetailClientProps {
  novel: Novel;
}

const MAX_INITIAL_SUMMARY_LINES = 6;
const MAX_RECENT_TO_DISPLAY = 3;
const MAX_SIMILAR_NOVELS_TO_DISPLAY = 5;

const novelStatusDetails: Record<NovelStatus, { text: string; Icon: React.ElementType; colorClass: string; badgeBorderClass?: string }> = {
  ongoing: { text: 'En curso', Icon: Clock, colorClass: 'bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-300', badgeBorderClass: 'border-sky-300 dark:border-sky-700' },
  completed: { text: 'Completada', Icon: CheckCircle, colorClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300', badgeBorderClass: 'border-emerald-300 dark:border-emerald-700' },
  hiatus: { text: 'En Hiato', Icon: PauseCircle, colorClass: 'bg-orange-100 text-orange-700 dark:bg-orange-900/60 dark:text-orange-300', badgeBorderClass: 'border-orange-300 dark:border-orange-700' },
  dropped: { text: 'Abandonada', Icon: XCircle, colorClass: 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300', badgeBorderClass: 'border-rose-300 dark:border-rose-700' },
};


function FullScreenChapterLoader() {
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
      <Loader2 className="h-16 w-16 text-primary animate-spin" />
      <p className="mt-4 text-lg font-semibold text-primary">Cargando capítulo...</p>
    </div>
  );
}

const NovelDetailClient = ({ novel }: NovelDetailClientProps) => {
  const sortedChapters = useMemo(() => novel.chapters?.sort((a,b) => a.order - b.order) || [], [novel.chapters]);
  const firstChapter = sortedChapters.length > 0 ? sortedChapters[0] : null;

  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [isLongSummary, setIsLongSummary] = useState(false);
  const [recentChapterDetails, setRecentChapterDetails] = useState<RecentChapterInfo[]>([]);
  const { getRecentlyReadChaptersForNovel } = useRecentlyRead();
  const [isMounted, setIsMounted] = useState(false);
  const [isNavigatingToChapter, setIsNavigatingToChapter] = useState(false);

  const [allNovels, setAllNovels] = useState<Novel[]>([]);
  const [isLoadingAllNovels, setIsLoadingAllNovels] = useState(true);

  useEffect(() => {
    setIsMounted(true);
    async function loadAllNovels() {
      try {
        const fetchedNovels = await fetchNovels();
        setAllNovels(fetchedNovels);
      } catch (error) {
        console.error("Error fetching all novels for similar novels section:", error);
        setAllNovels([]); 
      } finally {
        setIsLoadingAllNovels(false);
      }
    }
    loadAllNovels();
  }, []);

  useEffect(() => {
    if (isMounted && novel?.id) {
      const recent = getRecentlyReadChaptersForNovel(novel.id);
      setRecentChapterDetails(recent.slice(0, MAX_RECENT_TO_DISPLAY));
    }
  }, [novel?.id, getRecentlyReadChaptersForNovel, isMounted]);


  const processedSummaryContent = useMemo(() => {
    if (!novel?.summary) return "";
    return novel.summary.replace(/\\n/g, '\n');
  }, [novel?.summary]);

  const summaryLines = useMemo(() => processedSummaryContent.split('\n'), [processedSummaryContent]);

  useEffect(() => {
    if (summaryLines.length > MAX_INITIAL_SUMMARY_LINES) {
      setIsLongSummary(true);
    } else {
      setIsLongSummary(false);
      setIsSummaryExpanded(false); 
    }
  }, [summaryLines]);

  const displayedSummary = isLongSummary && !isSummaryExpanded
    ? summaryLines.slice(0, MAX_INITIAL_SUMMARY_LINES).join('\n') + (summaryLines.length > MAX_INITIAL_SUMMARY_LINES ? '...' : '')
    : processedSummaryContent;

  const handleChapterLinkClick = () => {
    setIsNavigatingToChapter(true);
  };

  const readingProgress = useMemo(() => {
    if (!isMounted || sortedChapters.length === 0) return { percent: 0, lastReadOrder: 0 };
    const recentForThisNovel = getRecentlyReadChaptersForNovel(novel.id);
    if (recentForThisNovel.length === 0) return { percent: 0, lastReadOrder: 0 };
    
    const highestOrderRead = Math.max(...recentForThisNovel.map(ch => ch.order), 0);
    const totalChapters = sortedChapters.length;
    const percent = totalChapters > 0 ? (highestOrderRead / totalChapters) * 100 : 0;
    return { percent: Math.min(100, percent), lastReadOrder: highestOrderRead };
  }, [isMounted, sortedChapters, getRecentlyReadChaptersForNovel, novel.id]);

  const similarNovels = useMemo(() => {
    if (!novel || allNovels.length === 0 || isLoadingAllNovels) return [];

    const currentNovelTags = new Set(novel.etiquetas?.map(t => t.toLowerCase()) || []);
    
    return allNovels
      .filter(n => n.id !== novel.id) 
      .map(n => {
        let score = 0;
        if (novel.categoria && n.categoria && novel.categoria.toLowerCase() === n.categoria.toLowerCase()) {
          score += 5; 
        }
        const commonTags = n.etiquetas?.filter(tag => currentNovelTags.has(tag.toLowerCase())).length || 0;
        score += commonTags;
        return { ...n, score };
      })
      .filter(n => n.score > 0) 
      .sort((a, b) => b.score - a.score) 
      .slice(0, MAX_SIMILAR_NOVELS_TO_DISPLAY);
  }, [novel, allNovels, isLoadingAllNovels]);

  if (!novel) {
    return <p>Información de la novela no disponible.</p>;
  }
  
  const statusInfo = novel.status ? novelStatusDetails[novel.status] : null;

  return (
    <>
      {isNavigatingToChapter && <FullScreenChapterLoader />}
      <div className="space-y-8">
        <div className="mb-6">
          <Button variant="outline" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Todas las novelas
            </Link>
          </Button>
        </div>

        <section className="grid md:grid-cols-3 gap-8 items-start">
          <div className="md:col-span-1 space-y-4">
            <Card className="overflow-hidden shadow-lg rounded-lg border relative">
              <Image
                src={novel.coverImage}
                alt={`Portada de ${novel.title}`}
                width={400}
                height={600}
                className="object-cover w-full aspect-[2/3]"
                priority
              />
              {novel.ageRating && (
                <div className="absolute top-3 right-3 z-10">
                  <AgeRatingBadge rating={novel.ageRating} />
                </div>
              )}
              {statusInfo && (
                <div className="absolute top-3 left-3 z-10">
                    <Badge className={cn("text-xs px-1.5 py-0.5 flex items-center gap-1 pointer-events-none border", statusInfo.colorClass, statusInfo.badgeBorderClass)}>
                        <statusInfo.Icon className="h-3 w-3" />
                        {statusInfo.text}
                    </Badge>
                </div>
              )}
            </Card>
             {firstChapter && (
              <Button 
                size="lg" 
                className="w-full" 
                asChild
                onClick={handleChapterLinkClick}
              >
                <Link href={`/novels/${novel.id}/chapters/${firstChapter.id}`}>
                  <BookOpen className="mr-2 h-5 w-5" />
                  Empezar a Leer (Cap. {firstChapter.order})
                </Link>
              </Button>
            )}
          </div>

          <div className="md:col-span-2 space-y-6">
            <header>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-primary">{novel.title}</h1>
              <p className="text-lg sm:text-xl text-muted-foreground mt-1">
                por{' '}
                <Link href={`/?st=author&q=${encodeURIComponent(novel.author)}`} className="text-primary hover:underline font-medium">
                  {novel.author}
                </Link>
              </p>
              {novel.rating_platform !== undefined && novel.rating_platform > 0 && (
                <div className="mt-2 flex items-center gap-2">
                    <StarRatingDisplay rating={novel.rating_platform} size={20} />
                    <span className="text-sm text-amber-500 font-medium">Aprobado por Kiqi!</span>
                </div>
              )}
            </header>

            <Card className="border">
              <CardHeader>
                <CardTitle className="text-xl">Descripción</CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="text-foreground/80 leading-relaxed whitespace-pre-line">
                    {displayedSummary}
                </div>
                {isLongSummary && (
                  <Button
                    variant="link"
                    className="p-0 h-auto text-sm mt-2 text-primary hover:text-primary/80"
                    onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
                  >
                    {isSummaryExpanded ? 'Ver menos' : 'Ver más'}
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className="border">
              <CardHeader>
                  <CardTitle className="text-xl">Detalles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                   {novel.ageRating && (
                     <div className="flex items-center">
                        <Shield className="mr-2.5 h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <strong className="w-32 sm:w-40 flex-shrink-0">Clasificación:</strong>
                        <span className="ml-2"><AgeRatingBadge rating={novel.ageRating} /></span>
                      </div>
                   )}
                  {statusInfo && (
                     <div className="flex items-center">
                        <statusInfo.Icon className="mr-2.5 h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <strong className="w-32 sm:w-40 flex-shrink-0">Estado:</strong>
                        <Badge className={cn("ml-2 text-xs border", statusInfo.colorClass, statusInfo.badgeBorderClass)}>{statusInfo.text}</Badge>
                      </div>
                   )}
                  {novel.categoria && (
                      <div className="flex items-center">
                          <List className="mr-2.5 h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <strong className="w-32 sm:w-40 flex-shrink-0">Categoría:</strong>
                          <Link href={`/?st=category_search&q=${encodeURIComponent(novel.categoria)}`} className="ml-2">
                              <Badge variant="outline" className="cursor-pointer hover:bg-accent/80 hover:text-accent-foreground">{novel.categoria}</Badge>
                          </Link>
                      </div>
                  )}
                  {novel.traductor && (
                      <div className="flex items-center">
                          <Users className="mr-2.5 h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <strong className="w-32 sm:w-40 flex-shrink-0">Traductor:</strong>
                          <Link href={`/?st=translator&q=${encodeURIComponent(novel.traductor)}`} className="ml-2 text-primary hover:underline">
                              {novel.traductor}
                          </Link>
                      </div>
                  )}
                  {novel.lastUpdateDate && ( 
                      <div className="flex items-center">
                          <CalendarDays className="mr-2.5 h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <strong className="w-32 sm:w-40 flex-shrink-0">Lanzamiento:</strong>
                          <span className="ml-2">{novel.fecha_lanzamiento || novel.lastUpdateDate}</span>
                      </div>
                  )}
                  {novel.chapters && (
                     <div className="flex items-center">
                        <FileText className="mr-2.5 h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <strong className="w-32 sm:w-40 flex-shrink-0">Capítulos:</strong>
                        <span className="ml-2">{novel.chapters.length}</span>
                      </div>
                  )}
                  {novel.etiquetas && novel.etiquetas.length > 0 && (
                      <div className="flex items-start">
                          <Tag className="mr-2.5 h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <strong className="w-32 sm:w-40 flex-shrink-0 mt-0.5">Etiquetas:</strong>
                          <div className="ml-2 flex flex-wrap gap-1">
                              {novel.etiquetas.map(tag => (
                                  <Link key={tag} href={`/?st=tag_search&q=${encodeURIComponent(tag)}`} legacyBehavior>
                                      <Badge variant="secondary" className="cursor-pointer hover:bg-accent/80 hover:text-accent-foreground">{tag}</Badge>
                                  </Link>
                              ))}
                          </div>
                      </div>
                  )}
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator />

        {isMounted && sortedChapters.length > 0 && (
          <section>
            <Card className="border shadow-sm">
              <CardHeader>
                  <CardTitle className="text-xl sm:text-2xl flex items-center text-primary/90">
                      <TrendingUp className="mr-3 h-5 w-5 sm:h-6 sm:w-6"/>
                      Tu Progreso
                  </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                  {readingProgress.lastReadOrder > 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Has leído hasta el <span className="font-semibold text-foreground">Capítulo {readingProgress.lastReadOrder}</span> de {sortedChapters.length}.
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      ¡Empieza a leer esta novela para ver tu progreso aquí! Hay {sortedChapters.length} capítulos disponibles.
                    </p>
                  )}
                  <Progress value={readingProgress.percent} aria-label={`${readingProgress.percent.toFixed(0)}% leído`} className="h-3"/>
                   {readingProgress.percent > 0 && readingProgress.percent < 100 && readingProgress.lastReadOrder < sortedChapters.length && (
                     <Button variant="outline" size="sm" asChild className="mt-3" onClick={handleChapterLinkClick}>
                       <Link href={`/novels/${novel.id}/chapters/${sortedChapters[readingProgress.lastReadOrder].id}`}>
                         Continuar Leyendo (Cap. {readingProgress.lastReadOrder + 1})
                         <ChevronRight className="ml-1 h-4 w-4" />
                       </Link>
                     </Button>
                   )}
              </CardContent>
            </Card>
             <Separator className="my-8" />
          </section>
        )}

        {isMounted && recentChapterDetails.length > 0 && (
          <section>
            <Card className="border bg-card/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl flex items-center text-primary/90">
                  <History className="mr-3 h-5 w-5 sm:h-6 sm:w-6" />
                  Leído Recientemente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {recentChapterDetails.map((chapter) => (
                    <Button 
                      key={`recent-${chapter.id}`} 
                      variant="outline" 
                      asChild 
                      className="justify-start h-auto py-2 px-3 text-left group"
                      onClick={handleChapterLinkClick}
                    >
                      <Link href={`/novels/${novel.id}/chapters/${chapter.id}`}>
                        <BookCheck className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        <div className="flex flex-col">
                          <span className="font-medium text-sm text-foreground group-hover:text-primary transition-colors truncate" title={chapter.title}>
                            {chapter.title || `Capítulo ${chapter.order}`}
                          </span>
                          <span className="text-xs text-muted-foreground">Capítulo {chapter.order}</span>
                        </div>
                      </Link>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Separator className="my-8" />
          </section>
        )}
        
        {isMounted && !isLoadingAllNovels && similarNovels.length > 0 && (
          <section>
            <h2 className="text-2xl sm:text-3xl font-semibold mb-6 flex items-center text-primary">
              <BookCopy className="mr-3 h-6 w-6 sm:h-7 sm:w-7" />
              También te podría gustar
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
              {similarNovels.map((simNovel) => (
                <NovelCard key={`similar-${simNovel.id}`} novel={simNovel} />
              ))}
            </div>
             <Separator className="my-8" />
          </section>
        )}


        <section>
          <h2 className="text-2xl sm:text-3xl font-semibold mb-6 flex items-center text-primary">
            <List className="mr-3 h-6 w-6 sm:h-7 sm:w-7" />
            Capítulos ({sortedChapters.length})
          </h2>
          {sortedChapters.length > 0 ? (
            <div className="space-y-3">
              {sortedChapters
                .map((chapter) => (
                  <Link 
                    key={chapter.id} 
                    href={`/novels/${novel.id}/chapters/${chapter.id}`} 
                    passHref 
                    legacyBehavior
                  >
                    <a className="block" onClick={handleChapterLinkClick}>
                      <Card className="hover:shadow-md transition-shadow duration-200 ease-in-out border hover:border-primary group">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div>
                            <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                              {chapter.title}
                            </p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </CardContent>
                      </Card>
                    </a>
                  </Link>
                ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No hay capítulos disponibles para esta novela todavía.</p>
          )}
        </section>
      </div>
    </>
  );
}
export default React.memo(NovelDetailClient);

    