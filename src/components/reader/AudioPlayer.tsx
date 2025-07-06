
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Music4 } from 'lucide-react';
import { cn } from '@/lib/utils';
import React from 'react';

interface AudioPlayerProps {
  src: string;
  title: string;
  onClose: () => void;
  className?: string;
}

const AudioPlayer = ({ src, title, onClose, className }: AudioPlayerProps) => {
  return (
    <Card 
      className={cn(
        "fixed bottom-4 left-1/2 -translate-x-1/2 z-[120] w-[95%] max-w-2xl shadow-2xl border-primary/20",
        "bg-background/80 backdrop-blur-md",
        "animate-in slide-in-from-bottom-10 fade-in-25 duration-300",
        className
      )}
    >
      <CardContent className="p-3 flex items-center gap-4">
        <Music4 className="h-6 w-6 text-primary flex-shrink-0" />
        <div className="flex-grow flex flex-col min-w-0">
          <p className="text-sm font-semibold truncate text-foreground" title={title}>
            {title}
          </p>
          <audio controls autoPlay src={src} className="w-full h-10 mt-1">
            Tu navegador no soporta el elemento de audio.
          </audio>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="flex-shrink-0" aria-label="Cerrar reproductor de audio">
          <X className="h-5 w-5" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default React.memo(AudioPlayer);
