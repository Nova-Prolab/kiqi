
'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Novel } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { List, ChevronRight, BookOpen, ArrowLeft, Tag, CalendarDays, UserCircle, VenetianMask } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface NovelDetailClientProps {
  novel: Novel;
}

export default function NovelDetailClient({ novel }: NovelDetailClientProps) {
  const sortedChapters = novel.chapters?.sort((a,b) => a.order - b.order) || [];
  const firstChapter = sortedChapters.length > 0 ? sortedChapters[0] : null;

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
                Start Reading (Chapter {firstChapter.order})
              </Link>
            </Button>
          )}
        </div>

        <div className="md:col-span-2 space-y-6">
          <header>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-primary">{novel.title}</h1>
            <p className="text-lg sm:text-xl text-muted-foreground mt-1">by {novel.author}</p>
          </header>
          
          <Card className="border">
            <CardHeader>
              <CardTitle className="text-xl">Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-foreground/80 leading-relaxed">
                {novel.summary.split('\n').map((line, index, array) => (
                  <span key={index}>
                    {line}
                    {index < array.length - 1 && <br />}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border">
            <CardHeader>
                <CardTitle className="text-xl">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {novel.categoria && (
                    <div className="flex items-center text-sm">
                        <List className="mr-2 h-4 w-4 text-muted-foreground" />
                        <strong>Categoría:</strong><span className="ml-2">{novel.categoria}</span>
                    </div>
                )}
                {novel.traductor && (
                    <div className="flex items-center text-sm">
                        <UserCircle className="mr-2 h-4 w-4 text-muted-foreground" />
                        <strong>Traductor:</strong><span className="ml-2">{novel.traductor}</span>
                    </div>
                )}
                 {novel.fecha_lanzamiento && (
                    <div className="flex items-center text-sm">
                        <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
                        <strong>Lanzamiento:</strong><span className="ml-2">{novel.fecha_lanzamiento}</span>
                    </div>
                )}
                {novel.etiquetas && novel.etiquetas.length > 0 && (
                    <div className="flex items-start text-sm">
                        <Tag className="mr-2 h-4 w-4 text-muted-foreground mt-0.5" />
                        <strong>Etiquetas:</strong>
                        <div className="ml-2 flex flex-wrap gap-1">
                            {novel.etiquetas.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
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
          Chapters
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
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </CardContent>
                    </Card>
                  </a>
                </Link>
              ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No chapters available for this novel yet.</p>
        )}
      </section>
    </div>
  );
}
