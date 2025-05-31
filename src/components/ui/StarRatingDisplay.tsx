
'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingDisplayProps {
  rating: number; // 0-5
  maxRating?: number;
  size?: number; // size of the star icon
  className?: string;
  starClassName?: string;
  filledStarClassName?: string;
  emptyStarClassName?: string;
}

export default function StarRatingDisplay({
  rating,
  maxRating = 5,
  size = 16, // Default star size
  className,
  starClassName,
  filledStarClassName = "text-amber-400 fill-amber-400", // Yellow filled stars
  emptyStarClassName = "text-muted-foreground/30", // Lighter empty stars
}: StarRatingDisplayProps) {
  const validRating = Math.max(0, Math.min(rating, maxRating)); // Ensure rating is within bounds
  const fullStars = Math.floor(validRating);
  const emptyStars = maxRating - fullStars;

  return (
    <div className={cn("flex items-center", className)}>
      {[...Array(fullStars)].map((_, i) => (
        <Star
          key={`full-${i}`}
          size={size}
          className={cn('shrink-0', starClassName, filledStarClassName)}
        />
      ))}
      {[...Array(emptyStars)].map((_, i) => (
        <Star
          key={`empty-${i}`}
          size={size}
          className={cn('shrink-0', starClassName, emptyStarClassName)}
        />
      ))}
    </div>
  );
}
