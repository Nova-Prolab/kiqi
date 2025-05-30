
'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Novel } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { List, ChevronRight, BookOpen, ArrowLeft, Tag, CalendarDays, UserCircle, FileText, Clock } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import React, { useState, useEffect, useMemo } from 'react';

interface NovelDetailClientProps {
  novel: Novel;
}

const MAX_INITIAL_SUMMARY_LINES = 6;

export default function NovelDetailClient({ novel }: NovelDetailClientProps) {
  const sortedChapters = novel.chapters?.sort((a,b) => a.order - b.order) || [];
  const firstChapter = sortedChapters.length > 0 ? sortedChapters[0] : null;

  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [isLongSummary, setIsLongSummary] = useState(false);

  // Process summary to handle literal '\\n' and then split into lines
  const processedSummaryContent = useMemo(() => {
    return novel.summary.replace(/\\n/g, '\n');
  }, [novel.summary]);

  const summaryLines = useMemo(() => processedSummaryContent.split('\n'), [processedSummaryContent]);

  useEffect(() => {
    if (summaryLines.length > MAX_INITIAL_SUMMARY_LINES) {
      setIsLongSummary(true);
    } else {
      setIsLongSummary(false);
      setIsSummaryExpanded(false); 
    }
  }, [summaryLines]);

  const displayedSummaryLines = isLongSummary && !isSummaryExpanded 
    ? summaryLines.slice(0, MAX_INITIAL_SUMMARY_LINES) 
    : summaryLines;

  return (
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
              alt={`Cover of ${novel.title}`}
              width={400}
              height={600}
              className="object-cover w-full aspect-[2/3]"
              priority 
            />
          </Card>
           {firstChapter && (
            <Button size="lg" className="w-full" asChild>
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
              <CardTitle className="text-xl">Sumario</CardTitle>
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
                 {novel.lastUpdateDate && ( // Changed from fecha_lanzamiento
                    <div className="flex items-center text-sm">
                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                        <strong>Última Actualización:</strong><span className="ml-2">{novel.lastUpdateDate}</span>
                    </div>
                )}
                {novel.totalWordCount && (
                    <div className="flex items-center text-sm">
                        <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                        <strong>Palabras:</strong><span className="ml-2">{novel.totalWordCount.toLocaleString()}</span>
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

      <section>
        <h2 className="text-2xl sm:text-3xl font-semibold mb-6 flex items-center text-primary">
          <List className="mr-3 h-6 w-6 sm:h-7 sm:w-7" />
          Capítulos ({sortedChapters.length})
        </h2>
        {sortedChapters.length > 0 ? (
          <div className="space-y-3">
            {sortedChapters
              .map((chapter) => (
                <Link key={chapter.id} href={`/novels/${novel.id}/chapters/${chapter.id}`} passHref legacyBehavior>
                  <a className="block">
                    <Card className="hover:shadow-md transition-shadow duration-200 ease-in-out border hover:border-primary group">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                            {chapter.title} 
                          </p>
                           {/* Optionally, display chapter-specific word count if available on chapter object */}
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
  );
}
