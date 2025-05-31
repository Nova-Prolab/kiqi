
'use client';

import type { AgeRating } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Smile, ShieldQuestion, UserCheck, AlertOctagon, Flame, Info } from 'lucide-react';
import React from 'react';

interface AgeRatingBadgeProps {
  rating?: AgeRating;
  className?: string;
}

interface RatingDetails {
  text: string;
  Icon: React.ElementType;
  colorClasses: string;
  tooltip: string;
}

const ratingMap: Record<AgeRating, RatingDetails> = {
  all: {
    text: 'Todos',
    Icon: Smile,
    colorClasses: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700',
    tooltip: 'Apto para todas las edades',
  },
  pg: {
    text: '+10',
    Icon: ShieldQuestion,
    colorClasses: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700',
    tooltip: 'Se recomienda supervisión parental para menores de 10 años',
  },
  teen: {
    text: '+13',
    Icon: UserCheck,
    colorClasses: 'bg-yellow-100 text-yellow-700 border-yellow-400 dark:bg-yellow-700/30 dark:text-yellow-300 dark:border-yellow-600',
    tooltip: 'Contenido para adolescentes de 13 años en adelante',
  },
  mature: {
    text: '+17',
    Icon: AlertOctagon,
    colorClasses: 'bg-orange-100 text-orange-700 border-orange-400 dark:bg-orange-700/30 dark:text-orange-300 dark:border-orange-600',
    tooltip: 'Contenido para mayores de 17 años',
  },
  adults: {
    text: '+18',
    Icon: Flame,
    colorClasses: 'bg-red-100 text-red-700 border-red-400 dark:bg-red-700/30 dark:text-red-300 dark:border-red-600',
    tooltip: 'Contenido exclusivo para adultos (+18)',
  },
};

export default function AgeRatingBadge({ rating, className }: AgeRatingBadgeProps) {
  if (!rating) {
    return (
      <Badge variant="outline" className={cn('text-xs px-2 py-0.5 flex items-center gap-1', className)}>
        <Info className="h-3 w-3" />
        N/A
      </Badge>
    );
  }

  const details = ratingMap[rating];

  if (!details) {
    return (
      <Badge variant="outline" className={cn('text-xs px-2 py-0.5 flex items-center gap-1', className)}>
        <Info className="h-3 w-3" />
        {rating}
      </Badge>
    );
  }

  const { Icon, text, colorClasses } = details;

  return (
    <Badge
      className={cn(
        'text-xs px-2.5 py-1 flex items-center gap-1.5 font-medium',
        colorClasses,
        className
      )}
      title={details.tooltip} // HTML title attribute for simple tooltip
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{text}</span>
    </Badge>
  );
}

// Helper for cn if not already globally available
// import { type ClassValue, clsx } from "clsx"
// import { twMerge } from "tailwind-merge"
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
