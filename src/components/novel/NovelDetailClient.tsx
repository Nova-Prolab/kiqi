'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Novel } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { List, ChevronRight, BookOpen, Github } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface NovelDetailClientProps {
  novel: Novel;
}

export default function NovelDetailClient({ novel }: NovelDetailClientProps) {
    let coverImageUrl = novel.coverImage;
    let aiHint = "book cover"; 
    if (novel.coverImage.includes('placehold.co') && novel.coverImage.includes('data-ai-hint=')) {
      try {
        const url = new URL(novel.coverImage);
        const hintParam = url.searchParams.get('data-ai-hint');
        if (hintParam) {
          aiHint = hintParam;
          url.searchParams.delete('data-ai-hint');
          coverImageUrl = url.toString();
        }
      } catch (e) {
        console.warn("Error parsing cover image URL for AI hint:", e);
      }
    }


  return (
    <div className="space-y-8">
      <section className="grid md:grid-cols-3 gap-8 items-start">
        <div className="md:col-span-1">
          <Card className="overflow-hidden shadow-lg rounded-lg border">
            <Image
              src={coverImageUrl}
              alt={`Cover of ${novel.title}`}
              width={400}
              height={600}
              className="object-cover w-full aspect-[2/3]"
              data-ai-hint={aiHint}
              priority 
            />
          </Card>
          {novel.githubRepoUrl && (
             <Button variant="outline" className="w-full mt-4" asChild>
               <a href={novel.githubRepoUrl} target="_blank" rel="noopener noreferrer">
                 <Github className="mr-2 h-4 w-4" />
                 View on GitHub
               </a>
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
              <p className="text-foreground/80 leading-relaxed whitespace-pre-line">{novel.summary}</p>
            </CardContent>
          </Card>
          
          {novel.chapters && novel.chapters.length > 0 && (
            <Button size="lg" className="w-full md:w-auto" asChild>
              <Link href={`/novels/${novel.id}/chapters/${novel.chapters.sort((a,b) => a.order - b.order)[0].id}`}>
                <BookOpen className="mr-2 h-5 w-5" />
                Start Reading (Chapter {novel.chapters.sort((a,b) => a.order - b.order)[0].order})
              </Link>
            </Button>
          )}
        </div>
      </section>

      <Separator />

      <section>
        <h2 className="text-2xl sm:text-3xl font-semibold mb-6 flex items-center text-primary">
          <List className="mr-3 h-6 w-6 sm:h-7 sm:w-7" />
          Chapters
        </h2>
        {novel.chapters && novel.chapters.length > 0 ? (
          <div className="space-y-3">
            {novel.chapters
              .sort((a, b) => a.order - b.order)
              .map((chapter) => (
                <Link key={chapter.id} href={`/novels/${novel.id}/chapters/${chapter.id}`} passHref legacyBehavior>
                  <a className="block">
                    <Card className="hover:shadow-md transition-shadow duration-200 ease-in-out border hover:border-primary group">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                            Chapter {chapter.order}: {chapter.title}
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
