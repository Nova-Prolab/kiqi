
'use client';

import { useState, useEffect } from 'react';
import type { Advertisement } from '@/lib/types';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';
import { X } from 'lucide-react';

interface AdvertisementBannerProps {
  ad: Advertisement;
}

const DynamicIcon = ({ name }: { name?: string }) => {
  const IconComponent = name ? (LucideIcons as any)[name] : LucideIcons.Megaphone;
  if (!IconComponent) {
    return <LucideIcons.Megaphone className="h-5 w-5 flex-shrink-0" />;
  }
  return <IconComponent className="h-5 w-5 flex-shrink-0" />;
};

export default function AdvertisementBanner({ ad }: AdvertisementBannerProps) {
  const storageKey = `advertisement-dismissed-${ad.title}`;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Determine initial visibility
    const isDismissed = localStorage.getItem(storageKey) === 'true';
    if (ad.enabled && !isDismissed) {
      setIsVisible(true);
    }

    // Set up timer if duration is specified
    if (ad.enabled && !isDismissed && ad.durationSeconds) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, ad.durationSeconds * 1000);
      return () => clearTimeout(timer);
    }
  }, [ad.enabled, ad.durationSeconds, ad.title, storageKey]);

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsVisible(false);
    if (ad.dismissible) {
      localStorage.setItem(storageKey, 'true');
    }
  };

  const adStyle: React.CSSProperties = {
    background: ad.style?.background,
    color: ad.style?.color,
    borderColor: ad.style?.borderColor,
  };

  if (!isVisible) {
    return null;
  }

  const Wrapper = ad.link ? 'a' : 'div';

  return (
    <Wrapper
      href={ad.link}
      target={ad.link ? '_blank' : undefined}
      rel={ad.link ? 'noopener noreferrer' : undefined}
      className={cn(
        'group relative mb-8 flex w-full items-center gap-4 rounded-lg border-2 p-4 text-left shadow-lg transition-transform hover:scale-[1.01]',
        ad.link && 'cursor-pointer'
      )}
      style={adStyle}
    >
      <DynamicIcon name={ad.icon} />
      <div className="flex-grow">
        <h3 className="font-bold text-lg leading-tight">{ad.title}</h3>
        <p className="text-sm opacity-90">{ad.message}</p>
      </div>
      {ad.dismissible && (
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 rounded-full p-1 opacity-70 transition-opacity hover:opacity-100 group-hover:opacity-100"
          aria-label="Cerrar anuncio"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </Wrapper>
  );
}
