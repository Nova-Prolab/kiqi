
import Link from 'next/link';
import Image from 'next/image';
import type { Novel, AgeRating } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AgeRatingBadge from '@/components/ui/AgeRatingBadge'; 
import { cn } from "@/lib/utils";

interface NovelCardProps {
  novel: Novel;
}

const ageRatingBorderColorMap: Partial<Record<AgeRating, string>> = {
  all: 'border-green-500 dark:border-green-600 hover:border-green-600 dark:hover:border-green-500',
  pg: 'border-blue-500 dark:border-blue-600 hover:border-blue-600 dark:hover:border-blue-500',
  teen: 'border-yellow-500 dark:border-yellow-600 hover:border-yellow-600 dark:hover:border-yellow-500',
  mature: 'border-orange-500 dark:border-orange-600 hover:border-orange-600 dark:hover:border-orange-500',
  adults: 'border-red-500 dark:border-red-600 hover:border-red-600 dark:hover:border-red-500',
};

export default function NovelCard({ novel }: NovelCardProps) {
  const borderColorClass = novel.ageRating ? ageRatingBorderColorMap[novel.ageRating] : 'border-border';

  return (
    <Link href={`/novels/${novel.id}`} passHref legacyBehavior>
      <a className="block h-full group">
        <Card className={cn(
          "h-full flex flex-col overflow-hidden hover:shadow-xl transition-all duration-300 ease-in-out rounded-lg bg-card border-2",
          borderColorClass
        )}>
          <CardHeader className="p-0 relative aspect-[3/4] w-full overflow-hidden"> {/* Removed rounded-t-lg for full border effect */}
            <Image
              src={novel.coverImage}
              alt={`Portada de ${novel.title}`}
              width={300}
              height={400}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
              priority={novel.etiquetas?.includes('destacado')} // Prioritize loading for featured novels
            />
            {novel.ageRating && (
              <div className="absolute top-2 right-2 z-10">
                <AgeRatingBadge rating={novel.ageRating} />
              </div>
            )}
          </CardHeader>
          <CardContent className="pt-3 px-3 flex-grow">
            <CardTitle className="text-sm sm:text-base font-semibold leading-tight group-hover:text-primary transition-colors line-clamp-2">
              {novel.title}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{novel.author}</p>
          </CardContent>
          <CardFooter className="pt-1 pb-3 px-3 flex justify-between items-center">
            {novel.chapters && novel.chapters.length > 0 ? (
              <Badge variant="secondary" className="text-xs">
                {novel.chapters.length} Cap.
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">
                Próximamente
              </Badge>
            )}
          </CardFooter>
        </Card>
      </a>
    </Link>
  );
}
