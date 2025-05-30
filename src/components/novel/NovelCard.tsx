import Link from 'next/link';
import Image from 'next/image';
import type { Novel } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface NovelCardProps {
  novel: Novel;
}

export default function NovelCard({ novel }: NovelCardProps) {
  return (
    <Link href={`/novels/${novel.id}`} passHref legacyBehavior>
      <a className="block h-full">
        <Card className="h-full flex flex-col overflow-hidden hover:shadow-xl transition-shadow duration-300 ease-in-out group rounded-lg border">
          <CardHeader className="p-0 relative aspect-[2/3] w-full overflow-hidden rounded-t-lg">
            <Image
              src={novel.coverImage}
              alt={`Cover of ${novel.title}`}
              width={300}
              height={450}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
              // data-ai-hint is removed as we expect real cover images
              // If a placeholder is used (e.g. from fallback in github.ts), it might not have a hint
            />
          </CardHeader>
          <CardContent className="pt-4 px-4 flex-grow">
            <CardTitle className="text-lg font-semibold leading-tight group-hover:text-primary transition-colors">
              {novel.title}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{novel.author}</p>
          </CardContent>
          <CardFooter className="pt-2 pb-4 px-4">
            <Badge variant="secondary" className="text-xs">
              {novel.chapters.length} Chapter{novel.chapters.length === 1 ? '' : 's'}
            </Badge>
          </CardFooter>
        </Card>
      </a>
    </Link>
  );
}
