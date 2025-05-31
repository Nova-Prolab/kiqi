
import Link from 'next/link';
import Image from 'next/image';
import type { Novel, AgeRating, NovelStatus } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AgeRatingBadge from '@/components/ui/AgeRatingBadge'; 
import StarRatingDisplay from '@/components/ui/StarRatingDisplay';
import { cn } from "@/lib/utils";
import { CheckCircle, Clock, PauseCircle, XCircle } from 'lucide-react';

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

const novelStatusDetails: Record<NovelStatus, { text: string; Icon: React.ElementType; colorClass: string }> = {
  ongoing: { text: 'En curso', Icon: Clock, colorClass: 'bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-300' },
  completed: { text: 'Completada', Icon: CheckCircle, colorClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300' },
  hiatus: { text: 'Hiato', Icon: PauseCircle, colorClass: 'bg-orange-100 text-orange-700 dark:bg-orange-900/60 dark:text-orange-300' },
  dropped: { text: 'Abandonada', Icon: XCircle, colorClass: 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300' },
};

export default function NovelCard({ novel }: NovelCardProps) {
  const borderColorClass = novel.ageRating ? ageRatingBorderColorMap[novel.ageRating] : 'border-border';
  const statusInfo = novel.status ? novelStatusDetails[novel.status] : null;

  return (
    <Link href={`/novels/${novel.id}`} passHref legacyBehavior>
      <a className="block h-full group">
        <Card className={cn(
          "h-full flex flex-col overflow-hidden hover:shadow-xl transition-all duration-300 ease-in-out rounded-lg bg-card border-2",
          borderColorClass
        )}>
          <CardHeader className="p-0 relative aspect-[3/4] w-full overflow-hidden">
            <Image
              src={novel.coverImage}
              alt={`Portada de ${novel.title}`}
              width={300}
              height={400}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
              priority={novel.etiquetas?.includes('destacado')}
            />
            {novel.ageRating && (
              <div className="absolute top-2 right-2 z-10">
                <AgeRatingBadge rating={novel.ageRating} />
              </div>
            )}
             {statusInfo && (
              <div className="absolute top-2 left-2 z-10">
                <Badge className={cn("text-xs px-1.5 py-0.5 flex items-center gap-1 pointer-events-none", statusInfo.colorClass)}>
                  <statusInfo.Icon className="h-3 w-3" />
                  {statusInfo.text}
                </Badge>
              </div>
            )}
          </CardHeader>
          <CardContent className="pt-3 px-3 flex-grow flex flex-col">
            <CardTitle className="text-sm sm:text-base font-semibold leading-tight group-hover:text-primary transition-colors line-clamp-2">
              {novel.title}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{novel.author}</p>
            {novel.rating_platform !== undefined && novel.rating_platform > 0 && (
              <div className="mt-1.5">
                <StarRatingDisplay rating={novel.rating_platform} size={14} />
              </div>
            )}
          </CardContent>
          <CardFooter className="pt-1 pb-3 px-3 flex justify-between items-center mt-auto">
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
