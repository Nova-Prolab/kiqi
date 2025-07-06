
'use client';

import { useState, useTransition } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Comment } from '@/lib/types';
import { addCommentAction, fetchCommentsAction } from '@/actions/commentActions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, MessageCircle, User, AlertTriangle, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '../ui/separator';

interface ChapterCommentsProps {
  novelId: string;
  chapterId: string;
}

export default function ChapterComments({ novelId, chapterId }: ChapterCommentsProps) {
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [isLoading, startLoadingTransition] = useTransition();
  const [isSubmitting, startSubmittingTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [commentText, setCommentText] = useState('');
  const { toast } = useToast();
  
  const handleLoadComments = () => {
    startLoadingTransition(async () => {
      setError(null);
      const result = await fetchCommentsAction(novelId, chapterId);
      if (result.comments) {
        setComments(result.comments);
      } else {
        setError(result.error || 'No se pudieron cargar los comentarios.');
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !commentText.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error de Validación',
        description: 'Por favor, introduce tu nombre y un comentario.',
      });
      return;
    }
    
    startSubmittingTransition(async () => {
      const result = await addCommentAction(novelId, chapterId, name, commentText);
      if (result.newComment) {
        setComments(prev => [result.newComment!, ...(prev || [])]);
        setCommentText('');
        toast({
          title: '¡Comentario Publicado!',
          description: 'Tu comentario ha sido añadido.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error al Publicar',
          description: result.error || 'No se pudo publicar tu comentario.',
        });
      }
    });
  };

  return (
    <Card className="shadow rounded-lg border mt-6">
      <CardHeader>
        <CardTitle className="flex items-center text-primary text-xl sm:text-2xl">
          <MessageCircle className="mr-3 h-6 w-6" />
          Comentarios
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {comments === null ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">Los comentarios para este capítulo no se han cargado.</p>
            <Button onClick={handleLoadComments} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageCircle className="mr-2 h-4 w-4" />}
              {isLoading ? 'Cargando...' : 'Cargar Comentarios'}
            </Button>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="ml-4 text-muted-foreground">Cargando comentarios...</p>
          </div>
        ) : error ? (
           <div className="text-center py-8 text-destructive bg-destructive/10 rounded-md">
              <AlertTriangle className="mx-auto h-8 w-8 mb-3" />
              <p className="font-semibold">Error al cargar</p>
              <p className="text-sm mt-1 mb-4">{error}</p>
              <Button variant="outline" onClick={handleLoadComments}>Intentar de Nuevo</Button>
            </div>
        ) : (
          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-md bg-muted/30">
              <h3 className="font-semibold text-lg">Deja tu comentario</h3>
              <div className="space-y-2">
                <Label htmlFor="comment-name" className="flex items-center"><User className="mr-2 h-4 w-4" />Nombre</Label>
                <Input
                  id="comment-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre o apodo..."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="comment-text" className="flex items-center"><MessageCircle className="mr-2 h-4 w-4" />Comentario</Label>
                <Textarea
                  id="comment-text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Escribe tu comentario aquí..."
                  required
                  rows={4}
                />
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                {isSubmitting ? 'Publicando...' : 'Publicar Comentario'}
              </Button>
            </form>
            
            <Separator />

            <div>
                <h3 className="font-semibold text-lg mb-4">
                    {comments.length > 0 ? `Comentarios (${comments.length})` : 'Aún no hay comentarios'}
                </h3>
                {comments.length > 0 ? (
                    <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-3">
                        {comments.map(comment => (
                            <div key={comment.id} className="flex gap-4">
                                <div className="bg-primary text-primary-foreground rounded-full h-10 w-10 flex items-center justify-center shrink-0 font-bold">
                                    {comment.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-grow">
                                    <div className="flex items-baseline gap-2">
                                        <p className="font-semibold text-foreground">{comment.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true, locale: es })}
                                        </p>
                                    </div>
                                    <p className="text-foreground/90 mt-1 whitespace-pre-wrap">{comment.content}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground py-6">Sé el primero en comentar.</p>
                )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
