
'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Novel, RecentChapterInfo } from '@/lib/types';
import { useRecentlyRead } from '@/hooks/useRecentlyRead';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { List, ChevronRight, BookOpen, ArrowLeft, Tag, CalendarDays, UserCircle, Clock, History, BookCheck, FileText, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import React, { useState, useEffect, useMemo } from 'react';

interface NovelDetailClientProps {
  novel: Novel;
}

const MAX_INITIAL_SUMMARY_LINES = 6;
const MAX_RECENT_TO_DISPLAY = 3;

function FullScreenChapterLoader() {
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
      <Loader2 className="h-16 w-16 text-primary animate-spin" />
      <p className="mt-4 text-lg font-semibold text-primary">Cargando capítulo...</p>
    </div>
  );
}

export default function NovelDetailClient({ novel }: NovelDetailClientProps) {
  const sortedChapters = useMemo(() => novel.chapters?.sort((a,b) => a.order - b.order) || [], [novel.chapters]);
  const firstChapter = sortedChapters.length > 0 ? sortedChapters[0] : null;

  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [isLongSummary, setIsLongSummary] = useState(false);
  const [recentChapterDetails, setRecentChapterDetails] = useState<RecentChapterInfo[]>([]);
  const { getRecentlyReadChaptersForNovel } = useRecentlyRead();
  const [isMounted, setIsMounted] = useState(false);
  const [isNavigatingToChapter, setIsNavigatingToChapter] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && novel?.id) {
      const recent = getRecentlyReadChaptersForNovel(novel.id);
      setRecentChapterDetails(recent.slice(0, MAX_RECENT_TO_DISPLAY));
    }
  }, [novel?.id, getRecentlyReadChaptersForNovel, isMounted]);


  const processedSummaryContent = useMemo(() => {
    if (!novel?.summary) return "";
    // Explicitly replace literal '\\n' with actual newline character '\n'
    // Then, split by the actual newline character
    return novel.summary.replace(/\\n/g, '\n');
  }, [novel?.summary]);

  const summaryLines = useMemo(() => processedSummaryContent.split('\n'), [processedSummaryContent]);

  useEffect(() => {
    if (summaryLines.length > MAX_INITIAL_SUMMARY_LINES) {
      setIsLongSummary(true);
    } else {
      setIsLongSummary(false);
      setIsSummaryExpanded(false); // Reset expansion if summary is short
    }
  }, [summaryLines]);

  const displayedSummaryLines = isLongSummary && !isSummaryExpanded
    ? summaryLines.slice(0, MAX_INITIAL_SUMMARY_LINES)
    : summaryLines;

  const handleChapterLinkClick = () => {
    setIsNavigatingToChapter(true);
  };

  if (!novel) {
    // This case should ideally be handled by the page component (e.g., with notFound())
    // but adding a fallback here for safety.
    return <p>Información de la novela no disponible.</p>;
  }

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
            <Card className="overflow-hidden shadow-lg rounded-lg border">
              <Image
                src={novel.coverImage}
                alt={`Portada de ${novel.title}`}
                width={400}
                height={600}
                className="object-cover w-full aspect-[2/3]"
                priority
              />
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
                <Link href={`/?q=Autor:${encodeURIComponent(novel.author)}`} className="text-primary hover:underline font-medium">
                  {novel.author}
                </Link>
              </p>
            </header>

            <Card className="border">
              <CardHeader>
                <CardTitle className="text-xl">Descripción</CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="text-foreground/80 leading-relaxed">
                  {displayedSummaryLines.map((line, index) => (
                    <React.Fragment key={index}>
                      {line}
                      {index < displayedSummaryLines.length - 1 && <br />}
                    </React.Fragment>
                  ))}
                  {isLongSummary && !isSummaryExpanded && ! (summaryLines.length <= MAX_INITIAL_SUMMARY_LINES) && (
                    <span className="text-muted-foreground">...</span>
                  )}
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
              <CardContent className="space-y-3">
                  {novel.categoria && (
                      <div className="flex items-center text-sm">
                          <List className="mr-2 h-4 w-4 text-muted-foreground" />
                          <strong>Categoría:</strong>
                          <Link href={`/?q=Categoría:${encodeURIComponent(novel.categoria)}`} className="ml-2">
                              <Badge variant="outline" className="cursor-pointer hover:bg-accent/80 hover:text-accent-foreground">{novel.categoria}</Badge>
                          </Link>
                      </div>
                  )}
                  {novel.traductor && (
                      <div className="flex items-center text-sm">
                          <UserCircle className="mr-2 h-4 w-4 text-muted-foreground" />
                          <strong>Traductor:</strong>
                          <Link href={`/?q=Traductor:${encodeURIComponent(novel.traductor)}`} className="ml-2 text-primary hover:underline">
                              {novel.traductor}
                          </Link>
                      </div>
                  )}
                  {novel.lastUpdateDate && (
                      <div className="flex items-center text-sm">
                          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                          <strong>Última Actualización:</strong><span className="ml-2">{novel.lastUpdateDate}</span>
                      </div>
                  )}
                  {novel.etiquetas && novel.etiquetas.length > 0 && (
                      <div className="flex items-start text-sm">
                          <Tag className="mr-2 h-4 w-4 text-muted-foreground mt-0.5" />
                          <strong>Etiquetas:</strong>
                          <div className="ml-2 flex flex-wrap gap-1">
                              {novel.etiquetas.map(tag => (
                                  <Link key={tag} href={`/?q=Etiqueta:${encodeURIComponent(tag)}`} legacyBehavior>
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

    

    